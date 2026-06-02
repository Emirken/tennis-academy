<template>
  <div class="reservation-form">
    <v-alert
        :type="openReservationRange ? 'info' : 'warning'"
        variant="tonal"
        density="compact"
        class="mb-4"
    >
      <div class="text-body-2">
        <strong>Rezervasyon penceresi:</strong>
        {{ openReservationInfoText }}
      </div>
    </v-alert>

    <v-form v-model="valid" @submit.prevent="submitReservation">
      <!-- Date Selection -->
      <v-text-field
          v-model="reservationData.date"
          label="Tarih"
          type="date"
          variant="outlined"
          :rules="dateRules"
          :min="openReservationRange?.start || todayDateStr"
          :max="openReservationRange?.end || todayDateStr"
          :disabled="!openReservationRange"
          @change="onDateChange"
          required
          class="mb-4"
      />

      <!-- Court Selection -->
      <v-select
          v-model="reservationData.courtId"
          label="Kort Seçimi"
          :items="availableCourts"
          item-title="name"
          item-value="id"
          variant="outlined"
          :rules="courtRules"
          @update:model-value="onCourtChange"
          required
          class="mb-4"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #append>
              <v-chip
                  color="success"
                  size="small"
                  variant="flat"
              >
                Müsait
              </v-chip>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Time Selection -->
      <v-select
          v-model="reservationData.startTime"
          label="Rezervasyon Saati"
          :items="availableTimeSlots"
          variant="outlined"
          :rules="timeRules"
          :disabled="!reservationData.date || !reservationData.courtId"
          required
          class="mb-6"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :disabled="!item.raw.available">
            <template #append>
              <v-chip
                  :color="item.raw.available ? 'success' : 'error'"
                  size="small"
                  variant="flat"
              >
                {{ item.raw.available ? 'Müsait' : 'Dolu' }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Submit Button -->
      <v-btn
          type="submit"
          variant="flat"
          size="large"
          :loading="loading"
          :disabled="!valid"
          block
          class="view-color reservation-submit-btn"
      >
        <v-icon icon="mdi-calendar-plus" class="mr-2" />
        Rezervasyon Yap
      </v-btn>
    </v-form>

    <!-- Error Snackbar -->
    <v-snackbar
        v-model="errorSnackbar"
        color="error"
        :timeout="4000"
        location="top"
    >
      {{ errorMessage }}
      <template #actions>
        <v-btn variant="text" @click="errorSnackbar = false">Kapat</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { notificationService } from '@/services/notificationService'
import {
  getOpenReservationRange,
  isReservationDateOpen,
  getNextOpenAt
} from '@/utils/reservationWindow'
import {
  hasActiveReservationOnDate,
  getReservationGroupId,
  isOrphanGroupReservation,
  isSlotBlockingReservation,
  type RawReservationDoc
} from '@/utils/dailyReservationLimit'
import { buildCourtSchedule } from '@/utils/courtScheduleBuild'
import { useGroupsStore } from '@/store/modules/groups'

// Rezervasyon başarıyla oluşturulduğunda ebeveyne haber verir (sayfa kendi
// başarı dialogunu açar; dashboard dialog'u kapatıp takvimi yeniler).
const emit = defineEmits<{ (e: 'success'): void }>()

const authStore = useAuthStore()
const groupsStore = useGroupsStore()

// Form data
const reservationData = reactive({
  date: '',
  courtId: '',
  startTime: ''
})

// Form validation
const valid = ref(false)
const loading = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')

// Court schedule state
const courtSchedule = reactive<Record<string, Record<string, string>>>({
  'court-1': {},
  'court-2': {},
  'court-3': {}
})

// Available options
const availableCourts = ref([
  { id: 'court-1', name: 'Kort 1' },
  { id: 'court-2', name: 'Kort 2' },
  { id: 'court-3', name: 'Kort 3' }
])

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
]

// Rezervasyon penceresi — her 30 sn tick edip 20:00'de açılan günü canlı yansıtır
const now = ref(new Date())
let nowTimerId: ReturnType<typeof setInterval> | null = null

const openReservationRange = computed(() => getOpenReservationRange(now.value))
const todayDateStr = computed(() => {
  const d = new Date(now.value)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
})

const openReservationInfoText = computed(() => {
  const range = openReservationRange.value
  if (range) {
    const fmt = (s: string) =>
      new Date(s + 'T00:00:00').toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      })
    return `Şu anda ${fmt(range.start)} – ${fmt(range.end)} aralığı için rezervasyon yapılabilir. Yeni hafta her Pazar 20:00'de açılır.`
  }
  const nextOpen = getNextOpenAt(now.value)
  const formattedNext = nextOpen.toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  })
  return `Rezervasyon sistemi şu an kapalı. Bir sonraki açılış: ${formattedNext}.`
})

// Computed properties
const availableTimeSlots = computed(() => {
  if (!reservationData.date || !reservationData.courtId) return []

  return timeSlots.map(time => ({
    title: time,
    value: time,
    available: courtSchedule[reservationData.courtId]?.[time] === 'available'
  }))
})

// Validation rules
const dateRules = [
  (v: string) => !!v || 'Tarih gereklidir',
  (v: string) => {
    const range = openReservationRange.value
    if (!range) {
      return 'Rezervasyon sistemi şu an kapalı. Yeni hafta her Pazar 20:00\'de açılır.'
    }
    return isReservationDateOpen(v, now.value) ||
      `Yalnızca ${range.start} – ${range.end} aralığı için rezervasyon yapılabilir.`
  }
]

const courtRules = [
  (v: string) => !!v || 'Kort seçimi gereklidir'
]

const timeRules = [
  (v: string) => !!v || 'Saat seçimi gereklidir'
]

// Methods

// Firestore'daki K1/K2/K3 ID'lerini form'daki court-1/2/3 formatına eşler
const firestoreToFormCourtId = (firestoreId: string): string => {
  const mapping: Record<string, string> = {
    'K1': 'court-1',
    'K2': 'court-2',
    'K3': 'court-3'
  }
  return mapping[firestoreId] || firestoreId
}

// Verilen rezervasyon dokümanlarındaki benzersiz grup ID'lerinden hâlâ
// `groups` koleksiyonunda var olanların kümesini döndürür. Silinmiş gruplara
// ait "hayalet" rezervasyonları doluluk hesabından çıkarmak için kullanılır.
const getExistingGroupIds = async (docs: RawReservationDoc[]): Promise<Set<string>> => {
  const groupIds = new Set<string>()
  docs.forEach((d) => {
    const gid = getReservationGroupId(d)
    if (gid) groupIds.add(gid)
  })

  const existing = new Set<string>()

  // Okuma optimizasyonu: paylaşılan groups önbelleği hazırsa per-id getDoc
  // yerine onu kullan. Önbellek hazır DEĞİLSE eski per-id getDoc mantığına düş
  // (başarısızlıkta grubu VAR sayan güvenli davranış korunur).
  if (groupsStore.isReady()) {
    groupIds.forEach((gid) => {
      if (groupsStore.existingGroupIds.has(gid)) existing.add(gid)
    })
    return existing
  }

  await Promise.all(
    [...groupIds].map(async (gid) => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', gid))
        if (groupDoc.exists()) existing.add(gid)
      } catch {
        existing.add(gid)
      }
    })
  )
  return existing
}

// Slot verisinden durum stringini çıkarır (string veya nesne olabilir)
const getSlotStatusValue = (slotData: any): string => {
  if (!slotData) return 'available'
  if (typeof slotData === 'string') return slotData
  if (typeof slotData === 'object') return slotData.status || 'available'
  return 'available'
}

// Kort programını /courts (Kort Durumu) ekranıyla TAM AYNI motoru
// (buildCourtSchedule) kullanarak yükler — üç ekran (takvim, /courts, bu form)
// daima aynı sonucu verir.
const loadCourtSchedule = async (date: string) => {
  try {
    setDefaultSchedule()

    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd = new Date(`${date}T23:59:59.999`)

    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', dayStart),
      where('date', '<=', dayEnd)
    )
    const snapshot = await getDocs(reservationsQuery)
    const reservations = snapshot.docs.map((d) => d.data() as RawReservationDoc)

    const existingGroupIds = await getExistingGroupIds(reservations)

    const scheduleDoc = await getDoc(doc(db, 'courtSchedule', date))
    const storedSchedule = scheduleDoc.exists() ? (scheduleDoc.data().schedule || {}) : {}

    const built = buildCourtSchedule({
      courtIds: ['court-1', 'court-2', 'court-3'],
      timeSlots,
      storedSchedule,
      reservations,
      existingGroupIds,
      mapCourtId: firestoreToFormCourtId,
    })

    Object.keys(courtSchedule).forEach((courtId) => {
      const builtCourt = built[courtId] || {}
      timeSlots.forEach((time) => {
        const slot = builtCourt[time]
        const status = getSlotStatusValue(slot)
        if (status === 'occupied') {
          const isGroup =
            typeof slot === 'object' &&
            ((slot as any).reservationType === 'group-lesson' || !!(slot as any).groupAssignment)
          courtSchedule[courtId][time] = isGroup ? 'group_lesson' : 'occupied'
        } else {
          courtSchedule[courtId][time] = status // available | maintenance | closed
        }
      })
    })
  } catch (error) {
    console.error('Kort programını yükleme hatası:', error)
    setDefaultSchedule()
  }
}

const setDefaultSchedule = () => {
  Object.keys(courtSchedule).forEach(courtId => {
    timeSlots.forEach(timeSlot => {
      courtSchedule[courtId][timeSlot] = 'available'
    })
  })
}

const onDateChange = () => {
  if (reservationData.date) {
    loadCourtSchedule(reservationData.date)
  }
  reservationData.startTime = ''
}

const onCourtChange = () => {
  reservationData.startTime = ''
}

// Helper function to get court name by ID
const getCourtnameById = (courtId: string): string => {
  const court = availableCourts.value.find(c => c.id === courtId)
  return court?.name || courtId
}

const submitReservation = async () => {
  if (!valid.value) return

  // Rezervasyon penceresi kontrolü — tarayıcı saatini submit anında tekrar doğrula
  now.value = new Date()
  if (!isReservationDateOpen(reservationData.date, now.value)) {
    const range = openReservationRange.value
    errorMessage.value = range
      ? `Yalnızca ${range.start} – ${range.end} aralığı için rezervasyon yapılabilir.`
      : 'Rezervasyon sistemi şu an kapalı. Yeni hafta her Pazar 20:00\'de açılır.'
    errorSnackbar.value = true
    return
  }

  // Rezervasyon süresi sabit 1 saat
  const endTime = calculateEndTime(reservationData.startTime, 1)
  const slotsNeeded = getTimeSlotsInRange(reservationData.startTime, endTime)

  loading.value = true

  try {
    // 0. Aynı öğrencinin aynı gün için zaten aktif rezervasyonu var mı (günde bir kuralı)
    if (authStore.user?.id) {
      const sameDayQuery = query(
        collection(db, 'reservations'),
        where('studentId', '==', authStore.user.id)
      )
      const sameDaySnapshot = await getDocs(sameDayQuery)
      const docs = sameDaySnapshot.docs.map((docSnap) => docSnap.data() as RawReservationDoc)

      if (hasActiveReservationOnDate(docs, authStore.user.id, reservationData.date)) {
        errorMessage.value = 'Aynı gün içinde yalnızca bir rezervasyon yapabilirsiniz. Lütfen farklı bir tarih seçin.'
        errorSnackbar.value = true
        loading.value = false
        return
      }
    }

    // 1. Yerel courtSchedule'da grup dersi veya dolu slot kontrolü
    const occupiedBySchedule = slotsNeeded.filter(slot => {
      const status = courtSchedule[reservationData.courtId]?.[slot]
      return status !== 'available'
    })

    if (occupiedBySchedule.length > 0) {
      errorMessage.value = `Seçilen saatlerde dolu veya grup dersi olan slotlar mevcut (${occupiedBySchedule.join(', ')}). Lütfen başka bir saat seçin.`
      errorSnackbar.value = true
      loading.value = false
      return
    }

    // 2. Firebase'den aynı kort için çakışan onaylı/bekleyen rezervasyon var mı
    const courtIdKFormat: Record<string, string> = {
      'court-1': 'K1',
      'court-2': 'K2',
      'court-3': 'K3'
    }
    const courtIdVariants = [
      reservationData.courtId,
      courtIdKFormat[reservationData.courtId]
    ].filter(Boolean) as string[]

    const conflictSnapshots = await Promise.all(
      courtIdVariants.map(cid =>
        getDocs(query(collection(db, 'reservations'), where('courtId', '==', cid)))
      )
    )

    const selectedDateStr = reservationData.date

    const candidateDocs: RawReservationDoc[] = []
    conflictSnapshots.forEach((conflictSnapshot) => {
      conflictSnapshot.forEach((docSnap) => {
        const docData = docSnap.data()
        if (!isSlotBlockingReservation(docData as RawReservationDoc)) return

        let docDateStr: string
        if (typeof docData.date === 'string') {
          docDateStr = docData.date
        } else if (docData.date?.toDate) {
          docDateStr = docData.date.toDate().toISOString().split('T')[0]
        } else {
          docDateStr = new Date(docData.date).toISOString().split('T')[0]
        }

        if (docDateStr !== selectedDateStr) return
        candidateDocs.push(docData as RawReservationDoc)
      })
    })

    const conflictGroupIds = await getExistingGroupIds(candidateDocs)

    let hasConflict = false
    candidateDocs.forEach((docData) => {
      if (isOrphanGroupReservation(docData, conflictGroupIds)) return

      const existingStart = docData.startTime as string
      const existingEnd = docData.endTime as string
      const newStart = reservationData.startTime
      const newEnd = endTime

      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        hasConflict = true
      }
    })

    if (hasConflict) {
      errorMessage.value = 'Bu kort ve saat aralığı için zaten bir rezervasyon mevcut. Lütfen başka bir saat seçin.'
      errorSnackbar.value = true
      loading.value = false
      return
    }

    const reservationDoc = {
      studentId: authStore.user?.id,
      courtId: reservationData.courtId,
      courtName: getCourtnameById(reservationData.courtId),
      date: new Date(reservationData.date),
      startTime: reservationData.startTime,
      endTime: endTime,
      duration: 1,
      type: 'court-rental',
      status: 'pending',
      totalCost: 1000,
      createdAt: serverTimestamp()
    }

    // Save reservation
    const reservationRef = doc(collection(db, 'reservations'))
    await setDoc(reservationRef, reservationDoc)

    // Admin'e rezervasyon onay bildirimi gönder
    const studentName = `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim()
    const studentPhone = authStore.user?.phone_number || authStore.user?.phone || ''
    const studentNameWithPhone = studentPhone ? `${studentName} (${studentPhone})` : studentName
    const courtName = getCourtnameById(reservationData.courtId)
    const formattedDate = new Date(reservationData.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    await notificationService.createAdminNotification(
      'Yeni Rezervasyon Talebi',
      `${studentNameWithPhone}, ${formattedDate} tarihinde ${courtName} için ${reservationData.startTime} saatinde rezervasyon talebinde bulundu.`,
      'reservation_pending',
      { reservationId: reservationRef.id, studentId: authStore.user?.id, studentName }
    )

    // Reset form
    Object.assign(reservationData, {
      date: '',
      courtId: '',
      startTime: ''
    })

    // Ebeveyne başarıyı bildir (başarı dialogu/takvim yenilemesi ebeveynde)
    emit('success')

  } catch (error) {
    console.error('Rezervasyon hatası:', error)
    errorMessage.value = 'Rezervasyon oluşturulurken hata oluştu. Lütfen tekrar deneyin.'
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + Math.floor(duration)
  const endMinutes = minutes + (duration % 1) * 60

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

// Başlangıç ve bitiş saati arasındaki tüm saat dilimlerini döndürür
const getTimeSlotsInRange = (startTime: string, endTime: string): string[] => {
  const slots: string[] = []
  const [startH] = startTime.split(':').map(Number)
  const [endH] = endTime.split(':').map(Number)

  for (const slot of timeSlots) {
    const [slotH] = slot.split(':').map(Number)
    if (slotH >= startH && slotH < endH) {
      slots.push(slot)
    }
  }
  return slots
}

// Initialize
onMounted(async () => {
  setDefaultSchedule()
  // Paylaşılan groups önbelleğini başlat (getExistingGroupIds N+1 getDoc yerine
  // bunu kullanır; hazır olmadan güvenli per-id fallback devrededir).
  groupsStore.initialize()

  // Saat tick'i — 30 sn'de bir; 20:00'de açılan gün otomatik güncellensin
  nowTimerId = setInterval(() => {
    now.value = new Date()
  }, 30 * 1000)

  await authStore.waitForAuth()
})

onUnmounted(() => {
  if (nowTimerId) {
    clearInterval(nowTimerId)
    nowTimerId = null
  }
})
</script>

<style scoped>
/* Görsel stiller main.css'te yönetiliyor (.reservation-submit-btn vb.) */
</style>
