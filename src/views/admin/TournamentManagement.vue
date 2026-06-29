<template>
  <v-container fluid class="tournament-management pa-4">
    <!-- Başlık -->
    <div class="welcome-section pa-6 mb-6">
      <h1 class="text-h4 font-weight-bold text-white mb-1">
        <v-icon class="mr-2">mdi-tournament</v-icon>Turnuvalar
      </h1>
      <p class="text-white text-body-2 mb-0">
        Turnuva oluştur, oyuncuları ata, eşleşmeleri ve sonuçları yönet.
      </p>
    </div>

    <!-- Turnuva seçili değil → liste -->
    <template v-if="!selectedTournament">
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h6 font-weight-bold">Tüm Turnuvalar</h2>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Yeni Turnuva
        </v-btn>
      </div>

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
              <v-chip size="x-small" variant="tonal" class="mr-2">
                {{ t.category === 'doubles' ? '2v2 Çift' : '1v1 Tek' }}
              </v-chip>
              <div class="text-caption text-grey mt-2">
                {{ t.createdAt.toLocaleDateString('tr-TR') }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" size="small" @click.stop="selectTournament(t.id)">
                Yönet
              </v-btn>
              <v-spacer />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="confirmDelete(t.id)"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-else type="info" variant="tonal">
        Henüz turnuva yok. "Yeni Turnuva" ile başlayın.
      </v-alert>
    </template>

    <!-- Turnuva seçili → detay -->
    <template v-else>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="selectTournament(null)">
        Listeye Dön
      </v-btn>

      <div class="d-flex flex-wrap align-center gap-2 mb-4">
        <h2 class="text-h5 font-weight-bold mr-3">{{ selectedTournament.name }}</h2>
        <v-chip :color="statusColor(selectedTournament.status)" variant="flat">
          {{ statusLabel(selectedTournament.status) }}
        </v-chip>
        <v-chip variant="tonal">
          {{ selectedTournament.category === 'doubles' ? '2v2 Çift' : '1v1 Tek' }}
        </v-chip>
      </div>

      <!-- SETUP aşaması -->
      <template v-if="selectedTournament.status === 'setup'">
        <v-card class="modern-card mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Oyuncu Ekle
            <span class="text-caption text-grey ml-2">
              ({{ selectedTournament.category === 'doubles' ? '2 öğrenci = 1 takım' : '1 öğrenci' }})
            </span>
          </v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="selectedStudentIds"
              :items="availableStudents"
              item-title="fullName"
              item-value="id"
              :multiple="selectedTournament.category === 'doubles'"
              :chips="selectedTournament.category === 'doubles'"
              :loading="studentsLoading"
              label="Öğrenci seç"
              variant="outlined"
              density="comfortable"
            />
            <v-btn
              color="primary"
              prepend-icon="mdi-account-plus"
              :disabled="!canAddParticipant"
              @click="onAddParticipant"
            >
              Katılımcı Ekle
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="modern-card mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            Katılımcılar ({{ participants.length }})
            <v-spacer />
            <v-btn
              size="small"
              variant="tonal"
              color="warning"
              prepend-icon="mdi-shuffle-variant"
              :disabled="participants.length < 2"
              @click="onShuffleSeeds"
            >
              Karıştır
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list v-if="participants.length">
              <v-list-item v-for="p in participants" :key="p.id">
                <template #prepend>
                  <v-avatar color="primary" size="32" class="mr-2">{{ p.seed }}</v-avatar>
                </template>
                <v-list-item-title>{{ p.displayName }}</v-list-item-title>
                <template #append>
                  <v-btn
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="removeParticipant(selectedTournament.id, p.id)"
                  />
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-grey text-body-2">Henüz katılımcı eklenmedi.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="success"
              size="large"
              prepend-icon="mdi-play"
              :disabled="participants.length < 2"
              @click="onStart"
            >
              Turnuvayı Başlat
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>

      <!-- IN_PROGRESS / COMPLETED → bracket -->
      <template v-else>
        <BracketView
          :matches="matches"
          :participants="participants"
          :champion-name="championName"
          @match-click="openScoreDialog"
          @shuffle-losers="onShuffleLosers"
        />
      </template>
    </template>

    <!-- Yeni Turnuva Dialog -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card>
        <v-card-title>Yeni Turnuva</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newName"
            label="Turnuva Adı"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="newCategory"
            :items="categoryItems"
            item-title="label"
            item-value="value"
            label="Kategori"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">İptal</v-btn>
          <v-btn color="primary" :disabled="!newName.trim()" @click="onCreate">Oluştur</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Skor Gir Dialog -->
    <v-dialog v-model="scoreDialog" max-width="480">
      <v-card v-if="scoreMatch">
        <v-card-title>Maç Sonucu</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">Kazananı seçin ve skoru girin.</p>
          <v-radio-group v-model="scoreWinnerId">
            <v-radio
              :label="nameOf(scoreMatch.participant1Id)"
              :value="scoreMatch.participant1Id"
            />
            <v-radio
              :label="nameOf(scoreMatch.participant2Id)"
              :value="scoreMatch.participant2Id"
            />
          </v-radio-group>
          <v-text-field
            v-model="scoreText"
            label="Skor (ör. 6-4 6-2)"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="scoreDialog = false">İptal</v-btn>
          <v-btn
            color="primary"
            :disabled="!scoreWinnerId || !scoreText.trim()"
            @click="onSubmitScore"
          >
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTournaments } from '@/composables/useTournaments'
import BracketView from '@/components/tournament/BracketView.vue'
import type { TournamentMatch, TournamentStatus } from '@/types/tournament'

const {
  tournaments,
  selectedTournament,
  participants,
  matches,
  students,
  studentsLoading,
  fetchStudents,
  selectTournament,
  createTournament,
  addParticipantByStudents,
  removeParticipant,
  shuffleSeeds,
  startTournament,
  submitMatchResult,
  shuffleLosers,
  deleteTournament,
} = useTournaments()

// UI state
const createDialog = ref(false)
const newName = ref('')
const newCategory = ref<'singles' | 'doubles'>('singles')
const categoryItems = [
  { label: '1v1 Tek', value: 'singles' },
  { label: '2v2 Çift', value: 'doubles' },
]

const selectedStudentIds = ref<string[] | string>([])

const scoreDialog = ref(false)
const scoreMatch = ref<TournamentMatch | null>(null)
const scoreWinnerId = ref<string | null>(null)
const scoreText = ref('')

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

onMounted(() => {
  fetchStudents()
})

// Turnuva seçilince öğrenci listesini yenile (yeni eklenmiş olabilir).
watch(selectedTournament, (t) => {
  if (t && t.status === 'setup') fetchStudents()
})

const canAddParticipant = computed(() => {
  if (!selectedTournament.value) return false
  const ids = normalizeIds()
  const need = selectedTournament.value.category === 'doubles' ? 2 : 1
  return ids.length === need
})

// Halihazırda katılımcı olarak eklenmiş öğrenciler seçim listesinde TEKRAR
// görünmesin (aynı öğrenci iki kez/iki takımda eklenemesin).
const availableStudents = computed(() => {
  const used = new Set(participants.value.flatMap((p) => p.studentIds))
  return students.value.filter((s) => !used.has(s.id))
})

const championName = computed(() => {
  const t = selectedTournament.value
  if (!t?.championParticipantId) return null
  return participants.value.find((p) => p.id === t.championParticipantId)?.displayName ?? null
})

function normalizeIds(): string[] {
  const v = selectedStudentIds.value
  return Array.isArray(v) ? v : v ? [v] : []
}

function nameOf(id: string | null): string {
  if (!id) return '—'
  return participants.value.find((p) => p.id === id)?.displayName ?? '—'
}

function statusColor(s: TournamentStatus): string {
  return s === 'setup' ? 'grey' : s === 'in_progress' ? 'primary' : 'success'
}
function statusLabel(s: TournamentStatus): string {
  return s === 'setup' ? 'Hazırlık' : s === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'
}

function notify(text: string, color: 'success' | 'error' = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function openCreateDialog() {
  newName.value = ''
  newCategory.value = 'singles'
  createDialog.value = true
}

async function onCreate() {
  try {
    const id = await createTournament(newName.value.trim(), newCategory.value)
    createDialog.value = false
    selectTournament(id)
    notify('Turnuva oluşturuldu')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

async function onAddParticipant() {
  if (!selectedTournament.value) return
  try {
    await addParticipantByStudents(
      selectedTournament.value.id,
      selectedTournament.value.category,
      normalizeIds(),
    )
    selectedStudentIds.value = selectedTournament.value.category === 'doubles' ? [] : ''
    notify('Katılımcı eklendi')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

async function onShuffleSeeds() {
  if (!selectedTournament.value) return
  try {
    await shuffleSeeds(selectedTournament.value.id)
    notify('Seed sırası karıştırıldı')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

async function onStart() {
  if (!selectedTournament.value) return
  try {
    await startTournament(selectedTournament.value.id)
    notify('Turnuva başladı')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

function openScoreDialog(match: TournamentMatch) {
  scoreMatch.value = match
  scoreWinnerId.value = null
  scoreText.value = ''
  scoreDialog.value = true
}

async function onSubmitScore() {
  if (!selectedTournament.value || !scoreMatch.value || !scoreWinnerId.value) return
  try {
    await submitMatchResult(
      selectedTournament.value.id,
      scoreMatch.value.id,
      scoreWinnerId.value,
      scoreText.value.trim(),
    )
    scoreDialog.value = false
    notify('Sonuç kaydedildi')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

async function onShuffleLosers(round: number) {
  if (!selectedTournament.value) return
  try {
    await shuffleLosers(selectedTournament.value.id, round)
    notify('Kaybedenler eşleşmesi karıştırıldı')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
}

async function confirmDelete(id: string) {
  if (!window.confirm('Bu turnuvayı silmek istediğinize emin misiniz?')) return
  try {
    await deleteTournament(id)
    notify('Turnuva silindi')
  } catch (e: any) {
    notify(e.message ?? 'Hata', 'error')
  }
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
  transition: transform 0.2s, box-shadow 0.2s;
}
.modern-card:hover {
  transform: translateY(-4px);
}
.gap-2 { gap: 8px; }
</style>
