import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { COLLECTIONS } from '@/services/firestore'
import type {
  Tournament,
  TournamentParticipant,
  TournamentMatch,
  TournamentCategory,
} from '@/types/tournament'
import {
  generateInitialBracket,
  shuffleSeeds as shuffleSeedsPure,
  advanceWinner,
  reshuffleLosersRound,
  type BracketParticipant,
  type BracketMatch,
} from '@/utils/tournamentBracket'

// Turnuva store'u: Firestore'a doğrudan bağlanır, seçili turnuvanın
// katılımcı + maçlarına CANLI (onSnapshot) abone olur. Admin değişikliği
// student'ın read-only bracket'ına anında yansır.
//
// Bracket üretme/ilerletme/karıştırma SAF util'de (tournamentBracket.ts);
// store yalnız persist eder (batch yazımı + skor girişinde runTransaction).

export const useTournamentsStore = defineStore('tournaments', () => {
  // State
  const tournaments = ref<Tournament[]>([])
  const selectedTournamentId = ref<string | null>(null)
  const participants = ref<TournamentParticipant[]>([])
  const matches = ref<TournamentMatch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let listUnsub: Unsubscribe | null = null
  let detailUnsubs: Unsubscribe[] = []

  // Getters
  const selectedTournament = computed(
    () => tournaments.value.find((t) => t.id === selectedTournamentId.value) ?? null,
  )
  const sortedParticipants = computed(() =>
    [...participants.value].sort((a, b) => a.seed - b.seed),
  )

  // --- Canlı abonelikler ---

  /** Turnuva listesine canlı abone ol. */
  const subscribeTournaments = () => {
    if (listUnsub) return
    loading.value = true
    const colRef = collection(db, COLLECTIONS.TOURNAMENTS)
    listUnsub = onSnapshot(
      colRef,
      (snap) => {
        tournaments.value = snap.docs.map((d) => mapTournament(d.id, d.data()))
        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
      },
    )
  }

  /** Seçili turnuvanın katılımcı + maçlarına canlı abone ol. */
  const selectTournament = (id: string | null) => {
    selectedTournamentId.value = id
    detailUnsubs.forEach((u) => u())
    detailUnsubs = []
    participants.value = []
    matches.value = []
    if (!id) return

    const pq = query(
      collection(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS),
      where('tournamentId', '==', id),
    )
    detailUnsubs.push(
      onSnapshot(pq, (snap) => {
        participants.value = snap.docs.map((d) => mapParticipant(d.id, d.data()))
      }),
    )

    const mq = query(
      collection(db, COLLECTIONS.TOURNAMENT_MATCHES),
      where('tournamentId', '==', id),
    )
    detailUnsubs.push(
      onSnapshot(mq, (snap) => {
        matches.value = snap.docs.map((d) => mapMatch(d.id, d.data()))
      }),
    )
  }

  const unsubscribeAll = () => {
    listUnsub?.()
    listUnsub = null
    detailUnsubs.forEach((u) => u())
    detailUnsubs = []
  }

  // --- Aksiyonlar ---

  const createTournament = async (
    name: string,
    category: TournamentCategory,
  ): Promise<string> => {
    const ref = doc(collection(db, COLLECTIONS.TOURNAMENTS))
    const batch = writeBatch(db)
    batch.set(ref, {
      name,
      category,
      status: 'setup',
      championParticipantId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
    return ref.id
  }

  const addParticipant = async (
    tournamentId: string,
    studentIds: string[],
    displayName: string,
  ): Promise<void> => {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (t && t.status !== 'setup') {
      throw new Error('Turnuva başladıktan sonra oyuncu eklenemez')
    }
    const seed =
      (participants.value
        .filter((p) => p.tournamentId === tournamentId)
        .reduce((max, p) => Math.max(max, p.seed), 0) ?? 0) + 1
    const ref = doc(collection(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS))
    const batch = writeBatch(db)
    batch.set(ref, {
      tournamentId,
      seed,
      studentIds,
      displayName,
      eliminated: false,
      lossCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  const removeParticipant = async (
    tournamentId: string,
    participantId: string,
  ): Promise<void> => {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (t && t.status !== 'setup') {
      throw new Error('Turnuva başladıktan sonra oyuncu çıkarılamaz')
    }
    const batch = writeBatch(db)
    batch.delete(doc(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS, participantId))
    // Kalan katılımcıların seed'lerini yeniden numarala (1..n).
    const remaining = participants.value
      .filter((p) => p.tournamentId === tournamentId && p.id !== participantId)
      .sort((a, b) => a.seed - b.seed)
    remaining.forEach((p, i) => {
      batch.update(doc(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS, p.id), {
        seed: i + 1,
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }

  /** Karıştır tuşu A: başlangıç seed'lerini rastgele dağıt (yalnız setup). */
  const shuffleSeeds = async (tournamentId: string): Promise<void> => {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (t && t.status !== 'setup') {
      throw new Error('Seed yalnız turnuva başlamadan karıştırılabilir')
    }
    const current = participants.value
      .filter((p) => p.tournamentId === tournamentId)
      .map(toBracketParticipant)
    const shuffled = shuffleSeedsPure(current)
    const batch = writeBatch(db)
    shuffled.forEach((p) => {
      batch.update(doc(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS, p.id), {
        seed: p.seed,
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }

  /** Turnuvayı başlat: winners bracket'ını üret, maçları batch ile yaz. */
  const startTournament = async (tournamentId: string): Promise<void> => {
    const ps = participants.value
      .filter((p) => p.tournamentId === tournamentId)
      .map(toBracketParticipant)
    if (ps.length < 2) throw new Error('En az 2 katılımcı gerekir')

    const bracketMatches = generateInitialBracket(ps)
    const batch = writeBatch(db)
    for (const m of bracketMatches) {
      // Util kendi id'sini üretti; Firestore doc id'si olarak da kullan.
      const ref = doc(db, COLLECTIONS.TOURNAMENT_MATCHES, m.id)
      batch.set(ref, { ...stripId(m), tournamentId, updatedAt: serverTimestamp() })
    }
    batch.update(doc(db, COLLECTIONS.TOURNAMENTS, tournamentId), {
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  /**
   * Maç sonucunu kaydet: advanceWinner saf fonksiyonuyla yeni durum üret,
   * runTransaction içinde maçın hâlâ pending olduğunu doğrulayıp batch yaz.
   */
  const submitMatchResult = async (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    score: string,
  ): Promise<void> => {
    await runTransaction(db, async (tx) => {
      const matchRef = doc(db, COLLECTIONS.TOURNAMENT_MATCHES, matchId)
      const matchSnap = await tx.get(matchRef)
      if (!matchSnap.exists()) throw new Error('Maç bulunamadı')
      if (matchSnap.data().status === 'completed') {
        throw new Error('Maç zaten tamamlanmış')
      }

      const curMatches = matches.value.map(toBracketMatch)
      const curParticipants = participants.value.map(toBracketParticipant)
      const result = advanceWinner(curMatches, curParticipants, matchId, winnerId, score)

      // Değişen maçları (önceki duruma göre) yaz + yeni maçları ekle.
      const prevById = new Map(curMatches.map((m) => [m.id, m]))
      for (const m of result.matches) {
        const prev = prevById.get(m.id)
        if (!prev || JSON.stringify(prev) !== JSON.stringify(m)) {
          tx.set(doc(db, COLLECTIONS.TOURNAMENT_MATCHES, m.id), {
            ...stripId(m),
            tournamentId,
            updatedAt: serverTimestamp(),
          })
        }
      }
      for (const m of result.newMatches) {
        tx.set(doc(db, COLLECTIONS.TOURNAMENT_MATCHES, m.id), {
          ...stripId(m),
          tournamentId,
          updatedAt: serverTimestamp(),
        })
      }

      // Katılımcı lossCount/eliminated güncellemeleri. lossCount, TÜM
      // tamamlanmış maçların loser'larından türetilir (yeni durum dahil).
      const allAfter = [...result.matches, ...result.newMatches]
      const updatedParticipants = computeParticipantUpdates(curParticipants, allAfter)
      for (const p of updatedParticipants) {
        tx.update(doc(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS, p.id), {
          lossCount: p.lossCount ?? 0,
          eliminated: p.eliminated ?? false,
          updatedAt: serverTimestamp(),
        })
      }

      if (result.championId) {
        tx.update(doc(db, COLLECTIONS.TOURNAMENTS, tournamentId), {
          status: 'completed',
          championParticipantId: result.championId,
          updatedAt: serverTimestamp(),
        })
      }
    })
  }

  /** Karıştır tuşu B: belirli losers turunun pending maçlarını yeniden eşle. */
  const shuffleLosers = async (
    tournamentId: string,
    round: number,
  ): Promise<void> => {
    const curMatches = matches.value.map(toBracketMatch)
    const newRound = reshuffleLosersRound(curMatches, round)
    const oldRound = curMatches.filter(
      (m) => m.bracket === 'losers' && m.round === round,
    )
    const batch = writeBatch(db)
    // Eski pending maçları sil, yenilerini yaz (completed bye'lar korunur).
    for (const m of oldRound) {
      if (m.status === 'pending') {
        batch.delete(doc(db, COLLECTIONS.TOURNAMENT_MATCHES, m.id))
      }
    }
    for (const m of newRound) {
      if (m.status === 'pending') {
        batch.set(doc(db, COLLECTIONS.TOURNAMENT_MATCHES, m.id), {
          ...stripId(m),
          tournamentId,
          updatedAt: serverTimestamp(),
        })
      }
    }
    await batch.commit()
  }

  const deleteTournament = async (tournamentId: string): Promise<void> => {
    const batch = writeBatch(db)
    batch.delete(doc(db, COLLECTIONS.TOURNAMENTS, tournamentId))
    const ps = await getDocs(
      query(
        collection(db, COLLECTIONS.TOURNAMENT_PARTICIPANTS),
        where('tournamentId', '==', tournamentId),
      ),
    )
    ps.forEach((d) => batch.delete(d.ref))
    const ms = await getDocs(
      query(
        collection(db, COLLECTIONS.TOURNAMENT_MATCHES),
        where('tournamentId', '==', tournamentId),
      ),
    )
    ms.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  return {
    // state
    tournaments,
    selectedTournamentId,
    participants,
    matches,
    loading,
    error,
    // getters
    selectedTournament,
    sortedParticipants,
    // subscriptions
    subscribeTournaments,
    selectTournament,
    unsubscribeAll,
    // actions
    createTournament,
    addParticipant,
    removeParticipant,
    shuffleSeeds,
    startTournament,
    submitMatchResult,
    shuffleLosers,
    deleteTournament,
  }
})

// --- Mapper / dönüştürücüler ---

function mapTournament(id: string, data: any): Tournament {
  return {
    id,
    name: data.name ?? '',
    category: data.category ?? 'singles',
    status: data.status ?? 'setup',
    championParticipantId: data.championParticipantId ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  }
}

function mapParticipant(id: string, data: any): TournamentParticipant {
  return {
    id,
    tournamentId: data.tournamentId,
    seed: data.seed ?? 0,
    studentIds: data.studentIds ?? [],
    displayName: data.displayName ?? '',
    eliminated: data.eliminated ?? false,
    lossCount: data.lossCount ?? 0,
  }
}

function mapMatch(id: string, data: any): TournamentMatch {
  return {
    id,
    tournamentId: data.tournamentId,
    bracket: data.bracket,
    round: data.round,
    slotInRound: data.slotInRound,
    participant1Id: data.participant1Id ?? null,
    participant2Id: data.participant2Id ?? null,
    winnerId: data.winnerId ?? null,
    loserId: data.loserId ?? null,
    score: data.score ?? null,
    status: data.status ?? 'pending',
    nextWinnerMatchId: data.nextWinnerMatchId ?? null,
    nextLoserMatchId: data.nextLoserMatchId ?? null,
  }
}

function toBracketParticipant(p: TournamentParticipant): BracketParticipant {
  return {
    id: p.id,
    seed: p.seed,
    studentIds: p.studentIds,
    displayName: p.displayName,
    eliminated: p.eliminated,
    lossCount: p.lossCount,
  }
}

function toBracketMatch(m: TournamentMatch): BracketMatch {
  return {
    id: m.id,
    bracket: m.bracket,
    round: m.round,
    slotInRound: m.slotInRound,
    participant1Id: m.participant1Id,
    participant2Id: m.participant2Id,
    winnerId: m.winnerId,
    loserId: m.loserId,
    score: m.score,
    status: m.status,
    nextWinnerMatchId: m.nextWinnerMatchId,
    nextLoserMatchId: m.nextLoserMatchId,
  }
}

/** id alanını çıkarıp Firestore doc gövdesi döndürür. */
function stripId(m: BracketMatch): Omit<BracketMatch, 'id'> {
  const { id, ...rest } = m
  return rest
}

/**
 * advanceWinner içindeki kayıp güncellemelerini dışarıda yeniden hesaplar
 * (saf fonksiyon participants'ı kopyaladığı için sonucu doğrudan dönmüyor;
 * bunun yerine tamamlanan maçların loser'larından lossCount'u türetiriz).
 */
function computeParticipantUpdates(
  participants: BracketParticipant[],
  allMatches: BracketMatch[],
): BracketParticipant[] {
  const lossById = new Map<string, number>()
  for (const m of allMatches) {
    if (m.status === 'completed' && m.loserId) {
      lossById.set(m.loserId, (lossById.get(m.loserId) ?? 0) + 1)
    }
  }
  return participants
    .map((p) => ({
      ...p,
      lossCount: lossById.get(p.id) ?? 0,
      eliminated: (lossById.get(p.id) ?? 0) >= 2,
    }))
    .filter((p) => {
      const prev = participants.find((x) => x.id === p.id)!
      return prev.lossCount !== p.lossCount || prev.eliminated !== p.eliminated
    })
}
