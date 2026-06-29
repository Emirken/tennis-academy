// Turnuva (çift eleme) bracket çekirdeği — SAF, yan etkisiz domain logic.
//
// Kullanıcı SADELİK istedi: standart double-elim'in karmaşık
// losers-cross-bracket akışı YERİNE sadeleştirilmiş model:
//   "Bir winners turu TAM bittiğinde o turun kaybedenleri toplanır,
//    baş-son eşlenir (veya karıştırılır), bir losers turu oynanır.
//    Losers turu kazananları + sonraki winners turunun kaybedenleri
//    bir araya gelerek losers bracket'ta ilerler."
// Grand final TEK maçtır (bracket reset YOK — winners şampiyonunun
// klasik double-elim'deki ikinci şans avantajı bilinçli olarak yoktur).
//
// Bu dosya HEM tennis-academy/src/utils HEM tenis-project-new/packages/shared
// içinde BİREBİR aynı tutulur (framework-bağımsız, sadece tip importu farklı).

// ---- Tipler (her iki proje de aynı kavramı kullanır) ----

export type TournamentCategory = 'singles' | 'doubles'
export type TournamentStatus = 'setup' | 'in_progress' | 'completed'
export type BracketSide = 'winners' | 'losers' | 'grand_final'
export type MatchStatus = 'pending' | 'completed'

export interface BracketParticipant {
  id: string
  seed: number
  /** singles → 1, doubles → 2 eleman */
  studentIds: string[]
  displayName: string
  eliminated?: boolean
  /** 0/1/2 — çift eleme çekirdeği */
  lossCount?: number
}

export interface BracketMatch {
  id: string
  bracket: BracketSide
  round: number
  slotInRound: number
  participant1Id: string | null
  participant2Id: string | null
  winnerId: string | null
  loserId: string | null
  score: string | null
  status: MatchStatus
  /** Kazananın ilerleyeceği maç (null = bracket sonu / belirsiz) */
  nextWinnerMatchId: string | null
  /** Sadece winners maçlarında: kaybedenin düşeceği losers maçı */
  nextLoserMatchId: string | null
}

/** Test edilebilirlik için enjekte edilebilir rastgelelik (0<=r<1). */
export type Rng = () => number

const defaultRng: Rng = () => Math.random()

// ---- Yardımcılar ----

/** Fisher-Yates — yeni kopya döner (mutasyon yok). */
export function fisherYates<T>(items: T[], rng: Rng = defaultRng): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

let idCounter = 0
/** Deterministik olmayan ama benzersiz id (persist katmanı kendi id'sini de atayabilir). */
function makeId(prefix: string): string {
  idCounter += 1
  return `${prefix}_${idCounter}_${Math.floor(defaultRng() * 1e9).toString(36)}`
}

// ---- Karıştır tuşu A: başlangıç seed ----

/**
 * Katılımcıların seed alanlarını rastgele yeniden dağıtır (1..n).
 * Yalnız turnuva 'setup' aşamasındayken çağrılmalıdır (guard çağıran katmanda).
 * Yeni participant dizisi döner; çağıran persist edip generateInitialBracket'i
 * yeniden çalıştırır.
 */
export function shuffleSeeds(
  participants: BracketParticipant[],
  rng: Rng = defaultRng,
): BracketParticipant[] {
  const shuffled = fisherYates(participants, rng)
  return shuffled.map((p, i) => ({ ...p, seed: i + 1 }))
}

// ---- İlk bracket üretimi ----

/**
 * Seed sırasına göre winners bracket'ının YALNIZ ilk turunu (R1) üretir:
 * ardışık eşleştirme (1↔2, 3↔4, 5↔6 ...). Power-of-2 / seed dağıtımı YOK —
 * kullanıcı kararı: "sıra sıra eşleştir, eklenenler sırayla oynasın, en SON
 * eklenen kişi (tek kalırsa) BYE alsın".
 *
 * TEK sayıda katılımcı da OLUR: son kişi BYE alır (buildWinnersRound içinde
 * anında completed olur ve bir sonraki winners turuna otomatik taşınır).
 * Sonraki winners turları ve losers turları advanceWinner tarafından, ilgili
 * tur tamamlandıkça DİNAMİK üretilir (yine ardışık eşleştirme).
 */
export function generateInitialBracket(
  participants: BracketParticipant[],
): BracketMatch[] {
  const n = participants.length
  if (n < 2) return []

  const ordered = participants.slice().sort((a, b) => a.seed - b.seed)
  const ids = ordered.map((p) => p.id)
  // R1: ardışık çiftler (1v2, 3v4, ...). Tek kalan son kişi → BYE.
  return buildWinnersRound(ids, 1)
}

/**
 * Verilen katılımcı id'lerinden bir WINNERS turu maçları üretir (ardışık çift).
 * Tek sayıda id varsa SON kişi BYE alır: maç anında completed olur ve o kişi
 * (winnerId) bir sonraki winners turunda diğer kazananlarla birleşir.
 */
export function buildWinnersRound(ids: string[], round: number): BracketMatch[] {
  if (ids.length === 0) return []
  const pairs = pairSequential(ids) // [0,1],[2,3]... tek kalan → [x, null]
  return pairs.map(([p1, p2], slot) => {
    const isBye = p2 == null
    return {
      id: makeId('wm'),
      bracket: 'winners' as BracketSide,
      round,
      slotInRound: slot,
      participant1Id: p1,
      participant2Id: p2,
      winnerId: isBye ? p1 : null,
      loserId: null,
      score: null,
      status: (isBye ? 'completed' : 'pending') as MatchStatus,
      nextWinnerMatchId: null,
      nextLoserMatchId: null,
    }
  })
}

// ---- Tur tamamlanma / kaybeden toplama ----

/** Verilen bracket+round'daki TÜM maçlar completed mı? */
export function isRoundComplete(
  matches: BracketMatch[],
  bracket: BracketSide,
  round: number,
): boolean {
  const inRound = matches.filter((m) => m.bracket === bracket && m.round === round)
  return inRound.length > 0 && inRound.every((m) => m.status === 'completed')
}

/**
 * Bir winners turunun kaybedenlerini slotInRound sırasıyla döndürür.
 * Bye maçlarının kaybedeni yoktur (loserId === null) → atlanır.
 */
export function collectRoundLosers(
  matches: BracketMatch[],
  round: number,
): string[] {
  return matches
    .filter((m) => m.bracket === 'winners' && m.round === round && m.loserId)
    .sort((a, b) => a.slotInRound - b.slotInRound)
    .map((m) => m.loserId as string)
}

/**
 * Winners bracket'ında GERÇEK maç oynayıp kaybeden HERKES (tüm turlar).
 * Sıralama: önce tur (R1, R2, ...), tur içinde slotInRound. Bye maçlarının
 * kaybedeni yoktur (loserId === null) → atlanır. Kaybedenler bracket'i winners
 * tamamen bitince bu liste ile TEK SEFERDE (ilk losers turu) kurulur.
 */
export function collectAllWinnersLosers(matches: BracketMatch[]): string[] {
  return matches
    .filter((m) => m.bracket === 'winners' && m.loserId)
    .sort((a, b) => (a.round - b.round) || (a.slotInRound - b.slotInRound))
    .map((m) => m.loserId as string)
}

/**
 * Bir turun (bracket+round) kazananlarını slotInRound sırasıyla döndürür.
 * Bye maçlarının kazananı da dahildir (otomatik tamamlandı).
 */
export function collectRoundWinners(
  matches: BracketMatch[],
  bracket: BracketSide,
  round: number,
): string[] {
  return matches
    .filter((m) => m.bracket === bracket && m.round === round && m.winnerId)
    .sort((a, b) => a.slotInRound - b.slotInRound)
    .map((m) => m.winnerId as string)
}

// ---- Losers eşleştirme (karıştır tuşu B varsayılan/rastgele) ----

/**
 * Verilen katılımcı id listesini baş-son eşler: liste[i] ↔ liste[n-1-i].
 * Kullanıcının ÖZEL kuralı. Tek sayıda eleman varsa ortadaki bye alır.
 * Dönen çiftler: [p1, p2] (p2 null ise bye).
 */
export function pairHeadToTail(ids: string[]): Array<[string, string | null]> {
  const pairs: Array<[string, string | null]> = []
  let i = 0
  let j = ids.length - 1
  while (i < j) {
    pairs.push([ids[i], ids[j]])
    i++
    j--
  }
  if (i === j) pairs.push([ids[i], null]) // ortadaki → bye
  return pairs
}

/** Ardışık çiftleme: [0,1],[2,3]... — tek kalan bye. (Shuffle sonrası kullanılır.) */
export function pairSequential(ids: string[]): Array<[string, string | null]> {
  const pairs: Array<[string, string | null]> = []
  for (let i = 0; i < ids.length; i += 2) {
    pairs.push([ids[i], ids[i + 1] ?? null])
  }
  return pairs
}

/**
 * Verilen katılımcı id'lerinden bir losers turu maçları üretir.
 * Eşleştirme:
 *   - shuffle=true   → Fisher-Yates + ardışık (karıştır tuşu B)
 *   - sequential=true → ardışık (sıra sıra: [0,1],[2,3]...) — kaybedenler
 *     bracket'i "ilk turmuş gibi alt alta" dizilsin diye varsayılan akış.
 *   - ikisi de yoksa → baş-son ([0]↔[n-1]) (eski varsayılan, geriye uyum).
 * Bye'lı tek maçlar anında completed olur (kazanan otomatik ilerlemez —
 * bir sonraki losers turunda diğerleriyle birleştirilir).
 */
export function buildLosersRound(
  loserIds: string[],
  round: number,
  options: { shuffle?: boolean; sequential?: boolean; rng?: Rng } = {},
): BracketMatch[] {
  const { shuffle = false, sequential = false, rng = defaultRng } = options
  if (loserIds.length === 0) return []
  const ids = shuffle ? fisherYates(loserIds, rng) : loserIds
  const pairs = shuffle || sequential ? pairSequential(ids) : pairHeadToTail(ids)

  return pairs.map(([p1, p2], slot) => {
    const isBye = p2 == null
    return {
      id: makeId('lm'),
      bracket: 'losers' as BracketSide,
      round,
      slotInRound: slot,
      participant1Id: p1,
      participant2Id: p2,
      winnerId: isBye ? p1 : null,
      loserId: null,
      score: null,
      status: (isBye ? 'completed' : 'pending') as MatchStatus,
      nextWinnerMatchId: null,
      nextLoserMatchId: null,
    }
  })
}

// ---- Maç sonucu işleme ----

export interface AdvanceResult {
  matches: BracketMatch[]
  /** Bu sonuçla yeni üretilen losers/grand_final maçları (varsa). */
  newMatches: BracketMatch[]
  championId: string | null
}

/**
 * Bir maçın sonucunu işler: kazananı ilerletir, kaybedeni losers'a düşürür,
 * tur tamamlanınca yeni losers turu / grand final üretir.
 *
 * SAF: girdi dizilerini mutasyona uğratmaz, yeni durum döner.
 * participants: lossCount/eliminated güncellemesi için gerekir.
 */
export function advanceWinner(
  matchesInput: BracketMatch[],
  participantsInput: BracketParticipant[],
  matchId: string,
  winnerId: string,
  score: string,
): AdvanceResult {
  const matches = matchesInput.map((m) => ({ ...m }))
  const participants = participantsInput.map((p) => ({ ...p }))
  const match = matches.find((m) => m.id === matchId)
  if (!match) throw new Error(`Maç bulunamadı: ${matchId}`)
  if (match.status === 'completed') throw new Error('Maç zaten tamamlanmış')

  const loserId =
    match.participant1Id === winnerId ? match.participant2Id : match.participant1Id
  if (winnerId !== match.participant1Id && winnerId !== match.participant2Id) {
    throw new Error('Kazanan bu maçın katılımcısı değil')
  }

  match.winnerId = winnerId
  match.loserId = loserId
  match.score = score
  match.status = 'completed'

  // Kaybedenin kaybını işle.
  if (loserId) {
    const lp = participants.find((p) => p.id === loserId)
    if (lp) {
      lp.lossCount = (lp.lossCount ?? 0) + 1
      if (lp.lossCount >= 2) lp.eliminated = true
    }
  }

  const newMatches: BracketMatch[] = []

  // --- Winners turu tamamlandıysa ---
  if (match.bracket === 'winners' && isRoundComplete(matches, 'winners', match.round)) {
    // Bir sonraki winners turunu kazananlardan ardışık üret (2+ kazanan varsa).
    // Tek kazanan kalırsa o kişi winners ŞAMPİYONUDUR (yeni winners turu üretilmez).
    const winners = collectRoundWinners(matches, 'winners', match.round)
    if (winners.length >= 2) {
      newMatches.push(...buildWinnersRound(winners, match.round + 1))
    } else {
      // Winners TAMAMEN bitti (şampiyon belli). Kaybedenler bracket'i ŞİMDİ ve
      // TEK SEFERDE doğar: winners'taki TÜM gerçek maç kaybedenleri (BYE'lar
      // hariç) ilk losers turu (round 1) olarak SIRA SIRA (ardışık) dizilir.
      // Kazananlar bitmeden HİÇBİR losers maçı üretilmez (kullanıcı kuralı).
      const allLosers = collectAllWinnersLosers(matches)
      if (allLosers.length >= 2) {
        newMatches.push(...buildLosersRound(allLosers, 1, { sequential: true }))
      }
    }
  }

  // --- Losers turu tamamlandıysa: sağ kalanlar bir sonraki losers turunda
  //     ardışık eşleşir (2+ sağ kalan varsa). Tek kalan = losers şampiyonu. ---
  if (match.bracket === 'losers' && isRoundComplete(matches, 'losers', match.round)) {
    const survivors = matches
      .filter((m) => m.bracket === 'losers' && m.round === match.round && m.winnerId)
      .sort((a, b) => a.slotInRound - b.slotInRound)
      .map((m) => m.winnerId as string)
    if (survivors.length >= 2) {
      newMatches.push(...buildLosersRound(survivors, match.round + 1, { sequential: true }))
    }
  }

  // Losers turu tamamlandıysa ve winners tamamen bittiyse → birleştir / grand final.
  maybeBuildGrandFinal(matches, newMatches)

  // Şampiyon belli mi?
  const grandFinal = matches
    .concat(newMatches)
    .find((m) => m.bracket === 'grand_final' && m.status === 'completed')
  const championId = grandFinal?.winnerId ?? null

  return { matches, newMatches, championId }
}

function maxRound(matches: BracketMatch[], bracket: BracketSide): number {
  const rs = matches.filter((m) => m.bracket === bracket).map((m) => m.round)
  return rs.length ? Math.max(...rs) : 0
}

/**
 * Grand final koşulu: winners bracket tamamen bitmiş (tek şampiyon) VE losers
 * bracket tek sağ kalana inmiş. Henüz grand final yoksa üretir (tek maç).
 */
function maybeBuildGrandFinal(matches: BracketMatch[], newMatches: BracketMatch[]): void {
  const all = matches.concat(newMatches)
  if (all.some((m) => m.bracket === 'grand_final')) return

  const winnersChamp = winnersChampion(all)
  const losersChamp = losersChampion(all)
  if (!winnersChamp || !losersChamp) return

  newMatches.push({
    id: makeId('gf'),
    bracket: 'grand_final',
    round: 1,
    slotInRound: 0,
    participant1Id: winnersChamp,
    participant2Id: losersChamp,
    winnerId: null,
    loserId: null,
    score: null,
    status: 'pending',
    nextWinnerMatchId: null,
    nextLoserMatchId: null,
  })
}

/** Winners bracket'ın final maçı tamamlandıysa kazananı, değilse null. */
export function winnersChampion(matches: BracketMatch[]): string | null {
  const finalRound = maxRound(matches, 'winners')
  if (finalRound === 0) return null
  const finals = matches.filter((m) => m.bracket === 'winners' && m.round === finalRound)
  if (finals.length !== 1) return null
  return finals[0].status === 'completed' ? finals[0].winnerId : null
}

/**
 * Winners (kazananlar) bracket'ı tamamen bitti mi? = winners final maçı tek ve
 * tamamlanmış. Kaybedenler maçlarına skor girişi bundan ÖNCE engellenir:
 * tüm kazananlar turları oynanmadan kaybedenler tarafına geçilmez.
 */
export function winnersComplete(matches: BracketMatch[]): boolean {
  return winnersChampion(matches) !== null
}

/**
 * Losers bracket tek sağ kalana indiyse o kişiyi döndürür.
 * = en üst losers turu tamamlanmış VE o turdan tek kazanan çıkmışsa.
 */
export function losersChampion(matches: BracketMatch[]): string | null {
  const top = maxRound(matches, 'losers')
  if (top === 0) return null
  if (!isRoundComplete(matches, 'losers', top)) return null
  const winners = matches
    .filter((m) => m.bracket === 'losers' && m.round === top && m.winnerId)
    .map((m) => m.winnerId as string)
  return winners.length === 1 ? winners[0] : null
}

/**
 * Karıştır tuşu B: belirli bir losers turunun HENÜZ oynanmamış maçlarını
 * rastgele yeniden eşler. Oynanmış (completed) maçlar korunur.
 * Dönen: o turun yeni maç listesi (eski pending maçların yerine konur).
 */
export function reshuffleLosersRound(
  matches: BracketMatch[],
  round: number,
  rng: Rng = defaultRng,
): BracketMatch[] {
  const roundMatches = matches.filter((m) => m.bracket === 'losers' && m.round === round)
  if (roundMatches.length === 0) return []
  // Sadece pending maçlardaki katılımcıları topla (completed bye'lar dokunulmaz).
  const pending = roundMatches.filter((m) => m.status === 'pending')
  const ids: string[] = []
  for (const m of pending) {
    if (m.participant1Id) ids.push(m.participant1Id)
    if (m.participant2Id) ids.push(m.participant2Id)
  }
  if (ids.length < 2) return roundMatches.map((m) => ({ ...m }))
  return buildLosersRound(ids, round, { shuffle: true, rng })
}
