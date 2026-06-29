<template>
  <v-container fluid class="student-tournaments pa-4">
    <div class="welcome-section pa-6 mb-6">
      <h1 class="text-h4 font-weight-bold text-white mb-1">
        <v-icon class="mr-2">mdi-tournament</v-icon>Turnuvalar
      </h1>
      <p class="text-white text-body-2 mb-0">Turnuva eşleşmelerini ve sonuçlarını izle.</p>
    </div>

    <!-- Turnuva seçili değil → liste -->
    <template v-if="!selectedTournament">
      <v-row v-if="tournaments.length">
        <v-col v-for="t in tournaments" :key="t.id" cols="12" sm="6" md="4">
          <v-card class="modern-card" @click="selectTournament(t.id)">
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-h6 font-weight-bold">{{ t.name }}</span>
                <v-chip size="small" :color="statusColor(t.status)" variant="flat">
                  {{ statusLabel(t.status) }}
                </v-chip>
              </div>
              <v-chip size="x-small" variant="tonal">
                {{ t.category === 'doubles' ? '2v2 Çift' : '1v1 Tek' }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-else type="info" variant="tonal">Henüz turnuva yok.</v-alert>
    </template>

    <!-- Turnuva seçili → read-only bracket -->
    <template v-else>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="selectTournament(null)">
        Listeye Dön
      </v-btn>
      <div class="d-flex flex-wrap align-center gap-2 mb-4">
        <h2 class="text-h5 font-weight-bold mr-3">{{ selectedTournament.name }}</h2>
        <v-chip :color="statusColor(selectedTournament.status)" variant="flat">
          {{ statusLabel(selectedTournament.status) }}
        </v-chip>
      </div>

      <v-alert
        v-if="selectedTournament.status === 'setup'"
        type="info"
        variant="tonal"
      >
        Turnuva henüz başlamadı. Eşleşmeler başlayınca burada görünecek.
      </v-alert>
      <BracketView
        v-else
        :matches="matches"
        :participants="participants"
        :champion-name="championName"
        readonly
      />
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTournaments } from '@/composables/useTournaments'
import BracketView from '@/components/tournament/BracketView.vue'
import type { TournamentStatus } from '@/types/tournament'

const {
  tournaments,
  selectedTournament,
  participants,
  matches,
  selectTournament,
} = useTournaments()

const championName = computed(() => {
  const t = selectedTournament.value
  if (!t?.championParticipantId) return null
  return participants.value.find((p) => p.id === t.championParticipantId)?.displayName ?? null
})

function statusColor(s: TournamentStatus): string {
  return s === 'setup' ? 'grey' : s === 'in_progress' ? 'primary' : 'success'
}
function statusLabel(s: TournamentStatus): string {
  return s === 'setup' ? 'Hazırlık' : s === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'
}
</script>

<style scoped>
.welcome-section {
  background: linear-gradient(135deg, #b8642f 0%, #d17d45 100%);
  border-radius: 16px;
}
.modern-card {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 12px;
  transition: transform 0.2s;
}
.modern-card:hover { transform: translateY(-4px); }
.gap-2 { gap: 8px; }
</style>
