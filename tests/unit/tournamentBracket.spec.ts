import { describe, it, expect } from 'vitest'
import {
  type BracketParticipant,
  type BracketMatch,
  fisherYates,
  shuffleSeeds,
  generateInitialBracket,
  buildWinnersRound,
  isRoundComplete,
  collectRoundLosers,
  collectRoundWinners,
  pairSequential,
  buildLosersRound,
  advanceWinner,
  winnersChampion,
  losersChampion,
  reshuffleLosersRound,
} from '@/utils/tournamentBracket'

// Sıralı (deterministik) sahte RNG üretici — Fisher-Yates testleri için.
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

function makeParticipants(n: number): BracketParticipant[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    studentIds: [`s${i + 1}`],
    displayName: `Oyuncu ${i + 1}`,
    lossCount: 0,
    eliminated: false,
  }))
}

/** Bir maçı verilen kazananla tamamla; tüm yeni maçları akümüle et. */
function playMatch(
  matches: BracketMatch[],
  participants: BracketParticipant[],
  matchId: string,
  winnerId: string,
) {
  const res = advanceWinner(matches, participants, matchId, winnerId, '6-0')
  return {
    matches: [...res.matches, ...res.newMatches],
    championId: res.championId,
  }
}

describe('tournamentBracket — ardışık eşleştirme yardımcıları', () => {
  it('pairSequential ardışık çiftler, tek kalan bye', () => {
    expect(pairSequential(['a', 'b', 'c', 'd'])).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
    expect(pairSequential(['a', 'b', 'c'])).toEqual([
      ['a', 'b'],
      ['c', null],
    ])
  })

  it('fisherYates mutasyon yapmaz, permütasyon korur', () => {
    const arr = [1, 2, 3, 4]
    const out = fisherYates(arr, seqRng([0, 0, 0]))
    expect(arr).toEqual([1, 2, 3, 4])
    expect(out.slice().sort()).toEqual([1, 2, 3, 4])
  })
})

describe('tournamentBracket — generateInitialBracket (ardışık, BYE en sona)', () => {
  it('4 kişi: ardışık 2 maç (p1↔p2, p3↔p4), BYE yok', () => {
    const matches = generateInitialBracket(makeParticipants(4))
    const r1 = matches
      .filter((m) => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.slotInRound - b.slotInRound)
    expect(r1).toHaveLength(2)
    expect([r1[0].participant1Id, r1[0].participant2Id]).toEqual(['p1', 'p2'])
    expect([r1[1].participant1Id, r1[1].participant2Id]).toEqual(['p3', 'p4'])
    expect(r1.every((m) => m.status === 'pending')).toBe(true)
    // Sonraki turlar henüz üretilmedi (dinamik).
    expect(matches.filter((m) => m.round === 2)).toHaveLength(0)
  })

  it('6 kişi: ardışık 3 maç, hepsi gerçek (BYE yok)', () => {
    const matches = generateInitialBracket(makeParticipants(6))
    const r1 = matches.filter((m) => m.bracket === 'winners' && m.round === 1)
    expect(r1).toHaveLength(3)
    expect(r1.every((m) => m.status === 'pending')).toBe(true)
    expect(r1.every((m) => m.participant1Id && m.participant2Id)).toBe(true)
  })

  it('5 kişi (tek): ilk 2 maç gerçek, SON kişi (p5) BYE alır', () => {
    const matches = generateInitialBracket(makeParticipants(5))
    const r1 = matches
      .filter((m) => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.slotInRound - b.slotInRound)
    expect(r1).toHaveLength(3)
    expect([r1[0].participant1Id, r1[0].participant2Id]).toEqual(['p1', 'p2'])
    expect([r1[1].participant1Id, r1[1].participant2Id]).toEqual(['p3', 'p4'])
    expect(r1[0].status).toBe('pending')
    expect(r1[1].status).toBe('pending')
    // En son eklenen p5 → BYE, anında completed.
    const bye = r1[2]
    expect(bye.participant1Id).toBe('p5')
    expect(bye.participant2Id).toBeNull()
    expect(bye.status).toBe('completed')
    expect(bye.winnerId).toBe('p5')
  })

  it('2 kişiden az → boş bracket', () => {
    expect(generateInitialBracket(makeParticipants(0))).toEqual([])
    expect(generateInitialBracket(makeParticipants(1))).toEqual([])
  })
})

describe('tournamentBracket — buildWinnersRound', () => {
  it('tek sayıda id → son kişi BYE alır (anında completed)', () => {
    const round = buildWinnersRound(['a', 'b', 'c'], 2)
    expect(round).toHaveLength(2)
    expect(round[0].status).toBe('pending')
    const bye = round[1]
    expect(bye.participant1Id).toBe('c')
    expect(bye.participant2Id).toBeNull()
    expect(bye.status).toBe('completed')
    expect(bye.winnerId).toBe('c')
  })
})

describe('tournamentBracket — shuffleSeeds (karıştır tuşu A)', () => {
  it('seed alanlarını 1..n yeniden numaralar', () => {
    const ps = makeParticipants(4)
    const out = shuffleSeeds(ps, seqRng([0, 0, 0]))
    expect(out.map((p) => p.seed).sort()).toEqual([1, 2, 3, 4])
    expect(ps.map((p) => p.seed)).toEqual([1, 2, 3, 4]) // orijinal dokunulmaz
  })
})

describe('tournamentBracket — advanceWinner temel', () => {
  it('geçersiz kazanan reddedilir', () => {
    const ps = makeParticipants(4)
    const matches = generateInitialBracket(ps)
    const first = matches.find((m) => m.bracket === 'winners' && m.round === 1)!
    expect(() => advanceWinner(matches, ps, first.id, 'pX', '6-0')).toThrow()
  })

  it('tamamlanmış maç tekrar oynanamaz', () => {
    const ps = makeParticipants(4)
    const matches = generateInitialBracket(ps)
    const first = matches.find((m) => m.bracket === 'winners' && m.round === 1)!
    const res = advanceWinner(matches, ps, first.id, first.participant1Id!, '6-0')
    expect(() =>
      advanceWinner(res.matches, ps, first.id, first.participant1Id!, '6-0'),
    ).toThrow()
  })

  it('girdiyi mutasyona uğratmaz', () => {
    const ps = makeParticipants(4)
    const matches = generateInitialBracket(ps)
    const first = matches.find((m) => m.bracket === 'winners' && m.round === 1)!
    const snap = JSON.stringify(matches)
    advanceWinner(matches, ps, first.id, first.participant1Id!, '6-0')
    expect(JSON.stringify(matches)).toBe(snap)
  })

  it('winners ara turu bitince sonraki winners turu doğar; losers HENÜZ doğmaz', () => {
    const ps = makeParticipants(4)
    let matches = generateInitialBracket(ps)
    const r1 = matches
      .filter((m) => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.slotInRound - b.slotInRound)

    let r = playMatch(matches, ps, r1[0].id, 'p1') // p2 kaybeder
    matches = r.matches
    // Henüz tur bitmedi
    expect(matches.filter((m) => m.bracket === 'winners' && m.round === 2)).toHaveLength(0)

    r = playMatch(matches, ps, r1[1].id, 'p3') // p4 kaybeder → R1 biter
    matches = r.matches
    // Winners R2: p1 vs p3 doğar
    const w2 = matches.filter((m) => m.bracket === 'winners' && m.round === 2)
    expect(w2).toHaveLength(1)
    expect([w2[0].participant1Id, w2[0].participant2Id].sort()).toEqual(['p1', 'p3'])
    // KRİTİK: winners daha bitmedi (final oynanmadı) → HİÇ losers maçı OLMAMALI.
    expect(matches.filter((m) => m.bracket === 'losers')).toHaveLength(0)
  })

  it('winners TAMAMEN bitince losers ilk turu tek seferde, TÜM kaybedenlerle doğar', () => {
    const ps = makeParticipants(4)
    let matches = generateInitialBracket(ps)
    const find = (b: string, rnd: number) =>
      matches
        .filter((m) => m.bracket === b && m.round === rnd)
        .sort((a, b2) => a.slotInRound - b2.slotInRound)

    matches = playMatch(matches, ps, find('winners', 1)[0].id, 'p1').matches // p2↓
    matches = playMatch(matches, ps, find('winners', 1)[1].id, 'p3').matches // p4↓
    expect(matches.filter((m) => m.bracket === 'losers')).toHaveLength(0) // hâlâ yok
    matches = playMatch(matches, ps, find('winners', 2)[0].id, 'p1').matches // p3↓ → şampiyon p1

    // Losers R1: tüm winners kaybedenleri [p2, p4, p3] sıra sıra.
    const l1 = find('losers', 1)
    const l1People = l1.flatMap((m) => [m.participant1Id, m.participant2Id]).filter(Boolean)
    expect(l1People.sort()).toEqual(['p2', 'p3', 'p4']) // eksik kaybeden YOK
    const losersRounds = [...new Set(matches.filter((m) => m.bracket === 'losers').map((m) => m.round))]
    expect(losersRounds).toEqual([1]) // tek tur, alt alta
    expect(l1).toHaveLength(2)
    expect([l1[0].participant1Id, l1[0].participant2Id]).toEqual(['p2', 'p4'])
    expect(l1[1].participant1Id).toBe('p3')
    expect(l1[1].participant2Id).toBeNull()
    expect(l1[1].status).toBe('completed')
  })
})

describe('tournamentBracket — collectRoundWinners', () => {
  it('turun kazananlarını slot sırasıyla verir', () => {
    const ps = makeParticipants(4)
    let matches = generateInitialBracket(ps)
    const r1 = matches
      .filter((m) => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.slotInRound - b.slotInRound)
    matches = playMatch(matches, ps, r1[0].id, 'p1').matches
    matches = playMatch(matches, ps, r1[1].id, 'p3').matches
    expect(collectRoundWinners(matches, 'winners', 1)).toEqual(['p1', 'p3'])
  })
})

describe('tournamentBracket — tam 4 kişilik çift eleme', () => {
  it('önce winners tamamen biter, sonra losers; grand final + şampiyon', () => {
    const ps = makeParticipants(4)
    let matches = generateInitialBracket(ps)
    const find = (b: string, r: number) =>
      matches
        .filter((m) => m.bracket === b && m.round === r)
        .sort((a, b2) => a.slotInRound - b2.slotInRound)

    // Winners R1: p1 (p2↓), p3 (p4↓) — losers HENÜZ doğmaz.
    matches = playMatch(matches, ps, find('winners', 1)[0].id, 'p1').matches
    matches = playMatch(matches, ps, find('winners', 1)[1].id, 'p3').matches
    expect(matches.filter((m) => m.bracket === 'losers')).toHaveLength(0)

    // Winners final R2: p1 (p3↓) → p1 winners şampiyonu. ŞİMDİ losers doğar.
    matches = playMatch(matches, ps, find('winners', 2)[0].id, 'p1').matches

    // Losers R1: tüm winners kaybedenleri [p2, p4, p3] sıra sıra → [p2 v p4], [p3 BYE].
    const l1 = find('losers', 1)
    expect(l1).toHaveLength(2)
    expect([l1[0].participant1Id, l1[0].participant2Id]).toEqual(['p2', 'p4'])
    // p2 v p4 → p2 kazanır, p4 elenir. p3 zaten BYE → tur biter.
    matches = playMatch(matches, ps, l1[0].id, 'p2').matches

    // Losers R2: sağ kalanlar p2 + p3 → p2 (losers şampiyonu), p3 elenir.
    const l2 = matches.filter((m) => m.bracket === 'losers' && m.round === 2)
    expect(l2).toHaveLength(1)
    expect([l2[0].participant1Id, l2[0].participant2Id].sort()).toEqual(['p2', 'p3'])
    matches = playMatch(matches, ps, l2[0].id, 'p2').matches

    // Grand final: p1 vs p2
    const gf = matches.filter((m) => m.bracket === 'grand_final')
    expect(gf).toHaveLength(1)
    expect([gf[0].participant1Id, gf[0].participant2Id].sort()).toEqual(['p1', 'p2'])

    const res = playMatch(matches, ps, gf[0].id, 'p1')
    expect(res.championId).toBe('p1')
  })
})

describe('tournamentBracket — reshuffleLosersRound (karıştır tuşu B)', () => {
  it('pending losers maçlarını yeniden eşler, katılımcılar korunur', () => {
    const losersMatches = buildLosersRound(['a', 'b', 'c', 'd'], 1)
    expect(losersMatches).toHaveLength(2)
    const reshuffled = reshuffleLosersRound(losersMatches, 1, seqRng([0.99, 0.5, 0.1]))
    const ids = reshuffled
      .flatMap((m) => [m.participant1Id, m.participant2Id])
      .filter(Boolean)
      .sort()
    expect(ids).toEqual(['a', 'b', 'c', 'd'])
  })
})
