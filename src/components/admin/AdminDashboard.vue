<template>
  <div class="admin-dashboard-component">
    <!-- Overview Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="primary">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-group</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.totalStudents }}</h3>
            <p class="text-body-1">Total Students</p>
            <v-chip
                size="small"
                color="white"
                variant="flat"
                class="mt-2"
            >
              <v-icon start size="16">mdi-trending-up</v-icon>
              +{{ stats.newStudentsThisMonth }} this month
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="success">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-tennis</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.activeCourts }}</h3>
            <p class="text-body-1">Active Courts</p>
            <v-chip
                size="small"
                color="white"
                variant="flat"
                class="mt-2"
            >
              {{ Math.round(stats.courtUtilization) }}% utilization
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="warning">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-currency-usd</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">${{ formatNumber(stats.monthlyRevenue) }}</h3>
            <p class="text-body-1">Monthly Revenue</p>
            <v-chip
                size="small"
                color="white"
                variant="flat"
                class="mt-2"
            >
              <v-icon start size="16">mdi-trending-up</v-icon>
              +{{ stats.revenueGrowth }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="info">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-calendar-check</v-icon>
            <h3 class="text-h4 font-weight-bold mb-2">{{ stats.todayBookings }}</h3>
            <p class="text-body-1">Today's Bookings</p>
            <v-chip
                size="small"
                color="white"
                variant="flat"
                class="mt-2"
            >
              {{ stats.upcomingBookings }} upcoming
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-primary text-white">
            <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
            Quick Actions
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                    color="primary"
                    variant="flat"
                    block
                    size="large"
                    @click="$emit('navigate', 'add-student')"
                >
                  <v-icon class="mr-2">mdi-account-plus</v-icon>
                  Add Student
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                    color="success"
                    variant="flat"
                    block
                    size="large"
                    @click="$emit('navigate', 'mark-attendance')"
                >
                  <v-icon class="mr-2">mdi-checkbox-marked</v-icon>
                  Mark Attendance
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                    color="warning"
                    variant="flat"
                    block
                    size="large"
                    @click="$emit('navigate', 'court-management')"
                >
                  <v-icon class="mr-2">mdi-tennis-ball</v-icon>
                  Manage Courts
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                    color="info"
                    variant="flat"
                    block
                    size="large"
                    @click="generateReport"
                >
                  <v-icon class="mr-2">mdi-file-chart</v-icon>
                  Generate Report
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts and Analytics -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-success text-white">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Revenue Analytics
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="chart-placeholder">
              <div class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-chart-line</v-icon>
                <h3 class="text-h5 mt-4 mb-2">Revenue Chart</h3>
                <p class="text-body-2 text-grey">
                  Monthly revenue trends would be displayed here
                </p>
                <div class="mt-4">
                  <v-chip
                      v-for="month in revenueData"
                      :key="month.month"
                      class="ma-1"
                      color="success"
                      variant="outlined"
                  >
                    {{ month.month }}: ${{ formatNumber(month.revenue) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-warning text-white">
            <v-icon class="mr-2">mdi-chart-donut</v-icon>
            Court Usage
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="usage-stats">
              <div
                  v-for="court in courtUsage"
                  :key="court.id"
                  class="usage-item mb-4"
              >
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="font-weight-medium">{{ court.name }}</span>
                  <span class="text-primary font-weight-bold">{{ court.usage }}%</span>
                </div>
                <v-progress-linear
                    :model-value="court.usage"
                    :color="getUsageColor(court.usage)"
                    height="8"
                    rounded
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activities and Alerts -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-info text-white">
            <v-icon class="mr-2">mdi-history</v-icon>
            Recent Activities
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  class="px-6 py-3"
              >
                <template #prepend>
                  <v-avatar :color="activity.color" size="32">
                    <v-icon :icon="activity.icon" size="18" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ activity.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ activity.description }} • {{ formatTime(activity.time) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div class="text-center pa-4">
              <v-btn
                  variant="text"
                  color="info"
                  @click="$emit('navigate', 'all-activities')"
              >
                View All Activities
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title class="pa-6 bg-error text-white">
            <v-icon class="mr-2">mdi-alert</v-icon>
            Alerts & Notifications
          </v-card-title>
          <v-card-text class="pa-6">
            <div
                v-for="alert in alerts"
                :key="alert.id"
                class="alert-item mb-4"
            >
              <v-alert
                  :type="alert.type"
                  variant="tonal"
                  :icon="alert.icon"
                  class="mb-0"
              >
                <v-alert-title>{{ alert.title }}</v-alert-title>
                {{ alert.message }}

                <template #append v-if="alert.actionText">
                  <v-btn
                      :color="alert.type"
                      size="small"
                      variant="text"
                      @click="handleAlertAction(alert)"
                  >
                    {{ alert.actionText }}
                  </v-btn>
                </template>
              </v-alert>
            </div>

            <div v-if="alerts.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey-lighten-2">mdi-check-circle</v-icon>
              <p class="text-body-2 text-grey mt-2">No alerts at this time</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Emits
defineEmits(['navigate'])

// Mock data with proper types
const stats = ref({
  totalStudents: 125,
  newStudentsThisMonth: 8,
  activeCourts: 4,
  courtUtilization: 78.5,
  monthlyRevenue: 25480,
  revenueGrowth: 12,
  todayBookings: 18,
  upcomingBookings: 24
})

// Define alert type
interface AlertItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  icon: string
  actionText?: string
  action?: string
}

const revenueData = ref([
  { month: 'Jan', revenue: 22000 },
  { month: 'Feb', revenue: 23500 },
  { month: 'Mar', revenue: 24200 },
  { month: 'Apr', revenue: 25480 },
  { month: 'May', revenue: 26100 },
  { month: 'Jun', revenue: 25800 }
])

const courtUsage = ref([
  { id: '1', name: 'Court 1', usage: 85 },
  { id: '2', name: 'Court 2', usage: 72 },
  { id: '3', name: 'Court 3', usage: 90 },
  { id: '4', name: 'Court 4', usage: 67 }
])

const recentActivities = ref([
  {
    id: '1',
    title: 'New Student Registration',
    description: 'John Smith registered for Premium membership',
    time: new Date(Date.now() - 15 * 60 * 1000),
    icon: 'mdi-account-plus',
    color: 'success'
  },
  {
    id: '2',
    title: 'Payment Received',
    description: 'Monthly payment from Sarah Wilson - $200',
    time: new Date(Date.now() - 45 * 60 * 1000),
    icon: 'mdi-credit-card',
    color: 'primary'
  },
  {
    id: '3',
    title: 'Court Maintenance',
    description: 'Court 2 maintenance completed',
    time: new Date(Date.now() - 120 * 60 * 1000),
    icon: 'mdi-wrench',
    color: 'warning'
  },
  {
    id: '4',
    title: 'Class Scheduled',
    description: 'Group lesson scheduled for 3:00 PM',
    time: new Date(Date.now() - 180 * 60 * 1000),
    icon: 'mdi-calendar-plus',
    color: 'info'
  }
])

const alerts = ref<AlertItem[]>([
  {
    id: '1',
    type: 'warning',
    title: 'Overdue Payments',
    message: '3 students have overdue payments totaling $600',
    icon: 'mdi-currency-usd-off',
    actionText: 'Review',
    action: 'review-payments'
  },
  {
    id: '2',
    type: 'info',
    title: 'Court Booking Alert',
    message: 'Weekend slots are 95% booked for next week',
    icon: 'mdi-calendar-alert',
    actionText: 'View',
    action: 'view-bookings'
  },
  {
    id: '3',
    type: 'error',
    title: 'Equipment Check',
    message: 'Court 3 net needs replacement',
    icon: 'mdi-tennis',
    actionText: 'Schedule',
    action: 'schedule-maintenance'
  }
])

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

const getUsageColor = (usage: number): string => {
  if (usage >= 80) return 'success'
  if (usage >= 60) return 'warning'
  return 'error'
}

const generateReport = () => {
  console.log('Generating admin report...')
  // Emit navigate event or handle report generation
}

const handleAlertAction = (alert: AlertItem) => {
  console.log('Handling alert action:', alert.action)
  // Handle specific alert actions
}
</script>

<style scoped>
.admin-dashboard-component {
  padding: 0;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.chart-placeholder {
  min-height: 300px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.usage-item:last-child {
  margin-bottom: 0 !important;
}

.alert-item:last-child {
  margin-bottom: 0 !important;
}

:deep(.v-alert) {
  border-radius: 8px;
}

:deep(.v-progress-linear) {
  border-radius: 4px;
}

@media (max-width: 600px) {
  .stat-card .text-h4 {
    font-size: 1.5rem;
  }

  .chart-placeholder {
    min-height: 200px;
  }
}
</style>