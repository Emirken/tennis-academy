<template>
  <div class="bracket-view">
    <!-- Sekmeler: Kazananlar / Kaybedenler / Büyük Final -->
    <div class="bracket-tabs">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        class="bracket-tab"
        :class="[section.key, { active: activeTab === section.key }]"
        @click="activeTab = section.key"
      >
        <v-icon size="small" class="mr-1">{{ section.icon }}</v-icon>
        {{ section.label }}
        <span v-if="section.matchCount > 0" class="tab-count">{{ section.matchCount }}</span>
      </button>
    </div>

    <!-- Aktif sekmenin içeriği -->
    <div v-if="activeSection">
      <!-- Kazananlar bitmeden kaybedenlere skor girilemez uyarısı -->
      <div
        v-if="activeSection.key === 'losers' && !winnersDone && activeSection.rounds.length > 0"
        class="lock-note"
      >
        <v-icon size="small">mdi-lock-outline</v-icon>
        Kazananlar tamamlanmadan kaybedenler maçlarına skor girilemez.
      </div>

      <div v-if="activeSection.rounds.length === 0" class="empty-hint">
        Henüz maç yok.
      </div>

      <div v-else class="rounds-row">
        <div
          v-for="round in activeSection.rounds"
          :key="round.round"
          class="round-col"
        >
          <div v-if="roundLabel(activeSection.key, round.matches.length)" class="round-label">{{ roundLabel(activeSection.key, round.matches.length) }}</div>

          <!-- Losers turu için karıştır tuşu (sadece admin + pending maç varsa) -->
          <v-btn
            v-if="!readonly && activeSection.key === 'losers' && winnersDone && round.hasPending"
            size="x-small"
            variant="tonal"
            color="warning"
            class="mb-2 shuffle-btn"
            prepend-icon="mdi-shuffle-variant"
            @click="$emit('shuffle-losers', round.round)"
          >
            Karıştır
          </v-btn>

          <div class="matches-stack">
            <div
              v-for="match in round.matches"
              :key="match.id"
              class="match-card"
              :class="{
                clickable: !readonly && isPlayable(match),
                completed: match.status === 'completed',
              }"
              @click="onMatchClick(match)"
            >
              <div
                class="player-row"
                :class="{ winner: match.winnerId && match.winnerId === match.participant1Id }"
              >
                <span class="player-name">{{ nameOf(match.participant1Id) }}</span>
              </div>
              <div class="match-divider">
                <span v-if="match.score" class="match-score">{{ match.score }}</span>
                <span v-else class="vs">vs</span>
              </div>
              <div
                class="player-row"
                :class="{ winner: match.winnerId && match.winnerId === match.participant2Id }"
              >
                <span class="player-name">{{ nameOf(match.participant2Id) || 'BYE' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="champion" class="champion-banner">
      <v-icon color="amber" size="large">mdi-trophy</v-icon>
      <span class="champion-label">ŞAMPİYON</span>
      <span class="champion-name">{{ champion }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TournamentMatch, TournamentParticipant } from '@/types/tournament'
import { winnersComplete } from '@/utils/tournamentBracket'

const props = defineProps<{
  matches: TournamentMatch[]
  participants: TournamentParticipant[]
  readonly?: boolean
  championName?: string | null
}>()

const emit = defineEmits<{
  (e: 'match-click', match: TournamentMatch): void
  (e: 'shuffle-losers', round: number): void
}>()

const nameOf = (id: string | null): string => {
  if (!id) return ''
  return props.participants.find((p) => p.id === id)?.displayName ?? '—'
}

const champion = computed(() => props.championName ?? null)

interface RoundGroup {
  round: number
  matches: TournamentMatch[]
  hasPending: boolean
}
interface Section {
  key: 'winners' | 'losers' | 'grand_final'
  label: string
  icon: string
  rounds: RoundGroup[]
  matchCount: number
}

function groupRounds(bracket: Section['key']): RoundGroup[] {
  const inBracket = props.matches.filter((m) => m.bracket === bracket)
  const rounds = [...new Set(inBracket.map((m) => m.round))].sort((a, b) => a - b)
  return rounds.map((r) => {
    const ms = inBracket
      .filter((m) => m.round === r)
      .sort((a, b) => a.slotInRound - b.slotInRound)
    return { round: r, matches: ms, hasPending: ms.some((m) => m.status === 'pending') }
  })
}

function makeSection(
  key: Section['key'],
  label: string,
  icon: string,
): Section {
  const rounds = groupRounds(key)
  return {
    key,
    label,
    icon,
    rounds,
    matchCount: rounds.reduce((n, r) => n + r.matches.length, 0),
  }
}

const sections = computed<Section[]>(() => [
  makeSection('winners', 'Kazananlar', 'mdi-trophy-outline'),
  makeSection('losers', 'Kaybedenler', 'mdi-sword-cross'),
  makeSection('grand_final', 'Büyük Final', 'mdi-medal'),
])

// Aktif sekme (varsayılan "Kazananlar").
const activeTab = ref<Section['key']>('winners')
const activeSection = computed(
  () => sections.value.find((s) => s.key === activeTab.value) ?? sections.value[0],
)

// Tur etiketi o turdaki MAÇ SAYISINA göre belirlenir (round numarasına değil):
// 1 maç = Final, 2 maç = Yarı Final, 3-4 maç = Çeyrek Final, 5+ maç = etiketsiz.
// Büyük Final her zaman tek maçtır → "Final". Kaybedenler bracket'i de aynı mantığı kullanır.
function roundLabel(bracket: string, matchCount: number): string {
  if (bracket === 'grand_final') return 'Final'
  if (matchCount === 1) return 'Final'
  if (matchCount === 2) return 'Yarı Final'
  if (matchCount === 3 || matchCount === 4) return 'Çeyrek Final'
  return ''
}

// Kazananlar bracket'ı tamamen bitmeden kaybedenler maçlarına skor girilemez.
const winnersDone = computed(() => winnersComplete(props.matches as any))

function isPlayable(match: TournamentMatch): boolean {
  if (
    match.status !== 'pending' ||
    match.participant1Id == null ||
    match.participant2Id == null
  ) {
    return false
  }
  // Kaybedenler maçları, kazananlar tarafı bitene kadar kilitli.
  if (match.bracket === 'losers' && !winnersDone.value) return false
  return true
}

function onMatchClick(match: TournamentMatch) {
  if (props.readonly) return
  if (!isPlayable(match)) return
  emit('match-click', match)
}
</script>

<style scoped>
.bracket-view {
  background: linear-gradient(135deg, #1a1208 0%, #2a1a0d 100%);
  border-radius: 16px;
  padding: 20px;
  color: #f5e6d3;
  overflow-x: auto;
}

.bracket-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(216, 124, 58, 0.25);
}

.bracket-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 10px 16px;
  cursor: pointer;
  color: #b88a5e;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.bracket-tab:hover { color: #f0a35e; background: rgba(255, 255, 255, 0.04); }
.bracket-tab.active { font-weight: 800; }
.bracket-tab.winners.active { color: #f0a35e; border-bottom-color: #f0a35e; }
.bracket-tab.losers.active { color: #cfcfcf; border-bottom-color: #cfcfcf; }
.bracket-tab.grand_final.active { color: #ffd24a; border-bottom-color: #ffd24a; }

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(216, 124, 58, 0.25);
  color: #f0a35e;
}

.rounds-row {
  display: flex;
  gap: 48px;
  align-items: stretch;
  min-width: max-content;
}

.round-col {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  min-width: 180px;
}

.round-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b88a5e;
  margin-bottom: 8px;
  text-align: center;
}

.shuffle-btn { align-self: center; }

.matches-stack {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 20px;
  flex: 1;
}

.match-card {
  background: #0d0905;
  border: 1px solid rgba(216, 124, 58, 0.4);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.match-card.clickable {
  cursor: pointer;
}
.match-card.clickable:hover {
  transform: translateY(-2px);
  border-color: #f0a35e;
  box-shadow: 0 4px 16px rgba(216, 124, 58, 0.35);
}
.match-card.completed {
  border-color: rgba(120, 120, 120, 0.4);
}

.player-row {
  padding: 8px 12px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  min-height: 36px;
}
.player-row.winner {
  background: rgba(216, 124, 58, 0.18);
  font-weight: 700;
  color: #f0a35e;
}
.player-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-divider {
  border-top: 1px solid rgba(216, 124, 58, 0.2);
  border-bottom: 1px solid rgba(216, 124, 58, 0.2);
  text-align: center;
  padding: 2px 0;
}
.match-score {
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffd24a;
}
.vs {
  font-size: 0.65rem;
  color: #7a6a55;
  text-transform: uppercase;
}

.empty-hint {
  color: #7a6a55;
  font-size: 0.85rem;
  font-style: italic;
}

.lock-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #d8b27a;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.28);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
}

.champion-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #d87c3a 0%, #ffd24a 100%);
  color: #1a1208;
  padding: 14px 24px;
  border-radius: 12px;
  margin-top: 8px;
  font-weight: 800;
}
.champion-label { letter-spacing: 0.1em; }
.champion-name { font-size: 1.2rem; }
</style>
