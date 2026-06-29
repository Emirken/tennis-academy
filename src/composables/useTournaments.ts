import { computed, ref, onUnmounted } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useTournamentsStore } from '@/store/modules/tournaments'
import { isActiveStudent } from '@/utils/studentCounts'
import type { TournamentCategory } from '@/types/tournament'

export interface TournamentStudentOption {
  id: string
  firstName: string
  lastName: string
  fullName: string
}

/**
 * Turnuva UI'ı için temiz API. Store'u sarmalar + katılımcı seçimi için
 * aktif öğrenci listesini users koleksiyonundan çeker (StudentManagement
 * ile aynı kaynak/filtre: role=='student', silinmemiş, aktif/onaylı).
 */
export function useTournaments() {
  const store = useTournamentsStore()
  const students = ref<TournamentStudentOption[]>([])
  const studentsLoading = ref(false)

  store.subscribeTournaments()
  onUnmounted(() => {
    // Liste aboneliği global; detay aboneliğini bırak.
    store.selectTournament(null)
  })

  const fetchStudents = async () => {
    studentsLoading.value = true
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student')),
      )
      students.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((u) => u.deleted !== true && isActiveStudent(u))
        .map((u) => ({
          id: u.id,
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'))
    } finally {
      studentsLoading.value = false
    }
  }

  /** displayName üretir: singles → tek isim, doubles → "A & B". */
  const buildDisplayName = (selectedIds: string[]): string => {
    const names = selectedIds
      .map((id) => students.value.find((s) => s.id === id)?.fullName ?? '?')
      .filter(Boolean)
    return names.join(' & ')
  }

  const addParticipantByStudents = async (
    tournamentId: string,
    category: TournamentCategory,
    selectedIds: string[],
  ) => {
    const need = category === 'doubles' ? 2 : 1
    if (selectedIds.length !== need) {
      throw new Error(
        category === 'doubles'
          ? 'Çift kategoride takım için 2 öğrenci seçilmeli'
          : 'Tek kategoride 1 öğrenci seçilmeli',
      )
    }
    await store.addParticipant(tournamentId, selectedIds, buildDisplayName(selectedIds))
  }

  return {
    // store state (reactive refs)
    tournaments: computed(() => store.tournaments),
    selectedTournament: computed(() => store.selectedTournament),
    participants: computed(() => store.sortedParticipants),
    matches: computed(() => store.matches),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    // students
    students,
    studentsLoading,
    fetchStudents,
    buildDisplayName,
    // actions
    selectTournament: store.selectTournament,
    createTournament: store.createTournament,
    addParticipantByStudents,
    removeParticipant: store.removeParticipant,
    shuffleSeeds: store.shuffleSeeds,
    startTournament: store.startTournament,
    submitMatchResult: store.submitMatchResult,
    shuffleLosers: store.shuffleLosers,
    deleteTournament: store.deleteTournament,
  }
}
