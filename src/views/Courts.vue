<template>
  <div class="courts-page">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Enhanced Welcome Section -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Kort Durumu
                </h1>
                <p class="welcome-subtitle">
                  Tenis kortlarımızın güncel doluluk durumunu ve müsaitlik bilgilerini görüntüleyin.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ getCurrentDate() }}</div>
                <div class="current-time">{{ getCurrentTime() }}</div>
              </div>
            </v-col>
          </v-row>
        </div>
        <!-- Admin Controls -->
        <v-row v-if="authStore.isAdmin" class="mb-6">
          <v-col cols="12">
            <v-card class="modern-card admin-controls-card" elevation="0">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h3 class="text-h6 font-weight-bold mb-2">Yönetici Kontrolleri</h3>
                    <p class="text-body-2 text-grey-darken-1">Kort durumlarını düzenleyin ve güncelleyin</p>
                  </div>
                  <div class="admin-action-buttons">
                    <v-btn
                        v-if="!editMode"
                        variant="flat"
                        prepend-icon="mdi-pencil"
                        @click="enableEditMode"
                        class="text-white view-color mr-2"
                    >
                      Kort Durumlarını Düzenle
                    </v-btn>
                    <div v-else class="d-flex gap-2">
                      <v-btn
                          color="success"
                          variant="flat"
                          prepend-icon="mdi-check"
                          @click="saveCourtSchedule"
                          :loading="saving"
                      >
                        Değişiklikleri Kaydet
                      </v-btn>
                      <v-btn
                          color="error"
                          variant="outlined"
                          prepend-icon="mdi-close"
                          @click="cancelEdit"
                      >
                        İptal
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Court Overview Cards (sadece admin) -->
        <v-row v-if="authStore.isAdmin" class="mb-6">
          <v-col v-for="court in courts" :key="court.id" cols="12" md="4" class="mb-4">
            <v-card class="stat-card modern-card court-overview-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-title class="court-title pa-4">
                <div class="d-flex align-center">
                  <div class="stat-icon-wrapper court-gradient mr-4">
                    <v-icon icon="mdi-tennis" size="24" color="white" />
                  </div>
                  <div>
                    <h3 class="text-h6 font-weight-bold">{{ court.name }}</h3>
                    <p class="text-caption text-grey-darken-1">Tenis Kortu</p>
                  </div>
                </div>
              </v-card-title>

              <v-card-text class="pa-4 pt-0">
                <!-- Occupancy Rate -->
                <div class="occupancy-section mb-4">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span class="text-subtitle-2 font-weight-medium">Doluluk Oranı</span>
                    <span class="occupancy-percentage text-h6 font-weight-bold"
                          :class="getOccupancyColor(court.occupancyRate)">
                      {{ court.occupancyRate }}%
                    </span>
                  </div>

                  <v-progress-linear
                      :model-value="court.occupancyRate"
                      :color="getOccupancyProgressColor(court.occupancyRate)"
                      height="8"
                      rounded
                      class="mb-3"
                  />

                  <div class="d-flex justify-space-between text-caption text-grey-darken-1">
                    <span>{{ court.availableSlots }} müsait slot</span>
                    <span>{{ court.totalSlots }} toplam slot</span>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                  <v-row no-gutters>
                    <v-col cols="6">
                      <div class="text-center py-2">
                        <div class="stat-number text-success font-weight-bold">{{ court.availableSlots }}</div>
                        <div class="stat-label text-caption">Müsait</div>
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-center py-2">
                        <div class="stat-number text-error font-weight-bold">{{ court.occupiedSlots }}</div>
                        <div class="stat-label text-caption">Dolu</div>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Date Selection -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card class="modern-card date-selection-card" elevation="0">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between flex-wrap">
                  <div class="date-selector-content">
                    <h3 class="text-h6 font-weight-bold mb-2">Tarih Seçimi</h3>
                    <p class="text-body-2 text-grey-darken-1">Görüntülemek istediğiniz tarihi seçin</p>
                  </div>
                  <div class="date-controls">
                    <v-menu v-model="datePickerMenu" :close-on-content-click="false">
                      <template v-slot:activator="{ props }">
                        <v-btn
                            color="primary"
                            variant="outlined"
                            prepend-icon="mdi-calendar"
                            v-bind="props"
                        >
                          {{ formatSelectedDate() }}
                        </v-btn>
                      </template>
                      <v-date-picker
                          v-model="selectedDate"
                          @update:model-value="onDateChange"
                          color="primary"
                      />
                    </v-menu>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Court Schedule -->
        <v-row>
          <v-col cols="12">
            <v-card class="modern-card schedule-card" elevation="0">
              <v-card-title class="pa-4 bg-primary text-white">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-clock" class="mr-3" />
                  <div>
                    <h3 class="text-h6 font-weight-bold">Kort Programı</h3>
                    <p class="text-body-2 opacity-90">{{ formatSelectedDate() }} tarihli kort durumu</p>
                  </div>
                </div>
              </v-card-title>

              <v-card-text class="pa-0">
                <div v-if="loading" class="text-center py-8">
                  <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                      class="mb-4"
                  />
                  <p class="text-body-1">Kort durumu yükleniyor...</p>
                </div>

                <div v-else-if="!schedule || Object.keys(schedule).length === 0" class="text-center py-8">
                  <v-icon icon="mdi-calendar-blank" size="64" color="grey" class="mb-4" />
                  <h3 class="text-h6 mb-2">Bu tarih için kort programı bulunamadı</h3>
                  <p class="text-body-2 text-grey-darken-1">Seçilen tarih için henüz program oluşturulmamış.</p>
                </div>

                <div v-else class="schedule-table-container">
                  <v-table class="schedule-table">
                    <thead>
                    <tr class="table-header">
                      <th class="time-column">Saat</th>
                      <th v-for="court in courts" :key="court.id" class="court-column">
                        {{ court.name }}
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="timeSlot in timeSlots" :key="timeSlot" class="time-slot-row">
                      <td class="time-cell">
                        <div class="time-display">{{ timeSlot }}</div>
                      </td>
                      <td v-for="court in courts" :key="court.id" class="court-cell">
                        <div
                            class="slot-status"
                            :class="getSlotStatusClass(schedule[court.id]?.[timeSlot])"
                            @click="editMode && toggleSlotStatus(court.id, timeSlot)"
                            :style="{ cursor: editMode ? 'pointer' : 'default' }"
                            :title="getSlotTooltip(schedule[court.id]?.[timeSlot])"
                        >
                          <v-icon
                              :icon="getSlotIcon(schedule[court.id]?.[timeSlot])"
                              :color="getSlotIconColor(schedule[court.id]?.[timeSlot])"
                              size="20"
                              class="mb-1"
                          />
                          <div class="slot-text">
                            <div class="status-line">
                              {{ getSlotStatus(schedule[court.id]?.[timeSlot]) }}
                            </div>
                            <div
                                v-if="getStudentInfo(schedule[court.id]?.[timeSlot])"
                                class="student-info"
                            >
                              ({{ getStudentInfo(schedule[court.id]?.[timeSlot]) }})
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Legend -->
        <v-row class="mt-6">
          <v-col cols="12">
            <v-card class="modern-card legend-card" elevation="0">
              <v-card-text class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-4">Durum Açıklaması</h3>
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                      <span>Müsait</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-account" color="error" class="mr-2" />
                      <span>Dolu</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-tools" color="warning" class="mr-2" />
                      <span>Bakım</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-close-circle" color="grey" class="mr-2" />
                      <span>Kapalı</span>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'
import { DEFAULT_MEMBERSHIP_TYPES } from '@/types/membershipType'
import { buildCourtSchedule } from '@/utils/courtScheduleBuild'
import type { RawReservationDoc } from '@/utils/dailyReservationLimit'

const authStore = useAuthStore()
const membershipTypesStore = useMembershipTypesStore()
let unsubscribeCourtSchedule: () => void

// Reactive data
const selectedDate = ref(new Date())
const datePickerMenu = ref(false)
const schedule = ref<any>({})
const loading = ref(false)
const editMode = ref(false)
const saving = ref(false)

// Time slots (08:00 - 22:00, son slot 22:00 - 23:00)
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
]

// Courts data
const courts = ref([
  {
    id: 'K1',
    name: 'Kort 1',
    availableSlots: 8,
    occupiedSlots: 5,
    totalSlots: 13,
    occupancyRate: 38
  },
  {
    id: 'K2',
    name: 'Kort 2',
    availableSlots: 6,
    occupiedSlots: 7,
    totalSlots: 13,
    occupancyRate: 54
  },
  {
    id: 'K3',
    name: 'Kort 3',
    availableSlots: 10,
    occupiedSlots: 3,
    totalSlots: 13,
    occupancyRate: 23
  }
])

// Methods
const getCurrentDate = () => {
  const today = new Date()
  return today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSelectedDate = () => {
  return selectedDate.value.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getOccupancyColor = (rate: number) => {
  if (rate < 30) return 'text-success'
  if (rate < 70) return 'text-warning'
  return 'text-error'
}

const getOccupancyProgressColor = (rate: number) => {
  if (rate < 30) return 'success'
  if (rate < 70) return 'warning'
  return 'error'
}

const getSlotStatusClass = (slotData: any) => {
  const status = getSlotStatusValue(slotData)
  switch (status) {
    case 'available': return 'status-available'
    case 'occupied': return 'status-occupied'
    case 'maintenance': return 'status-maintenance'
    case 'closed': return 'status-closed'
    default: return 'status-available'
  }
}

const getSlotStatusValue = (slotData: any) => {
  if (!slotData) return 'available'

  if (typeof slotData === 'string') {
    return slotData
  }

  if (typeof slotData === 'object') {
    return slotData.status || 'available'
  }

  return 'available'
}

const getSlotIcon = (slotData: any) => {
  const status = getSlotStatusValue(slotData)
  switch (status) {
    case 'available': return 'mdi-check-circle'
    case 'occupied': return 'mdi-account'
    case 'maintenance': return 'mdi-tools'
    case 'closed': return 'mdi-close-circle'
    default: return 'mdi-check-circle'
  }
}

const getSlotIconColor = (slotData: any) => {
  const status = getSlotStatusValue(slotData)
  switch (status) {
    case 'available': return 'success'
    case 'occupied': return 'error'
    case 'maintenance': return 'warning'
    case 'closed': return 'grey'
    default: return 'success'
  }
}

const getSlotStatus = (slotData: any) => {
  const status = getSlotStatusValue(slotData)
  switch (status) {
    case 'available': return 'Müsait'
    case 'occupied': return 'Dolu'
    case 'maintenance': return 'Bakım'
    case 'closed': return 'Kapalı'
    default: return 'Müsait'
  }
}

const getStudentInfo = (slotData: any) => {
  if (!slotData || typeof slotData !== 'object') return null

  const status = slotData.status || 'available'
  if (status !== 'occupied') return null

  // Öğrenciler için hiçbir ders detayı gösterilmez; yalnızca "Dolu" görünür
  if (!authStore.isAdmin) {
    return null
  }

  // Grup dersi kontrolü
  const isGroupLesson = slotData.reservationType === 'group-lesson' ||
      slotData.membershipType?.includes('_group_') ||
      slotData.groupAssignment

  if (isGroupLesson) {
    // Grup dersi için üyelik türü ve grup adı göster (kod değil)
    const membershipLabel = getMembershipDisplayName(slotData.membershipType)
    const groupLabel = slotData.groupName || getGroupDisplayName(slotData.groupAssignment)

    if (membershipLabel && groupLabel) {
      return `${membershipLabel} - ${groupLabel}`
    } else if (membershipLabel) {
      return membershipLabel
    } else if (groupLabel) {
      return `Grup Dersi - ${groupLabel}`
    }
  }

  // Özel ders için öğrenci adı soyadı göster
  if (slotData.studentFirstName && slotData.studentLastName) {
    return `${slotData.studentFirstName} ${slotData.studentLastName}`
  }

  if (slotData.studentFullName) {
    return slotData.studentFullName
  }

  return null
}

const getSlotTooltip = (slotData: any) => {
  if (!slotData || typeof slotData !== 'object') return undefined

  const status = slotData.status || 'available'
  if (status !== 'occupied') return undefined

  // Öğrenciler için tooltip gösterme
  if (!authStore.isAdmin) {
    return undefined
  }

  // Admin kullanıcılar için detaylı tooltip
  let tooltip = ''

  if (slotData.studentFullName) {
    tooltip += `Öğrenci: ${slotData.studentFullName}\n`
  }

  if (slotData.membershipType) {
    tooltip += `Üyelik: ${getMembershipDisplayName(slotData.membershipType)}\n`
  }

  if (slotData.groupAssignment) {
    const groupLabel = slotData.groupName || getGroupDisplayName(slotData.groupAssignment) || slotData.groupAssignment
    tooltip += `Grup: ${groupLabel}\n`
  }

  if (slotData.reservationType) {
    tooltip += `Tip: ${slotData.reservationType}`
  }

  return tooltip.trim()
}

const getMembershipDisplayName = (type: string) => {
  if (!type) return ''
  // Store'dan bul, yoksa DEFAULT_MEMBERSHIP_TYPES'tan fallback yap, son çare key'i formatla
  const fromStore = membershipTypesStore.getDisplayInfo(type)
  if (fromStore?.name && fromStore.name !== type) return fromStore.name

  const fromDefaults = DEFAULT_MEMBERSHIP_TYPES.find(t => t.key === type)
  if (fromDefaults) return fromDefaults.name

  // key'i okunabilir formata çevir: adult_group → Adult Group
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const getGroupDisplayName = (groupAssignment: string) => {
  if (!groupAssignment) return null

  const groupLabels: { [key: string]: string } = {
    'group_1': 'Grup 1',
    'group_2': 'Grup 2',
    'group_3': 'Grup 3',
    'group_4': 'Grup 4',
    'group_5': 'Grup 5',
    'group_6': 'Grup 6',
    'group_7': 'Grup 7',
    'group_8': 'Grup 8',
    'group_9': 'Grup 9',
    'group_10': 'Grup 10'
  }

  // Sabit etiket yoksa ham Firestore id'sini gösterme; çağıran taraf groupName
  // alanını fallback olarak zaten kullanıyor.
  return groupLabels[groupAssignment] || null
}

// Firebase operations
//
// Doluluğun TEK doğru kaynağı canlı `reservations` koleksiyonudur (tıpkı
// /admin/calendar gibi). Kaydedilmiş `courtSchedule` snapshot'ı yalnızca
// admin'in elle koyduğu bakım/kapalı durumları ve grup dersi yedeği için
// kullanılır; bayat 'occupied' slotlar canlı veriyi asla ezmez. Bu sayede
// "takvimde Ayda İleri, /courts'ta eski grup adı görünüyor" tutarsızlığı
// ortadan kalkar. (Bkz. src/utils/courtScheduleBuild.ts)
const fetchCourtSchedule = async (date: Date) => {
  loading.value = true
  try {
    const dateString = date.toISOString().split('T')[0]

    // 1) Kaydedilmiş snapshot (admin bakım/kapalı durumları + grup yedeği için)
    const docSnap = await getDoc(doc(db, 'courtSchedule', dateString))
    const storedSchedule = docSnap.exists() ? (docSnap.data().schedule || {}) : {}

    // 2) O güne ait canlı rezervasyonlar
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const reservationsQuery = query(
        collection(db, 'reservations'),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay)
    )
    const querySnapshot = await getDocs(reservationsQuery)
    const reservations = querySnapshot.docs.map(d => d.data() as RawReservationDoc)

    // 3) Hangi grupların hâlâ var olduğunu ve adlarını topla (canlı + snapshot)
    const { existingGroupIds, groupNames } = await resolveGroups(reservations, storedSchedule)

    // 4) Programı canlı veriyi taban alarak oluştur
    schedule.value = buildCourtSchedule({
      courtIds: courts.value.map(c => c.id),
      timeSlots,
      storedSchedule,
      reservations,
      existingGroupIds,
      mapCourtId,
      groupNames
    })

    updateCourtStats()
  } catch (error) {
    console.error('Error fetching court schedule:', error)
    schedule.value = {}
  } finally {
    loading.value = false
  }
}

// Rezervasyonlardan ve snapshot'tan referans verilen tüm grup id'lerini
// toplar; her birinin var olup olmadığını ve adını Firebase'den çeker.
const resolveGroups = async (
  reservations: RawReservationDoc[],
  storedSchedule: Record<string, Record<string, any>>
): Promise<{ existingGroupIds: Set<string>; groupNames: Record<string, string> }> => {
  const groupIds = new Set<string>()

  reservations.forEach((r) => {
    if (r.groupId) groupIds.add(r.groupId as string)
    if (r.groupAssignment) groupIds.add(r.groupAssignment as string)
  })
  Object.values(storedSchedule).forEach((courtSchedule: any) => {
    Object.values(courtSchedule || {}).forEach((slot: any) => {
      if (slot && typeof slot === 'object' && slot.groupAssignment) {
        groupIds.add(slot.groupAssignment)
      }
    })
  })

  const existingGroupIds = new Set<string>()
  const groupNames: Record<string, string> = {}

  for (const groupId of groupIds) {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (groupDoc.exists()) {
        existingGroupIds.add(groupId)
        groupNames[groupId] = groupDoc.data().name || ''
      }
    } catch (error) {
      console.error(`Error fetching group ${groupId}:`, error)
    }
  }

  return { existingGroupIds, groupNames }
}

const mapCourtId = (reservationCourtId: string): string => {
  const mapping: Record<string, string> = {
    'court-1': 'K1',
    'court-2': 'K2',
    'court-3': 'K3',
  }
  return mapping[reservationCourtId] || reservationCourtId
}

const updateCourtStats = () => {
  courts.value.forEach(court => {
    const courtSchedule = schedule.value[court.id] || {}
    let occupied = 0
    let available = 0

    timeSlots.forEach(time => {
      const slotData = courtSchedule[time]
      const status = getSlotStatusValue(slotData)

      if (status === 'occupied') occupied++
      else if (status === 'available') available++
    })

    court.occupiedSlots = occupied
    court.availableSlots = available
    court.occupancyRate = Math.round((occupied / timeSlots.length) * 100)
  })
}

const saveCourtSchedule = async () => {
  saving.value = true
  try {
    const dateString = selectedDate.value.toISOString().split('T')[0]
    const docRef = doc(db, 'courtSchedule', dateString)

    const updatedBy = authStore.user?.id || authStore.user?.phone_number || 'unknown'

    // Snapshot'a yalnızca admin kontrollü durumları yaz (available/maintenance/
    // closed). Rezervasyondan türeyen 'occupied' slotları kaydetme — aksi halde
    // bayat grup/öğrenci verisi snapshot'a sızar ve canlı veriyle çelişir.
    // 'occupied' slotlar 'available' olarak yazılır; bir sonraki yüklemede
    // canlı rezervasyonlardan yeniden doldurulur.
    const persistable: Record<string, Record<string, string>> = {}
    courts.value.forEach(court => {
      persistable[court.id] = {}
      const courtSchedule = schedule.value[court.id] || {}
      timeSlots.forEach(time => {
        const status = getSlotStatusValue(courtSchedule[time])
        persistable[court.id][time] =
          status === 'maintenance' || status === 'closed' ? status : 'available'
      })
    })

    await setDoc(docRef, {
      schedule: persistable,
      lastUpdated: new Date(),
      updatedBy: updatedBy
    })

    editMode.value = false
    console.log('✅ Court schedule saved successfully')

    // Snapshot artık sadece admin durumlarını içeriyor; canlı rezervasyonları
    // yeniden bindirmek için programı yeniden oluştur.
    await fetchCourtSchedule(selectedDate.value)
  } catch (error) {
    console.error('❌ Error saving court schedule:', error)
  } finally {
    saving.value = false
  }
}

const setupRealTimeListener = () => {
  const dateString = selectedDate.value.toISOString().split('T')[0]
  const docRef = doc(db, 'courtSchedule', dateString)

  // Snapshot değiştiğinde ham veriyi DOĞRUDAN atama — bu, canlı rezervasyon
  // verisini bayat snapshot ile ezerdi. Bunun yerine tüm programı yeniden
  // oluştur (canlı rezervasyonlar yine doğru kaynak). Admin düzenleme
  // modundayken yeniden yükleme yapma; kullanıcının değişikliklerini ezmesin.
  let initial = true
  unsubscribeCourtSchedule = onSnapshot(docRef, () => {
    if (initial) {
      initial = false
      return
    }
    if (editMode.value) return
    fetchCourtSchedule(selectedDate.value)
  })
}

const enableEditMode = () => {
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  fetchCourtSchedule(selectedDate.value)
}

const toggleSlotStatus = (courtId: string, timeSlot: string) => {
  if (!editMode.value) return

  const currentSlotData = schedule.value[courtId]?.[timeSlot]
  const currentStatus = getSlotStatusValue(currentSlotData)

  const statuses = ['available', 'occupied', 'maintenance', 'closed']
  const currentIndex = statuses.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % statuses.length

  if (!schedule.value[courtId]) {
    schedule.value[courtId] = {}
  }

  schedule.value[courtId][timeSlot] = statuses[nextIndex]
  updateCourtStats()
}

const onDateChange = () => {
  datePickerMenu.value = false
  fetchCourtSchedule(selectedDate.value)
  if (unsubscribeCourtSchedule) {
    unsubscribeCourtSchedule()
  }
  setupRealTimeListener()
}

// Watchers
watch(selectedDate, (newDate) => {
  fetchCourtSchedule(newDate)
})

// Lifecycle
onMounted(async () => {
  await membershipTypesStore.initialize()
  fetchCourtSchedule(selectedDate.value)
  setupRealTimeListener()
})

onUnmounted(() => {
  if (unsubscribeCourtSchedule) {
    unsubscribeCourtSchedule()
  }
})
</script>