<template>
  <div class="payments-page">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">Payment Management</h1>
        <p class="page-subtitle">
          Track your payments and membership dues
        </p>
      </div>

      <!-- Payment Summary Cards -->
      <v-row class="mb-8">
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-credit-card"
                  size="48"
                  color="success"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-success">${{ totalPaid }}</h3>
              <p class="text-body-2">Total Paid</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-clock-alert"
                  size="48"
                  color="warning"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-warning">${{ pendingAmount }}</h3>
              <p class="text-body-2">Pending</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-alert-circle"
                  size="48"
                  color="error"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-error">${{ overdueAmount }}</h3>
              <p class="text-body-2">Overdue</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-calendar"
                  size="48"
                  color="primary"
                  class="mb-3"
              />
              <h3 class="text-h6 font-weight-bold text-primary">{{ nextPaymentDate }}</h3>
              <p class="text-body-2">Next Due Date</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Payment History -->
        <v-col cols="12" md="8">
          <v-card elevation="4">
            <v-card-title class="text-h5 pa-6 bg-primary text-white">
              <v-icon icon="mdi-history" class="mr-2" />
              Payment History
            </v-card-title>

            <v-card-text class="pa-0">
              <v-data-table
                  :headers="paymentHeaders"
                  :items="paymentHistory"
                  :items-per-page="10"
                  class="elevation-0"
              >
                <template #item.status="{ item }">
                  <v-chip
                      :color="getStatusColor(item.status)"
                      size="small"
                      variant="flat"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>

                <template #item.amount="{ item }">
                  <span class="font-weight-bold">${{ item.amount }}</span>
                </template>

                <template #item.dueDate="{ item }">
                  {{ formatDate(item.dueDate) }}
                </template>

                <template #item.paidDate="{ item }">
                  {{ item.paidDate ? formatDate(item.paidDate) : '-' }}
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                      v-if="item.status === 'pending'"
                      icon="mdi-credit-card"
                      size="small"
                      color="primary"
                      variant="text"
                      @click="payNow(item)"
                  />
                  <v-btn
                      icon="mdi-download"
                      size="small"
                      color="grey"
                      variant="text"
                      @click="downloadReceipt(item)"
                  />
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Payment Actions -->
        <v-col cols="12" md="4">
          <v-card class="mb-6" elevation="4">
            <v-card-title class="text-h5 pa-6 bg-success text-white">
              <v-icon icon="mdi-credit-card-plus" class="mr-2" />
              Quick Payment
            </v-card-title>

            <v-card-text class="pa-6">
              <v-form @submit.prevent="makePayment">
                <v-select
                    v-model="paymentForm.type"
                    label="Payment Type"
                    :items="paymentTypes"
                    variant="outlined"
                    class="mb-4"
                    required
                />

                <v-text-field
                    v-model="paymentForm.amount"
                    label="Amount ($)"
                    type="number"
                    variant="outlined"
                    prefix="$"
                    class="mb-4"
                    required
                />

                <v-btn
                    type="submit"
                    color="success"
                    variant="flat"
                    :loading="paymentLoading"
                    block
                >
                  Pay Now
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Membership Info -->
          <v-card elevation="4">
            <v-card-title class="text-h5 pa-6 bg-warning text-white">
              <v-icon icon="mdi-account-star" class="mr-2" />
              Membership Info
            </v-card-title>

            <v-card-text class="pa-6">
              <div class="membership-info">
                <div class="info-row mb-4">
                  <span class="info-label">Plan:</span>
                  <v-chip color="primary" variant="flat">{{ membershipPlan }}</v-chip>
                </div>

                <div class="info-row mb-4">
                  <span class="info-label">Monthly Fee:</span>
                  <span class="info-value">${{ monthlyFee }}</span>
                </div>

                <div class="info-row mb-4">
                  <span class="info-label">Status:</span>
                  <v-chip
                      :color="membershipStatus === 'Active' ? 'success' : 'error'"
                      variant="flat"
                  >
                    {{ membershipStatus }}
                  </v-chip>
                </div>

                <div class="info-row">
                  <span class="info-label">Renewal Date:</span>
                  <span class="info-value">{{ renewalDate }}</span>
                </div>
              </div>

              <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  class="mt-4"
                  @click="showUpgradeDialog = true"
              >
                Upgrade Plan
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Payment Dialog -->
    <v-dialog v-model="paymentDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Process Payment</v-card-title>
        <v-card-text>
          <p class="mb-4">
            You are about to pay <strong>${{ selectedPayment?.amount }}</strong>
            for {{ selectedPayment?.description }}.
          </p>

          <v-select
              v-model="paymentMethod"
              label="Payment Method"
              :items="paymentMethods"
              variant="outlined"
              class="mb-4"
          />

          <v-checkbox
              v-model="agreeTems"
              label="I agree to the terms and conditions"
              required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="paymentDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!agreeTems"
              :loading="paymentLoading"
              @click="processPayment"
          >
            Pay Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Upgrade Plan Dialog -->
    <v-dialog v-model="showUpgradeDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5">Upgrade Membership</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" v-for="plan in membershipPlans" :key="plan.name">
              <v-card
                  :color="plan.recommended ? 'primary' : 'default'"
                  :variant="plan.recommended ? 'flat' : 'outlined'"
                  class="text-center pa-4"
              >
                <h3 class="text-h5 mb-2" :class="plan.recommended ? 'text-white' : ''">
                  {{ plan.name }}
                </h3>
                <h2 class="text-h3 mb-2" :class="plan.recommended ? 'text-white' : 'text-primary'">
                  ${{ plan.price }}
                </h2>
                <p class="mb-4" :class="plan.recommended ? 'text-white' : ''">
                  per month
                </p>
                <v-btn
                    :color="plan.recommended ? 'white' : 'primary'"
                    :variant="plan.recommended ? 'flat' : 'outlined'"
                    @click="selectPlan(plan)"
                >
                  {{ plan.current ? 'Current Plan' : 'Select Plan' }}
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showUpgradeDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="4000"
        location="top"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { Payment } from '@/types/payment'

// Data
const totalPaid = ref(1200)
const pendingAmount = ref(200)
const overdueAmount = ref(0)
const paymentLoading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const paymentDialog = ref(false)
const showUpgradeDialog = ref(false)
const selectedPayment = ref<Payment | null>(null)
const paymentMethod = ref('credit-card')
const agreeTems = ref(false)

// Membership info
const membershipPlan = ref('Premium')
const monthlyFee = ref(200)
const membershipStatus = ref('Active')
const renewalDate = ref('July 1, 2025')

const nextPaymentDate = computed(() => {
  return 'July 1'
})

// Forms
const paymentForm = reactive({
  type: 'membership',
  amount: 200
})

// Options
const paymentTypes = [
  { title: 'Monthly Membership', value: 'membership' },
  { title: 'Court Rental', value: 'court-rental' },
  { title: 'Private Lesson', value: 'lesson' },
  { title: 'Other', value: 'other' }
]

const paymentMethods = [
  { title: 'Credit Card', value: 'credit-card' },
  { title: 'Bank Transfer', value: 'bank-transfer' },
  { title: 'Cash', value: 'cash' }
]

const membershipPlans = [
  {
    name: 'Basic',
    price: 100,
    current: false,
    recommended: false
  },
  {
    name: 'Premium',
    price: 200,
    current: true,
    recommended: true
  },
  {
    name: 'VIP',
    price: 300,
    current: false,
    recommended: false
  }
]

// Table headers
const paymentHeaders = [
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Amount', key: 'amount', sortable: true },
  { title: 'Due Date', key: 'dueDate', sortable: true },
  { title: 'Paid Date', key: 'paidDate', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Mock payment history
const paymentHistory = ref<Payment[]>([
  {
    id: '1',
    studentId: 'student1',
    amount: 200,
    type: 'membership',
    status: 'completed',
    dueDate: new Date('2025-05-01'),
    paidDate: new Date('2025-04-28'),
    description: 'Monthly Membership - May 2025'
  },
  {
    id: '2',
    studentId: 'student1',
    amount: 60,
    type: 'lesson',
    status: 'completed',
    dueDate: new Date('2025-05-15'),
    paidDate: new Date('2025-05-15'),
    description: 'Private Lesson - Court 1'
  },
  {
    id: '3',
    studentId: 'student1',
    amount: 200,
    type: 'membership',
    status: 'pending',
    dueDate: new Date('2025-06-01'),
    description: 'Monthly Membership - June 2025'
  }
])

// Methods
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    default: return 'grey'
  }
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const payNow = (payment: Payment) => {
  selectedPayment.value = payment
  paymentDialog.value = true
}

const processPayment = async () => {
  if (!selectedPayment.value) return

  paymentLoading.value = true

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update payment status
    const payment = paymentHistory.value.find(p => p.id === selectedPayment.value?.id)
    if (payment) {
      payment.status = 'completed'
      payment.paidDate = new Date()
    }

    // Update totals
    totalPaid.value += selectedPayment.value.amount
    pendingAmount.value -= selectedPayment.value.amount

    successMessage.value = 'Payment processed successfully!'
    successSnackbar.value = true
    paymentDialog.value = false

  } catch (error) {
    console.error('Payment failed:', error)
  } finally {
    paymentLoading.value = false
  }
}

const makePayment = async () => {
  paymentLoading.value = true

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Add new payment to history
    const newPayment: Payment = {
      id: Date.now().toString(),
      studentId: 'student1',
      amount: paymentForm.amount,
      type: paymentForm.type as 'membership' | 'lesson' | 'court-rental',
      status: 'completed',
      dueDate: new Date(),
      paidDate: new Date(),
      description: `${paymentTypes.find(t => t.value === paymentForm.type)?.title} - ${formatDate(new Date())}`
    }

    paymentHistory.value.unshift(newPayment)
    totalPaid.value += paymentForm.amount

    // Reset form
    paymentForm.amount = 200
    paymentForm.type = 'membership'

    successMessage.value = 'Payment completed successfully!'
    successSnackbar.value = true

  } catch (error) {
    console.error('Payment failed:', error)
  } finally {
    paymentLoading.value = false
  }
}

const downloadReceipt = (payment: Payment) => {
  // Simulate receipt download
  console.log('Downloading receipt for payment:', payment.id)
  successMessage.value = 'Receipt downloaded successfully!'
  successSnackbar.value = true
}

const selectPlan = (plan: any) => {
  if (plan.current) return

  // Simulate plan upgrade
  console.log('Upgrading to plan:', plan.name)
  successMessage.value = `Successfully upgraded to ${plan.name} plan!`
  successSnackbar.value = true
  showUpgradeDialog.value = false
}
</script>

<style scoped>
.payments-page {
  background-color: #fafafa;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2E7D32;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.summary-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
}

.membership-info .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #333;
}

:deep(.v-data-table) {
  border-radius: 0;
}

:deep(.v-field--outlined) {
  border-radius: 8px;
}

@media (max-width: 960px) {
  .page-title {
    font-size: 2rem;
  }
}
</style>