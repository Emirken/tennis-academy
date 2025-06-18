<template>
  <div class="student-dashboard">
    <!-- Welcome Header -->
    <v-card class="welcome-header mb-6" elevation="8">
      <v-card-text class="pa-8">
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="d-flex align-center">
              <v-avatar size="64" :color="avatarColor" class="mr-4">
                <span class="text-white text-h4 font-weight-bold">
                  {{ userInitials }}
                </span>
              </v-avatar>
              <div>
                <h1 class="text-h4 font-weight-bold text-primary mb-2">
                  Welcome back, {{ student.firstName }}!
                </h1>
                <p class="text-h6 text-grey-darken-1">
                  {{ getCurrentGreeting() }}
                </p>
                <v-chip
                    :color="getMembershipColor(student.membershipType)"
                    variant="flat"
                    class="mt-2"
                >
                  <v-icon icon="mdi-star" class="mr-1" />
                  {{ student.membershipType }} Member
                </v-chip>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="text-md-right">
            <div class="quick-stats">
              <div class="stat-item mb-2">
                <span class="text-caption text-grey">Member Since</span>
                <div class="text-h6 font-weight-bold">{{ formatMemberSince() }}</div>
              </div>
              <div class="stat-item">
                <span class="text-caption text-grey">Next Lesson</span>
                <div class="text-body-1 font-weight-bold text-primary">{{ getNextLesson() }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Quick Actions -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-lightning-bolt" class="mr-2" />
        Quick Actions
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="6" sm="4" md="3">
            <v-btn
                color="success"
                variant="flat"
                size="large"
                block
                class="quick-action-btn"
                @click="$emit('navigate', 'make-reservation')"
            >
              <v-icon icon="mdi-calendar-plus" class="mb-2" size="32" />
              <br>Book Court
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-btn
                color="primary"
                variant="flat"
                size="large"
                block
                class="quick-action-btn"
                @click="$emit('navigate', 'my-reservations')"
            >
              <v-icon icon="mdi-calendar-check" class="mb-2" size="32" />
              <br>My Bookings
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-btn
                color="warning"
                variant="flat"
                size="large"
                block
                class="quick-action-btn"
                @click="$emit('navigate', 'payments')"
            >
              <v-icon icon="mdi-credit-card" class="mb-2" size="32" />
              <br>Payments
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-btn
                color="info"
                variant="flat"
                size="large"
                block
                class="quick-action-btn"
                @click="$emit('navigate', 'profile')"
            >
              <v-icon icon="mdi-account-cog" class="mb-2" size="32" />
              <br>Profile
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Status Cards Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="status-card" color="success" elevation="4">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-calendar-check</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.upcomingReservations }}</h3>
            <p class="text-body-1">Upcoming Bookings</p>
            <v-btn
                color="white"
                variant="text"
                size="small"
                @click="$emit('navigate', 'my-reservations')"
            >
              View All
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="status-card" color="primary" elevation="4">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-tennis</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.lessonsThisMonth }}</h3>
            <p class="text-body-1">Lessons This Month</p>
            <v-btn
                color="white"
                variant="text"
                size="small"
                @click="$emit('navigate', 'attendance')"
            >
              View Details
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="status-card" color="warning" elevation="4">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-percent</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.attendanceRate }}%</h3>
            <p class="text-body-1">Attendance Rate</p>
            <v-chip
                color="white"
                variant="flat"
                size="small"
                class="mt-2"
            >
              {{ getAttendanceStatus() }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="status-card" :color="getBalanceColor()" elevation="4">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">{{ getBalanceIcon() }}</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">${{ Math.abs(stats.accountBalance) }}</h3>
            <p class="text-body-1">{{ stats.accountBalance >= 0 ? 'Credit Balance' : 'Amount Due' }}</p>
            <v-btn
                v-if="stats.accountBalance < 0"
                color="white"
                variant="text"
                size="small"
                @click="$emit('navigate', 'make-payment')"
            >
              Pay Now
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Row -->
    <v-row>
      <!-- Left Column -->
      <v-col cols="12" lg="8">
        <!-- Today's Schedule -->
        <v-card class="mb-6" elevation="4">
          <v-card-title class="pa-6 bg-info text-white">
            <v-icon icon="mdi-calendar-today" class="mr-2" />
            Today's Schedule
            <v-spacer />
            <v-chip color="white" variant="flat" size="small">
              {{ formatToday() }}
            </v-chip>
          </v-card-title>
          <v-card-text class="pa-0">
            <div v-if="todaySchedule.length === 0" class="empty-schedule pa-8 text-center">
              <v-icon icon="mdi-calendar-blank" size="64" color="grey-lighten-2" class="mb-4" />
              <h3 class="text-h6 text-grey mb-2">No activities scheduled for today</h3>
              <p class="text-body-2 text-grey mb-4">
                Why not book a court or schedule a lesson?
              </p>
              <v-btn
                  color="primary"
                  variant="outlined"
                  @click="$emit('navigate', 'make-reservation')"
              >
                Book Now
              </v-btn>
            </div>

            <v-timeline v-else side="end" density="compact">
              <v-timeline-item
                  v-for="item in todaySchedule"
                  :key="item.id"
                  :dot-color="getScheduleItemColor(item.type)"
                  size="small"
              >
                <template #icon>
                  <v-icon
                      :icon="getScheduleItemIcon(item.type)"
                      size="16"
                  />
                </template>

                <v-card variant="outlined" class="schedule-item">
                  <v-card-text class="pa-4">
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <h4 class="text-h6 font-weight-bold mb-1">{{ item.title }}</h4>
                        <p class="text-body-2 text-grey mb-2">{{ item.description }}</p>
                        <v-chip
                            :color="getScheduleItemColor(item.type)"
                            size="small"
                            variant="tonal"
                        >
                          {{ item.time }}
                        </v-chip>
                      </div>
                      <v-menu>
                        <template #activator="{ props }">
                          <v-btn
                              icon="mdi-dots-vertical"
                              size="small"
                              variant="text"
                              v-bind="props"
                          />
                        </template>
                        <v-list>
                          <v-list-item @click="viewScheduleItem(item)">
                            <v-list-item-title>View Details</v-list-item-title>
                          </v-list-item>
                          <v-list-item v-if="canCancel(item)" @click="cancelScheduleItem(item)">
                            <v-list-item-title>Cancel</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <!-- Recent Activity -->
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-success text-white">
            <v-icon icon="mdi-history" class="mr-2" />
            Recent Activity
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="activity-item"
              >
                <template #prepend>
                  <v-avatar :color="activity.color" size="40">
                    <v-icon :icon="activity.icon" size="20" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ activity.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ activity.description }} • {{ formatActivityTime(activity.timestamp) }}
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                      :color="activity.statusColor"
                      size="small"
                      variant="tonal"
                  >
                    {{ activity.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div class="text-center pa-4">
              <v-btn
                  variant="text"
                  color="success"
                  @click="$emit('navigate', 'activity-history')"
              >
                View All Activity
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" lg="4">
        <!-- Weather Widget -->
        <v-card class="weather-card mb-6" elevation="4">
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h3 class="text-h5 font-weight-bold">{{ weather.location }}</h3>
                <p class="text-body-2 text-grey">{{ formatToday() }}</p>
              </div>
              <v-icon :icon="weather.icon" size="48" :color="weather.color" />
            </div>

            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h3 font-weight-bold">{{ weather.temperature }}°</div>
                <div class="text-body-1">{{ weather.condition }}</div>
              </div>
              <div class="text-right">
                <div class="text-body-2 text-grey">Feels like {{ weather.feelsLike }}°</div>
                <div class="text-body-2 text-grey">Humidity {{ weather.humidity }}%</div>
              </div>
            </div>

            <v-alert
                v-if="weather.courtStatus === 'closed'"
                color="warning"
                variant="tonal"
                class="mt-4"
                density="compact"
            >
              <v-icon icon="mdi-weather-lightning-rainy" class="mr-2" />
              Outdoor courts may be affected by weather
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Membership Progress -->
        <v-card class="membership-progress mb-6" elevation="4">
          <v-card-title class="pa-6 bg-purple text-white">
            <v-icon icon="mdi-trophy" class="mr-2" />
            Membership Progress
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="progress-item mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-1 font-weight-medium">Lessons Completed</span>
                <span class="text-h6 font-weight-bold text-purple">{{ membershipProgress.lessonsCompleted }}/{{ membershipProgress.lessonsTarget }}</span>
              </div>
              <v-progress-linear
                  :model-value="(membershipProgress.lessonsCompleted / membershipProgress.lessonsTarget) * 100"
                  color="purple"
                  height="8"
                  rounded
              />
            </div>

            <div class="progress-item mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-1 font-weight-medium">Court Hours</span>
                <span class="text-h6 font-weight-bold text-purple">{{ membershipProgress.courtHours }}/{{ membershipProgress.courtHoursLimit }}</span>
              </div>
              <v-progress-linear
                  :model-value="(membershipProgress.courtHours / membershipProgress.courtHoursLimit) * 100"
                  color="purple"
                  height="8"
                  rounded
              />
            </div>

            <div class="achievements mt-4">
              <h4 class="text-h6 mb-3">Recent Achievements</h4>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                    v-for="achievement in achievements"
                    :key="achievement.id"
                    :color="achievement.color"
                    size="small"
                    variant="flat"
                >
                  <v-icon :icon="achievement.icon" class="mr-1" />
                  {{ achievement.name }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Quick Links -->
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-grey-darken-1 text-white">
            <v-icon icon="mdi-link" class="mr-2" />
            Quick Links
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                  v-for="link in quickLinks"
                  :key="link.id"
                  @click="$emit('navigate', link.route)"
              >
                <template #prepend>
                  <v-icon :icon="link.icon" :color="link.color" />
                </template>
                <v-list-item-title>{{ link.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ link.description }}</v-list-item-subtitle>
                <template #append>
                  <v-icon icon="mdi-chevron-right" />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="3000"
        location="top"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Define interfaces
interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  membershipType: 'basic' | 'premium' | 'vip'
  joinDate: Date
}

interface ScheduleItem {
  id: string
  title: string
  description: string
  time: string
  type: 'lesson' | 'court_booking' | 'tournament'
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface Activity {
  id: string
  title: string
  description: string
  timestamp: Date
  icon: string
  color: string
  status: string
  statusColor: string
}

// Emits
defineEmits<{
  navigate: [route: string]
}>()

// Data
const successSnackbar = ref(false)
const successMessage = ref('')

// Mock student data
const student = ref<Student>({
  id: '1',
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  email: 'ahmet@example.com',
  membershipType: 'premium',
  joinDate: new Date('2024-01-15')
})

// Stats
const stats = ref({
  upcomingReservations: 3,
  lessonsThisMonth: 8,
  attendanceRate: 92,
  accountBalance: -150.00
})

// Today's schedule
const todaySchedule = ref<ScheduleItem[]>([
  {
    id: '1',
    title: 'Private Tennis Lesson',
    description: 'One-on-one coaching with Coach Smith',
    time: '10:00 - 11:00',
    type: 'lesson',
    status: 'confirmed'
  },
  {
    id: '2',
    title: 'Court Booking',
    description: 'Court 2 - Practice session',
    time: '15:00 - 16:30',
    type: 'court_booking',
    status: 'confirmed'
  }
])

// Recent activity
const recentActivity = ref<Activity[]>([
  {
    id: '1',
    title: 'Court Reservation',
    description: 'Booked Court 1 for tomorrow',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'mdi-calendar-plus',
    color: 'success',
    status: 'Confirmed',
    statusColor: 'success'
  },
  {
    id: '2',
    title: 'Payment Processed',
    description: 'Monthly membership fee paid',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: 'mdi-credit-card',
    color: 'primary',
    status: 'Completed',
    statusColor: 'success'
  },
  {
    id: '3',
    title: 'Lesson Attended',
    description: 'Private lesson with Coach Johnson',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: 'mdi-school',
    color: 'warning',
    status: 'Present',
    statusColor: 'success'
  }
])

// Weather data
const weather = ref({
  location: 'Urla, İzmir',
  temperature: 24,
  condition: 'Sunny',
  feelsLike: 26,
  humidity: 65,
  icon: 'mdi-weather-sunny',
  color: 'orange',
  courtStatus: 'open'
})

// Membership progress
const membershipProgress = ref({
  lessonsCompleted: 6,
  lessonsTarget: 10,
  courtHours: 15,
  courtHoursLimit: 25
})

// Achievements
const achievements = ref([
  { id: '1', name: '5 Lessons', icon: 'mdi-numeric-5-circle', color: 'success' },
  { id: '2', name: 'Perfect Week', icon: 'mdi-star', color: 'warning' },
  { id: '3', name: 'Early Bird', icon: 'mdi-weather-sunset-up', color: 'info' }
])

// Quick links
const quickLinks = ref([
  {
    id: '1',
    title: 'Download App',
    description: 'Get our mobile app',
    icon: 'mdi-cellphone',
    color: 'primary',
    route: 'download-app'
  },
  {
    id: '2',
    title: 'Academy Rules',
    description: 'Court rules and guidelines',
    icon: 'mdi-book-open',
    color: 'info',
    route: 'rules'
  },
  {
    id: '3',
    title: 'Contact Support',
    description: 'Get help and support',
    icon: 'mdi-help-circle',
    color: 'warning',
    route: 'support'
  },
  {
    id: '4',
    title: 'Feedback',
    description: 'Share your feedback',
    icon: 'mdi-star-outline',
    color: 'purple',
    route: 'feedback'
  }
])

// Computed
const userInitials = computed(() => {
  return `${student.value.firstName[0]}${student.value.lastName[0]}`
})

const avatarColor = computed(() => {
  const colors = ['primary', 'success', 'warning', 'info', 'error']
  const index = student.value.firstName.length % colors.length
  return colors[index]
})

// Methods
const getCurrentGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning! Ready for today\'s practice?'
  if (hour < 18) return 'Good afternoon! Time for some tennis?'
  return 'Good evening! How was your day on the court?'
}

const getMembershipColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'basic': 'info',
    'premium': 'warning',
    'vip': 'error'
  }
  return colors[type] || 'grey'
}

const formatMemberSince = (): string => {
  return student.value.joinDate.toLocaleDateString('tr-TR', {
    month: 'short',
    year: 'numeric'
  })
}

const getNextLesson = (): string => {
  // Find next lesson from schedule
  const nextLesson = todaySchedule.value.find(item => item.type === 'lesson')
  return nextLesson ? nextLesson.time : 'None scheduled'
}

const formatToday = (): string => {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

const getAttendanceStatus = (): string => {
  if (stats.value.attendanceRate >= 90) return 'Excellent'
  if (stats.value.attendanceRate >= 80) return 'Good'
  if (stats.value.attendanceRate >= 70) return 'Average'
  return 'Needs Improvement'
}

const getBalanceColor = (): string => {
  return stats.value.accountBalance >= 0 ? 'success' : 'error'
}

const getBalanceIcon = (): string => {
  return stats.value.accountBalance >= 0 ? 'mdi-plus-circle' : 'mdi-minus-circle'
}

const getScheduleItemColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'lesson': 'warning',
    'court_booking': 'primary',
    'tournament': 'error'
  }
  return colors[type] || 'grey'
}

const getScheduleItemIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    'lesson': 'mdi-school',
    'court_booking': 'mdi-tennis',
    'tournament': 'mdi-trophy'
  }
  return icons[type] || 'mdi-calendar'
}

const canCancel = (item: ScheduleItem): boolean => {
  return item.status === 'confirmed' || item.status === 'pending'
}

const formatActivityTime = (timestamp: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const viewScheduleItem = (item: ScheduleItem) => {
  console.log('View schedule item:', item)
}

const cancelScheduleItem = (item: ScheduleItem) => {
  console.log('Cancel schedule item:', item)
  successMessage.value = `${item.title} has been cancelled`
  successSnackbar.value = true
}

onMounted(() => {
  // Load dashboard data
  console.log('Dashboard loaded for user:', student.value.firstName)
})
</script>

<style scoped>
.student-dashboard {
  padding: 0;
}

/* Welcome Header */
.welcome-header {
  background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
  border-radius: 16px;
  border-left: 6px solid #2E7D32;
}

.quick-stats .stat-item {
  text-align: center;
}

/* Quick Action Buttons */
.quick-action-btn {
  height: 80px !important;
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  flex-direction: column;
  white-space: pre-line;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

/* Status Cards */
.status-card {
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.status-card:hover {
  transform: translateY(-4px);
}

/* Schedule Items */
.empty-schedule {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.schedule-item {
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.schedule-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateX(4px);
}

/* Timeline */
:deep(.v-timeline) {
  padding: 24px;
}

:deep(.v-timeline-item) {
  margin-bottom: 16px;
}

:deep(.v-timeline-item:last-child) {
  margin-bottom: 0;
}

/* Activity Items */
.activity-item {
  transition: background-color 0.3s ease;
  border-radius: 8px;
  margin: 4px 8px;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

/* Weather Card */
.weather-card {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-radius: 16px;
}

/* Membership Progress */
.membership-progress {
  border-radius: 16px;
}

.progress-item {
  margin-bottom: 16px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.achievements {
  background: rgba(156, 39, 176, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.achievements .gap-2 > * {
  margin-right: 8px;
  margin-bottom: 8px;
}

.achievements .gap-2 > *:last-child {
  margin-right: 0;
}

/* Quick Links */
:deep(.v-list-item) {
  transition: background-color 0.3s ease;
  border-radius: 8px;
  margin: 4px 8px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateX(4px);
}

:deep(.v-list-item-title) {
  font-weight: 600;
  color: #333;
}

:deep(.v-list-item-subtitle) {
  color: #666;
  font-size: 0.875rem;
}

/* Progress Bars */
:deep(.v-progress-linear) {
  border-radius: 8px;
}

:deep(.v-progress-linear__background) {
  opacity: 0.3;
}

/* Cards General */
:deep(.v-card) {
  border-radius: 12px;
}

:deep(.v-card-title) {
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Chips */
:deep(.v-chip) {
  font-weight: 600;
  letter-spacing: 0.25px;
}

:deep(.v-chip--size-small) {
  height: 24px;
  font-size: 0.75rem;
}

/* Avatar */
:deep(.v-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Timeline Custom */
:deep(.v-timeline-item__body) {
  margin-top: -8px;
}

:deep(.v-timeline-item__opposite) {
  align-self: flex-start;
  margin-top: 8px;
}

/* Snackbar */
:deep(.v-snackbar) {
  border-radius: 8px;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .quick-stats {
    text-align: left;
    margin-top: 16px;
  }
}

@media (max-width: 960px) {
  .welcome-header .pa-8 {
    padding: 24px !important;
  }

  .quick-action-btn {
    height: 70px !important;
    font-size: 0.875rem;
  }

  .status-card .text-h4 {
    font-size: 1.5rem;
  }

  .weather-card .text-h3 {
    font-size: 2rem;
  }
}

@media (max-width: 600px) {
  .student-dashboard {
    padding: 8px;
  }

  .welcome-header .pa-8 {
    padding: 16px !important;
  }

  .welcome-header h1 {
    font-size: 1.75rem !important;
  }

  .welcome-header .text-h6 {
    font-size: 1rem !important;
  }

  .quick-action-btn {
    height: 60px !important;
    font-size: 0.75rem;
  }

  .quick-action-btn .v-icon {
    font-size: 24px !important;
  }

  .status-card .text-h4 {
    font-size: 1.25rem;
  }

  .status-card .pa-6 {
    padding: 16px !important;
  }

  .weather-card .text-h3 {
    font-size: 1.75rem;
  }

  .weather-card .text-h5 {
    font-size: 1.25rem;
  }

  :deep(.v-timeline) {
    padding: 16px;
  }

  .schedule-item .pa-4 {
    padding: 12px !important;
  }

  .membership-progress .pa-6 {
    padding: 16px !important;
  }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .welcome-header {
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
  }

  .weather-card {
    background: linear-gradient(135deg, #0D47A1 0%, #1565C0 100%);
  }

  .activity-item:hover {
    background-color: #333;
  }

  :deep(.v-list-item:hover) {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .achievements {
    background: rgba(156, 39, 176, 0.2);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .status-card,
  .weather-card,
  .welcome-header {
    border: 2px solid #000;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
  }

  .schedule-item {
    border: 2px solid #ddd;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .quick-action-btn,
  .status-card,
  .schedule-item,
  .activity-item,
  :deep(.v-list-item) {
    transition: none;
  }

  .quick-action-btn:hover,
  .status-card:hover,
  .schedule-item:hover {
    transform: none;
  }
}

/* Print Styles */
@media print {
  .student-dashboard {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .welcome-header,
  .status-card,
  .weather-card {
    background: #f0f0f0 !important;
    color: #000 !important;
  }

  :deep(.v-btn),
  .quick-action-btn {
    display: none;
  }

  .status-card .text-white {
    color: #000 !important;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
    background: #f0f0f0 !important;
    color: #000 !important;
  }
}

/* Focus Styles for Accessibility */
:deep(.v-btn:focus),
:deep(.v-list-item:focus) {
  outline: 2px solid #2E7D32;
  outline-offset: 2px;
}

/* Loading States */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Custom Scrollbar */
.student-dashboard::-webkit-scrollbar {
  width: 8px;
}

.student-dashboard::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.student-dashboard::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.student-dashboard::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animation for cards on load */
.status-card,
.welcome-header,
.weather-card,
.membership-progress {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.status-card:nth-child(1) { animation-delay: 0.1s; }
.status-card:nth-child(2) { animation-delay: 0.2s; }
.status-card:nth-child(3) { animation-delay: 0.3s; }
.status-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Tooltip Custom Styling */
:deep(.v-tooltip .v-overlay__content) {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.25px;
  max-width: 300px;
  padding: 8px 12px;
}

/* Badge and Notification Styles */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #F44336;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Enhanced Card Hover Effects */
.status-card:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.weather-card:hover,
.membership-progress:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* Progress Ring Animation */
.progress-item .v-progress-linear {
  position: relative;
  overflow: hidden;
}

.progress-item .v-progress-linear::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Enhanced Typography */
.welcome-header h1 {
  background: linear-gradient(135deg, #2E7D32, #4CAF50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Status Indicators */
.status-indicator {
  position: relative;
}

.status-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Enhanced List Items */
:deep(.v-list-item) {
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

:deep(.v-list-item:hover) {
  border-left-color: #2E7D32;
  padding-left: 20px;
}

/* Grid Layout Improvements */
.dashboard-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (max-width: 600px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* Enhanced Empty States */
.empty-schedule {
  background: radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #dee2e6;
}

/* Weather Icon Animation */
.weather-card .v-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

/* Achievement Unlock Animation */
.achievements .v-chip {
  animation: achievementPop 0.5s ease-out;
}

@keyframes achievementPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
</style>