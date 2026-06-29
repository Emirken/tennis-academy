// Turnuva (çift eleme) domain tipleri.
// Bracket algoritması saf util'de yaşar: src/utils/tournamentBracket.ts
// Persistlenen Firestore dokümanları bu tiplerle eşleşir.

import type {
  TournamentCategory,
  TournamentStatus,
  BracketSide,
  MatchStatus,
} from '@/utils/tournamentBracket'

export type {
  TournamentCategory,
  TournamentStatus,
  BracketSide,
  MatchStatus,
} from '@/utils/tournamentBracket'

/** tournaments/{id} */
export interface Tournament {
  id: string
  name: string
  /** 'singles' = 1v1, 'doubles' = 2v2 */
  category: TournamentCategory
  status: TournamentStatus
  /** Tamamlanınca dolan kazanan participant id'si */
  championParticipantId?: string | null
  createdAt: Date
  updatedAt: Date
}

/** tournamentParticipants/{id} */
export interface TournamentParticipant {
  id: string
  tournamentId: string
  /** Bracket başlangıç pozisyonu (1..n) */
  seed: number
  /** singles → 1 öğrenci, doubles → 2 öğrenci */
  studentIds: string[]
  /** Snapshot: öğrenci silinse de bracket okunur kalır */
  displayName: string
  eliminated: boolean
  /** 0/1/2 — iki kez kaybeden elenir */
  lossCount: number
  createdAt?: Date
  updatedAt?: Date
}

/** tournamentMatches/{id} */
export interface TournamentMatch {
  id: string
  tournamentId: string
  bracket: BracketSide
  round: number
  slotInRound: number
  participant1Id: string | null
  participant2Id: string | null
  winnerId: string | null
  loserId: string | null
  /** Serbest metin skor: "6-4 6-2" */
  score: string | null
  status: MatchStatus
  nextWinnerMatchId: string | null
  nextLoserMatchId: string | null
  createdAt?: Date
  updatedAt?: Date
}
