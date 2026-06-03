<template>
  <div class="boss-dashboard">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Karşılama -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  <v-icon icon="mdi-chart-line" class="mr-3" color="white" />
                  İzleme Paneli
                </h1>
                <p class="welcome-subtitle">
                  Hoş geldiniz, {{ authStore.user?.firstName }}! Akademinin genel durumu.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="admin-badge-widget">
                <div class="admin-badge">
                  <v-icon icon="mdi-crown" class="mr-2" />
                  <span>Patron</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <v-progress-linear v-if="loading" indeterminate color="deep-purple" class="mb-6" rounded />

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-6"
          :text="errorMessage"
        />

        <v-alert
          v-if="infoMessage && !errorMessage"
          type="info"
          variant="tonal"
          class="mb-6"
          :text="infoMessage"
        />

        <!-- Rezervasyon sayıları (yalnızca kort rezervasyonları) -->
        <h2 class="section-title mb-3">Kort Rezervasyonları</h2>
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-calendar-today" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ reservationCounts.daily }}</h3>
                  <p class="stat-label">Bugünkü Rezervasyon</p>
                  <div class="stat-trend">
                    <span class="trend-text">{{ formatDate(today) }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper info-gradient">
                  <v-icon icon="mdi-calendar-week" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number info--text">{{ reservationCounts.weekly }}</h3>
                  <p class="stat-label">Bu Haftaki Rezervasyon</p>
                  <div class="stat-trend">
                    <span class="trend-text">{{ weekRangeLabel }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-calendar-month" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ reservationCounts.monthly }}</h3>
                  <p class="stat-label">Bu Ayki Rezervasyon</p>
                  <div class="stat-trend">
                    <span class="trend-text">{{ monthLabel }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Aylık ciro -->
        <h2 class="section-title mb-3">Aylık Ciro (Tahmini)</h2>
        <v-row class="mb-6">
          <v-col cols="12" md="5">
            <v-card class="stat-card modern-card revenue-hero" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-cash-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">{{ formatCurrency(revenue.total) }}</h3>
                  <p class="stat-label">Toplam Aylık Ciro</p>
                  <div class="stat-trend">
                    <span class="trend-text">{{ activeStudentCount }} aktif öğrenci × paket fiyatı</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="7">
            <v-card class="modern-card" elevation="0">
              <v-card-title class="text-subtitle-1 font-weight-bold">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="deep-purple" />
                Pakete Göre Ciro Dağılımı
              </v-card-title>
              <v-divider />
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th class="text-center">Öğrenci</th>
                    <th class="text-right">Birim Fiyat</th>
                    <th class="text-right">Ara Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in revenue.byPackage" :key="row.key">
                    <td>{{ row.name }}</td>
                    <td class="text-center">{{ row.count }}</td>
                    <td class="text-right">{{ formatCurrency(row.unitPrice) }}</td>
                    <td class="text-right font-weight-bold">{{ formatCurrency(row.subtotal) }}</td>
                  </tr>
                  <tr v-if="revenue.byPackage.length === 0">
                    <td colspan="4" class="text-center text-grey py-4">Aktif öğrenci bulunamadı.</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Fiyatlandırma listesi -->
        <h2 class="section-title mb-3">Fiyatlandırma</h2>
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card class="modern-card" elevation="0">
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th class="text-center">Aylık Ders</th>
                    <th class="text-right">Aylık Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="type in activeMembershipTypes" :key="type.key">
                    <td>
                      <v-chip :color="type.color" size="small" variant="flat" class="mr-2" label>
                        {{ type.name }}
                      </v-chip>
                    </td>
                    <td class="text-center">{{ type.monthlyLessons ?? '—' }}</td>
                    <td class="text-right font-weight-bold">{{ formatCurrency(type.monthlyPrice ?? 0) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/store/modules/auth'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'
import {
  countCourtReservationsByPeriod,
  computeMonthlyRevenue,
  countActiveStudents,
  getWeekRange,
  type ReservationCounts,
  type MonthlyRevenue,
  type RevenueStudentLike,
  type PackagePriceInfo,
} from '@/utils/bossMetrics'
import type { RawReservationDoc } from '@/utils/dailyReservationLimit'

const authStore = useAuthStore()
const membershipTypesStore = useMembershipTypesStore()

const loading = ref(true)
const errorMessage = ref('')
const infoMessage = ref('')
const today = new Date()

const reservationCounts = ref<ReservationCounts>({ daily: 0, weekly: 0, monthly: 0 })
const revenue = ref<MonthlyRevenue>({ total: 0, byPackage: [] })
const activeStudentCount = ref(0)

const activeMembershipTypes = computed(() => membershipTypesStore.activeTypes)

// --- Etiketler ---
const monthLabel = computed(() =>
  today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
)
const weekRangeLabel = computed(() => {
  const { start, end } = getWeekRange(today)
  return `${formatDate(new Date(start + 'T00:00:00'))} – ${formatDate(new Date(end + 'T00:00:00'))}`
})

const currencyFmt = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})
function formatCurrency(value: number): string {
  return currencyFmt.format(value)
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

// --- Veri yükleme ---

// Ayın ilk gününden bugüne kadarki kort rezervasyonlarını çeker. Bazı eski
// kayıtlarda `date` string olabildiğinden, aralık sorgusu yerine ayın tüm
// kayıtlarını çekip util ile bellekte normalize ediyoruz (okuma maliyetini
// sınırlamak için yalnızca bu ayın bir-iki haftalık penceresi yeterli; ay
// başını alt sınır olarak kullanıyoruz).
async function loadReservations(): Promise<void> {
  // Geniş, güvenli pencere: ayın başı (yerel). Timestamp tarihli kayıtlar için
  // alt sınır; string tarihli legacy kayıtlar bu filtreye takılmaz, bu yüzden
  // tüm koleksiyonu çekip bellekte ayıklamak en güvenli yoldur.
  const snapshot = await getDocs(collection(db, 'reservations'))
  const docs: RawReservationDoc[] = snapshot.docs.map((d) => d.data() as RawReservationDoc)
  reservationCounts.value = countCourtReservationsByPeriod(docs, today)
}

// Öğrencileri (role==student, deleted!=true) ve paket fiyat tablosunu kullanarak
// tahmini aylık ciroyu hesaplar.
async function loadRevenue(): Promise<void> {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')))

  // Ham doküman sayısı (silinmiş/pasif filtresinden ÖNCE) — "sorgu hiç öğrenci
  // döndürmedi" ile "öğrenci var ama hepsi elendi" durumlarını ayırt etmek için.
  const rawCount = snapshot.size
  const students: RevenueStudentLike[] = []
  snapshot.forEach((d) => {
    const data = d.data() as Record<string, unknown>
    if (data.deleted === true) return
    students.push({
      membershipType: (data.membershipType as string) || 'basic',
      status: data.status as string | undefined,
      deleted: data.deleted as boolean | undefined,
    })
  })

  // Paket fiyat tablosu (key → { name, monthlyPrice }) — store'dan kurulur.
  const typesMap: Record<string, PackagePriceInfo> = {}
  for (const t of membershipTypesStore.allTypes) {
    typesMap[t.key] = { name: t.name, monthlyPrice: t.monthlyPrice }
  }

  // AKTİF öğrenci = ciro hesabına giren küme (pasif/askıda hariç). `students`
  // dizisi yalnızca deleted!=true filtresinden geçtiği için TOPLAM sayıdır;
  // etiketteki "× paket fiyatı" ciroyla tutarlı olsun diye aktif sayıyı
  // computeMonthlyRevenue ile AYNI ölçütten (countActiveStudents) alıyoruz.
  const activeCount = countActiveStudents(students)
  activeStudentCount.value = activeCount
  revenue.value = computeMonthlyRevenue(students, typesMap)

  // Teşhis: ciro 0 ise NEDEN 0 olduğunu hem konsola hem (gerekirse) ekrana yaz.
  console.log(
    `📊 Patron ciro: role==student sorgusu ${rawCount} doküman döndürdü, ` +
      `${students.length} silinmemiş öğrenci (${activeCount} aktif), ` +
      `${membershipTypesStore.allTypes.length} paket türü, toplam ciro ${revenue.value.total}`,
  )
  if (rawCount === 0) {
    infoMessage.value =
      'Bu projede "role == student" olan kullanıcı bulunamadı, bu yüzden ciro ₺0. ' +
      'Öğrenci kayıtlarının bulunduğu Firebase projesine (urla-tenis) bağlı olduğunuzdan emin olun.'
  } else if (activeCount === 0) {
    infoMessage.value =
      `${rawCount} öğrenci bulundu ancak hepsi silinmiş/pasif olarak işaretli; aktif öğrenci yok.`
  } else if (revenue.value.total === 0) {
    infoMessage.value =
      `${activeCount} aktif öğrenci var ancak paketlerinin aylık fiyatı tanımsız (₺0). ` +
      'Fiyatlandırma tablosundan paket fiyatlarını kontrol edin.'
  }
}

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  try {
    await membershipTypesStore.initialize()
    await Promise.all([loadReservations(), loadRevenue()])
  } catch (error) {
    const err = error as { code?: string; message?: string }
    console.error('❌ Patron paneli verisi yüklenemedi:', error)
    if (err.code === 'permission-denied') {
      errorMessage.value =
        'Veri okuma izni reddedildi. Firestore kuralları güncellenmemiş olabilir ' +
        '(boss rolü için users okuma izni). Lütfen kuralları deploy edin.'
    } else {
      errorMessage.value = `Veri yüklenemedi: ${err.message ?? 'bilinmeyen hata'}`
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Ortak kart/gradient sınıfları main.css'te global tanımlı (welcome-section,
   modern-card, stat-card, stat-icon-wrapper, *-gradient, stat-number vb.). */

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.78);
}

.revenue-hero {
  height: 100%;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 600;
}
</style>
