<template>
  <div class="payment-history">
    <!-- Header Section -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-credit-card-outline" class="mr-2" />
        Payment History & Billing
      </v-card-title>
      <v-card-text class="pa-6">
        <!-- Current Balance & Quick Stats -->
        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-card class="balance-card" :color="balanceColor" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon :icon="balanceIcon" size="32" :color="balanceColor" class="mb-2" />
                <div class="text-h5 font-weight-bold" :class="`text-${balanceColor}`">
                  ${{ Math.abs(currentBalance) }}
                </div>
                <div class="text-caption">
                  {{ currentBalance >= 0 ? 'Credit Balance' : 'Outstanding Balance' }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="stat-card" color="success" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-check-circle" size="32" color="success" class="mb-2" />
                <div class="text-h6 font-weight-bold text-success">${{ stats.totalPaid }}</div>
                <div class="text-caption">Total Paid</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="stat-card" color="info" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-calendar-month" size="32" color="info" class="mb-2" />
                <div class="text-h6 font-weight-bold text-info">${{ stats.thisMonth }}</div>
                <div class="text-caption">This Month</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="stat-card" color="warning" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-calendar-clock" size="32" color="warning" class="mb-2" />
                <div class="text-h6 font-weight-bold text-warning">{{ stats.pendingCount }}</div>
                <div class="text-caption">Pending Payments</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Filters -->
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="filters.dateFrom"
                label="From Date"
                type="date"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="filters.dateTo"
                label="To Date"
                type="date"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.status"
                label="Status"
                :items="statusOptions"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-filter"
                clearable
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.type"
                label="Payment Type"
                :items="typeOptions"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-tag"
                clearable
                @update:model-value="applyFilters"
            />
          </v-col>
        </v-row>

        <!-- Quick Actions -->
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex flex-wrap gap-2">
            <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-plus"
                @click="showMakePaymentDialog = true"
            >
              Make Payment
            </v-btn>
            <v-btn
                color="success"
                variant="outlined"
                prepend-icon="mdi-download"
                @click="exportPayments"
            >
              Export
            </v-btn>
            <v-btn
                color="info"
                variant="outlined"
                prepend-icon="mdi-file-pdf-box"
                @click="downloadStatement"
            >
              Download Statement
            </v-btn>
            <v-btn
                v-if="hasOverdue"
                color="warning"
                variant="outlined"
                prepend-icon="mdi-credit-card-clock"
                @click="payOverdue"
            >
              Pay Overdue ({{ overdueCount }})
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Payment History Table -->
    <v-card elevation="4">
      <v-card-title class="pa-6 bg-success text-white d-flex justify-space-between align-center">
        <div>
          <v-icon icon="mdi-history" class="mr-2" />
          Payment History
        </div>
        <v-chip color="white" variant="flat">
          {{ filteredPayments.length }} payments
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Desktop Table -->
        <v-data-table
            :headers="headers"
            :items="filteredPayments"
            :items-per-page="itemsPerPage"
            :loading="loading"
            class="elevation-0 d-none d-md-table"
            :sort-by="sortBy"
        >
          <template #item.date="{ item }">
            <div class="date-cell">
              <div class="font-weight-medium">{{ formatDate(item.date) }}</div>
              <div class="text-caption text-grey">{{ formatTime(item.date) }}</div>
            </div>
          </template>

          <template #item.description="{ item }">
            <div class="description-cell">
              <div class="font-weight-medium">{{ item.description }}</div>
              <div v-if="item.invoiceNumber" class="text-caption text-grey">
                Invoice: {{ item.invoiceNumber }}
              </div>
              <div v-if="item.period" class="text-caption text-grey">
                Period: {{ item.period }}
              </div>
            </div>
          </template>

          <template #item.amount="{ item }">
            <div class="amount-cell">
              <div
                  class="text-h6 font-weight-bold"
                  :class="getAmountClass(item)"
              >
                {{ getAmountPrefix(item) }}${{ Math.abs(item.amount) }}
              </div>
              <div v-if="item.currency && item.currency !== 'USD'" class="text-caption text-grey">
                ({{ item.originalAmount }} {{ item.currency }})
              </div>
            </div>
          </template>

          <template #item.method="{ item }">
            <v-chip
                :color="getPaymentMethodColor(item.method)"
                size="small"
                variant="flat"
                :prepend-icon="getPaymentMethodIcon(item.method)"
            >
              {{ item.method }}
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
                :prepend-icon="getStatusIcon(item.status)"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex">
              <v-tooltip text="View Details">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-eye"
                      size="small"
                      color="info"
                      variant="text"
                      v-bind="props"
                      @click="viewPaymentDetails(item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="canDownloadReceipt(item)" text="Download Receipt">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-download"
                      size="small"
                      color="primary"
                      variant="text"
                      v-bind="props"
                      @click="downloadReceipt(item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="canRefund(item)" text="Request Refund">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-undo"
                      size="small"
                      color="warning"
                      variant="text"
                      v-bind="props"
                      @click="requestRefund(item)"
                  />
                </template>
              </v-tooltip>

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
                  <v-list-item @click="sendReceiptEmail(item)">
                    <v-list-item-title>
                      <v-icon icon="mdi-email" class="mr-2" />
                      Email Receipt
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item v-if="canDispute(item)" @click="disputePayment(item)">
                    <v-list-item-title>
                      <v-icon icon="mdi-alert-circle" class="mr-2" />
                      Dispute Payment
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="copyTransactionId(item)">
                    <v-list-item-title>
                      <v-icon icon="mdi-content-copy" class="mr-2" />
                      Copy Transaction ID
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>

        <!-- Mobile Cards -->
        <div class="d-md-none mobile-payments">
          <v-card
              v-for="payment in filteredPayments"
              :key="payment.id"
              class="mb-3 mx-4"
              elevation="2"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-start mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">{{ payment.description }}</div>
                  <div class="text-caption text-grey">{{ formatDate(payment.date) }}</div>
                </div>
                <v-chip
                    :color="getStatusColor(payment.status)"
                    size="small"
                    variant="flat"
                    :prepend-icon="getStatusIcon(payment.status)"
                >
                  {{ getStatusText(payment.status) }}
                </v-chip>
              </div>

              <div class="amount-display mb-3">
                <span
                    class="text-h5 font-weight-bold"
                    :class="getAmountClass(payment)"
                >
                  {{ getAmountPrefix(payment) }}${{ Math.abs(payment.amount) }}
                </span>
              </div>

              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-grey">Payment Method</div>
                  <v-chip
                      :color="getPaymentMethodColor(payment.method)"
                      size="small"
                      variant="flat"
                      :prepend-icon="getPaymentMethodIcon(payment.method)"
                      class="mt-1"
                  >
                    {{ payment.method }}
                  </v-chip>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Transaction ID</div>
                  <div class="text-body-2 font-weight-medium mt-1">{{ payment.transactionId }}</div>
                </v-col>
              </v-row>

              <v-row v-if="payment.invoiceNumber || payment.period" dense class="mt-2">
                <v-col v-if="payment.invoiceNumber" cols="6">
                  <div class="text-caption text-grey">Invoice</div>
                  <div class="text-body-2 font-weight-medium">{{ payment.invoiceNumber }}</div>
                </v-col>
                <v-col v-if="payment.period" cols="6">
                  <div class="text-caption text-grey">Period</div>
                  <div class="text-body-2 font-weight-medium">{{ payment.period }}</div>
                </v-col>
              </v-row>

              <v-card-actions class="pa-0 mt-3">
                <v-btn
                    color="info"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-eye"
                    @click="viewPaymentDetails(payment)"
                >
                  Details
                </v-btn>
                <v-spacer />
                <v-btn
                    v-if="canDownloadReceipt(payment)"
                    color="primary"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-download"
                    @click="downloadReceipt(payment)"
                >
                  Receipt
                </v-btn>
              </v-card-actions>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPayments.length === 0" class="empty-state pa-8 text-center">
          <v-icon icon="mdi-credit-card-off" size="64" color="grey-lighten-2" class="mb-4" />
          <h3 class="text-h6 text-grey mb-2">No Payment Records</h3>
          <p class="text-body-2 text-grey">
            No payment records found for the selected filters.
          </p>
          <v-btn color="primary" variant="outlined" @click="clearFilters">
            Clear Filters
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Payment Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="700">
      <v-card v-if="selectedPayment">
        <v-card-title class="pa-6 bg-info text-white">
          <v-icon icon="mdi-receipt" class="mr-2" />
          Payment Details
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-h6 mb-3">Transaction Information</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Transaction ID:</v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold">
                    {{ selectedPayment.transactionId }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Date & Time:</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(selectedPayment.date) }} at {{ formatTime(selectedPayment.date) }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Amount:</v-list-item-title>
                  <v-list-item-subtitle>
                    <span
                        class="text-h6 font-weight-bold"
                        :class="getAmountClass(selectedPayment)"
                    >
                      {{ getAmountPrefix(selectedPayment) }}${{ Math.abs(selectedPayment.amount) }}
                    </span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Payment Method:</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                        :color="getPaymentMethodColor(selectedPayment.method)"
                        size="small"
                        variant="flat"
                        :prepend-icon="getPaymentMethodIcon(selectedPayment.method)"
                    >
                      {{ selectedPayment.method }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Status:</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                        :color="getStatusColor(selectedPayment.status)"
                        size="small"
                        variant="flat"
                        :prepend-icon="getStatusIcon(selectedPayment.status)"
                    >
                      {{ getStatusText(selectedPayment.status) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <h4 class="text-h6 mb-3">Billing Information</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Description:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedPayment.description }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedPayment.invoiceNumber">
                  <v-list-item-title>Invoice Number:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedPayment.invoiceNumber }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedPayment.period">
                  <v-list-item-title>Billing Period:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedPayment.period }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedPayment.dueDate">
                  <v-list-item-title>Due Date:</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedPayment.dueDate) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedPayment.lateFee">
                  <v-list-item-title>Late Fee:</v-list-item-title>
                  <v-list-item-subtitle class="text-warning font-weight-bold">
                    ${{ selectedPayment.lateFee }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div v-if="selectedPayment.notes" class="notes-section">
            <h4 class="text-h6 mb-2">Notes</h4>
            <p class="text-body-2">{{ selectedPayment.notes }}</p>
          </div>

          <div v-if="selectedPayment.breakdown" class="breakdown-section mt-4">
            <h4 class="text-h6 mb-3">Payment Breakdown</h4>
            <v-table density="compact">
              <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Amount</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="item in selectedPayment.breakdown" :key="item.name">
                <td>{{ item.name }}</td>
                <td class="text-right">${{ item.amount }}</td>
              </tr>
              <tr class="font-weight-bold">
                <td>Total</td>
                <td class="text-right">${{ Math.abs(selectedPayment.amount) }}</td>
              </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-btn
              v-if="canDownloadReceipt(selectedPayment)"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-download"
              @click="downloadReceipt(selectedPayment)"
          >
            Download Receipt
          </v-btn>
          <v-btn
              color="success"
              variant="outlined"
              prepend-icon="mdi-email"
              @click="sendReceiptEmail(selectedPayment)"
          >
            Email Receipt
          </v-btn>
          <v-spacer />
          <v-btn @click="showDetailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Make Payment Dialog -->
    <v-dialog v-model="showMakePaymentDialog" max-width="600">
      <v-card>
        <v-card-title class="pa-6 bg-primary text-white">
          <v-icon icon="mdi-credit-card-plus" class="mr-2" />
          Make a Payment
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="paymentForm" v-model="paymentFormValid">
            <v-row>
              <v-col cols="12">
                <v-select
                    v-model="paymentForm.type"
                    label="Payment Type"
                    :items="paymentTypeOptions"
                    variant="outlined"
                    :rules="typeRules"
                    required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="paymentForm.amount"
                    label="Amount ($)"
                    type="number"
                    variant="outlined"
                    :rules="amountRules"
                    prefix="$"
                    required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                    v-model="paymentForm.method"
                    label="Payment Method"
                    :items="paymentMethodOptions"
                    variant="outlined"
                    :rules="methodRules"
                    required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                    v-model="paymentForm.notes"
                    label="Notes (optional)"
                    variant="outlined"
                    rows="3"
                />
              </v-col>
            </v-row>

            <v-alert v-if="paymentForm.amount" color="info" variant="tonal" class="mt-4">
              <v-icon icon="mdi-information" class="mr-2" />
              Processing fee may apply based on payment method selected.
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showMakePaymentDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!paymentFormValid"
              :loading="paymentProcessing"
              @click="processPayment"
          >
            Process Payment
          </v-btn>
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
      <template #actions>
        <v-btn variant="text" @click="successSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// Define interfaces
interface PaymentRecord {
  id: string
  date: Date
  description: string
  amount: number
  method: string
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed'
  type: 'membership' | 'lesson' | 'court_rental' | 'equipment' | 'late_fee' | 'refund'
  transactionId: string
  invoiceNumber?: string
  period?: string
  dueDate?: Date
  lateFee?: number
  currency?: string
  originalAmount?: number
  notes?: string
  breakdown?: Array<{ name: string; amount: number }>
}

// Data
const loading = ref(false)
const showDetailsDialog = ref(false)
const showMakePaymentDialog = ref(false)
const selectedPayment = ref<PaymentRecord | null>(null)
const successSnackbar = ref(false)
const successMessage = ref('')
const itemsPerPage = ref(10)
const paymentProcessing = ref(false)
const paymentFormValid = ref(false)

// Current balance (negative means owed, positive means credit)
const currentBalance = ref(-150.00)

// Filters
const filters = reactive({
  dateFrom: '',
  dateTo: '',
  status: '',
  type: ''
})

// Payment form
const paymentForm = reactive({
  type: '',
  amount: '',
  method: '',
  notes: ''
})

// Sort options
const sortBy:any = ref([{ key: 'date', order: 'desc' }])

// Options
const statusOptions = [
  { title: 'Completed', value: 'completed' },
  { title: 'Pending', value: 'pending' },
  { title: 'Failed', value: 'failed' },
  { title: 'Refunded', value: 'refunded' },
  { title: 'Disputed', value: 'disputed' }
]

const typeOptions = [
  { title: 'Membership Fee', value: 'membership' },
  { title: 'Private Lesson', value: 'lesson' },
  { title: 'Court Rental', value: 'court_rental' },
  { title: 'Equipment', value: 'equipment' },
  { title: 'Late Fee', value: 'late_fee' },
  { title: 'Refund', value: 'refund' }
]

const paymentTypeOptions = [
  { title: 'Membership Fee', value: 'membership' },
  { title: 'Lesson Payment', value: 'lesson' },
  { title: 'Court Rental', value: 'court_rental' },
  { title: 'Equipment Purchase', value: 'equipment' },
  { title: 'Other', value: 'other' }
]

const paymentMethodOptions = [
  { title: 'Credit Card', value: 'credit_card' },
  { title: 'Debit Card', value: 'debit_card' },
  { title: 'Bank Transfer', value: 'bank_transfer' },
  { title: 'Cash', value: 'cash' },
  { title: 'Check', value: 'check' }
]

// Validation rules
const typeRules = [
  (v: string) => !!v || 'Payment type is required'
]

const amountRules = [
  (v: string) => !!v || 'Amount is required',
  (v: string) => parseFloat(v) > 0 || 'Amount must be greater than 0'
]

const methodRules = [
  (v: string) => !!v || 'Payment method is required'
]

// Table headers
const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Amount', key: 'amount', sortable: true },
  { title: 'Method', key: 'method', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Mock payment data
const paymentRecords = ref<PaymentRecord[]>([
  {
    id: '1',
    date: new Date('2025-06-01'),
    description: 'Monthly Membership Fee - Premium',
    amount: 199.00,
    method: 'credit_card',
    status: 'completed',
    type: 'membership',
    transactionId: 'TXN_001234567',
    invoiceNumber: 'INV-2025-001',
    period: 'June 2025',
    breakdown: [
      { name: 'Premium Membership', amount: 199.00 }
    ]
  },
  {
    id: '2',
    date: new Date('2025-05-28'),
    description: 'Private Tennis Lesson',
    amount: 75.00,
    method: 'debit_card',
    status: 'completed',
    type: 'lesson',
    transactionId: 'TXN_001234566',
    invoiceNumber: 'INV-2025-002',
    notes: 'One-on-one coaching session with Coach Smith'
  },
  {
    id: '3',
    date: new Date('2025-05-25'),
    description: 'Court Rental - Evening Session',
    amount: 45.00,
    method: 'cash',
    status: 'completed',
    type: 'court_rental',
    transactionId: 'TXN_001234565',
    period: '2 hours - Court 3',
    notes: 'Evening court rental with friends'
  },
  {
    id: '4',
    date: new Date('2025-05-20'),
    description: 'Late Payment Fee',
    amount: 25.00,
    method: 'credit_card',
    status: 'completed',
    type: 'late_fee',
    transactionId: 'TXN_001234564',
    invoiceNumber: 'INV-2025-003',
    notes: 'Late fee for April membership payment'
  },
  {
    id: '5',
    date: new Date('2025-05-15'),
    description: 'Equipment Purchase - Tennis Racket',
    amount: 120.00,
    method: 'credit_card',
    status: 'pending',
    type: 'equipment',
    transactionId: 'TXN_001234563',
    notes: 'Wilson Pro Staff v13 - Size 4'
  },
  {
    id: '6',
    date: new Date('2025-05-10'),
    description: 'Refund - Cancelled Lesson',
    amount: -60.00,
    method: 'credit_card',
    status: 'refunded',
    type: 'refund',
    transactionId: 'TXN_001234562',
    notes: 'Refund for cancelled private lesson due to weather'
  }
])

// Computed
const filteredPayments = computed(() => {
  let filtered = paymentRecords.value

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    filtered = filtered.filter(payment => payment.date >= fromDate)
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    filtered = filtered.filter(payment => payment.date <= toDate)
  }

  if (filters.status) {
    filtered = filtered.filter(payment => payment.status === filters.status)
  }

  if (filters.type) {
    filtered = filtered.filter(payment => payment.type === filters.type)
  }

  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
})

const stats = computed(() => {
  const payments = filteredPayments.value
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return {
    totalPaid: payments
        .filter(p => p.status === 'completed' && p.amount > 0)
        .reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments
        .filter(p =>
            p.status === 'completed' &&
            p.date.getMonth() === currentMonth &&
            p.date.getFullYear() === currentYear &&
            p.amount > 0
        )
        .reduce((sum, p) => sum + p.amount, 0),
    pendingCount: payments.filter(p => p.status === 'pending').length
  }
})

const balanceColor = computed(() => {
  return currentBalance.value >= 0 ? 'success' : 'error'
})

const balanceIcon = computed(() => {
  return currentBalance.value >= 0 ? 'mdi-plus-circle' : 'mdi-minus-circle'
})

const hasOverdue = computed(() => {
  return paymentRecords.value.some(p =>
      p.status === 'pending' &&
      p.dueDate &&
      p.dueDate < new Date()
  )
})

const overdueCount = computed(() => {
  return paymentRecords.value.filter(p =>
      p.status === 'pending' &&
      p.dueDate &&
      p.dueDate < new Date()
  ).length
})

// Methods
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAmountClass = (payment: PaymentRecord): string => {
  if (payment.amount < 0) return 'text-success' // Refund/credit
  if (payment.status === 'failed') return 'text-error'
  if (payment.status === 'pending') return 'text-warning'
  return 'text-primary'
}

const getAmountPrefix = (payment: PaymentRecord): string => {
  return payment.amount < 0 ? '+' : ''
}

const getPaymentMethodColor = (method: string): string => {
  const colors: { [key: string]: string } = {
    'credit_card': 'primary',
    'debit_card': 'info',
    'bank_transfer': 'success',
    'cash': 'warning',
    'check': 'purple'
  }
  return colors[method] || 'grey'
}

const getPaymentMethodIcon = (method: string): string => {
  const icons: { [key: string]: string } = {
    'credit_card': 'mdi-credit-card',
    'debit_card': 'mdi-credit-card-outline',
    'bank_transfer': 'mdi-bank',
    'cash': 'mdi-cash',
    'check': 'mdi-checkbook'
  }
  return icons[method] || 'mdi-currency-usd'
}

const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    'completed': 'success',
    'pending': 'warning',
    'failed': 'error',
    'refunded': 'info',
    'disputed': 'purple'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status: string): string => {
  const icons: { [key: string]: string } = {
    'completed': 'mdi-check-circle',
    'pending': 'mdi-clock-outline',
    'failed': 'mdi-close-circle',
    'refunded': 'mdi-undo',
    'disputed': 'mdi-alert-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

const getStatusText = (status: string): string => {
  const texts: { [key: string]: string } = {
    'completed': 'Completed',
    'pending': 'Pending',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'disputed': 'Disputed'
  }
  return texts[status] || status
}

const canDownloadReceipt = (payment: PaymentRecord): boolean => {
  return payment.status === 'completed' || payment.status === 'refunded'
}

const canRefund = (payment: PaymentRecord): boolean => {
  return payment.status === 'completed' &&
      payment.amount > 0 &&
      payment.type !== 'late_fee'
}

const canDispute = (payment: PaymentRecord): boolean => {
  return payment.status === 'completed' && payment.amount > 0
}

const applyFilters = () => {
  // Filters are applied reactively through computed property
}

const clearFilters = () => {
  Object.assign(filters, {
    dateFrom: '',
    dateTo: '',
    status: '',
    type: ''
  })
}

const viewPaymentDetails = (payment: PaymentRecord) => {
  selectedPayment.value = payment
  showDetailsDialog.value = true
}

const downloadReceipt = (payment: PaymentRecord) => {
  console.log('Downloading receipt for:', payment.id)
  successMessage.value = 'Receipt download started'
  successSnackbar.value = true
}

const sendReceiptEmail = (payment: PaymentRecord) => {
  console.log('Sending receipt email for:', payment.id)
  successMessage.value = 'Receipt sent to your email'
  successSnackbar.value = true
}

const requestRefund = (payment: PaymentRecord) => {
  console.log('Requesting refund for:', payment.id)
  successMessage.value = 'Refund request submitted'
  successSnackbar.value = true
}

const disputePayment = (payment: PaymentRecord) => {
  console.log('Disputing payment:', payment.id)
  successMessage.value = 'Payment dispute initiated'
  successSnackbar.value = true
}

const copyTransactionId = (payment: PaymentRecord) => {
  navigator.clipboard.writeText(payment.transactionId)
  successMessage.value = 'Transaction ID copied to clipboard'
  successSnackbar.value = true
}

const exportPayments = () => {
  console.log('Exporting payment data:', filteredPayments.value)
  successMessage.value = 'Payment data exported successfully'
  successSnackbar.value = true
}

const downloadStatement = () => {
  console.log('Downloading payment statement')
  successMessage.value = 'Statement download started'
  successSnackbar.value = true
}

const payOverdue = () => {
  console.log('Processing overdue payments')
  successMessage.value = 'Redirecting to payment portal'
  successSnackbar.value = true
}

const processPayment = async () => {
  if (!paymentFormValid.value) return

  paymentProcessing.value = true

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create new payment record
    const newPayment: PaymentRecord = {
      id: Date.now().toString(),
      date: new Date(),
      description: getPaymentDescription(paymentForm.type),
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      status: 'pending',
      type: paymentForm.type as any,
      transactionId: `TXN_${Date.now()}`,
      notes: paymentForm.notes
    }

    paymentRecords.value.unshift(newPayment)

    // Reset form
    Object.assign(paymentForm, {
      type: '',
      amount: '',
      method: '',
      notes: ''
    })

    showMakePaymentDialog.value = false
    successMessage.value = 'Payment submitted successfully'
    successSnackbar.value = true

  } catch (error) {
    console.error('Payment processing error:', error)
  } finally {
    paymentProcessing.value = false
  }
}

const getPaymentDescription = (type: string): string => {
  const descriptions: { [key: string]: string } = {
    'membership': 'Membership Fee Payment',
    'lesson': 'Private Lesson Payment',
    'court_rental': 'Court Rental Payment',
    'equipment': 'Equipment Purchase',
    'other': 'Other Payment'
  }
  return descriptions[type] || 'Payment'
}

onMounted(() => {
  // Set default date range to last 6 months
  const today = new Date()
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(today.getMonth() - 6)

  filters.dateFrom = sixMonthsAgo.toISOString().split('T')[0]
  filters.dateTo = today.toISOString().split('T')[0]
})
</script>

<style scoped>
.payment-history {
  padding: 0;
}

/* Balance and Stats Cards */
.balance-card,
.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.balance-card:hover,
.stat-card:hover {
  transform: translateY(-2px);
}

/* Table Styling */
:deep(.v-data-table) {
  border-radius: 0;
}

.date-cell,
.description-cell,
.amount-cell {
  min-width: 120px;
}

/* Amount Display */
.amount-display {
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Mobile Cards */
.mobile-payments {
  padding-bottom: 16px;
}

.mobile-payments .v-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.mobile-payments .v-card:hover {
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Status and Method Colors */
.text-success {
  color: #4CAF50;
}

.text-warning {
  color: #FF9800;
}

.text-error {
  color: #F44336;
}

.text-info {
  color: #2196F3;
}

.text-primary {
  color: #2E7D32;
}

/* Gap utility */
.gap-2 > * {
  margin-right: 8px;
  margin-bottom: 8px;
}

.gap-2 > *:last-child {
  margin-right: 0;
}

/* Responsive Design */
@media (max-width: 960px) {
  .balance-card .text-h5,
  .stat-card .text-h6 {
    font-size: 1.25rem;
  }

  .gap-2 {
    flex-direction: column;
  }

  .gap-2 > * {
    margin-right: 0;
    margin-bottom: 8px;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .mobile-payments {
    margin: 0 8px;
  }

  .mobile-payments .v-card {
    margin: 0 0 12px 0;
  }

  .balance-card .text-h5,
  .stat-card .text-h6 {
    font-size: 1.125rem;
  }
}

/* Breakdown Table */
:deep(.v-table) {
  border-radius: 8px;
}

:deep(.v-table th) {
  background-color: #f5f5f5;
  font-weight: 600;
}

/* Dialog Styling */
:deep(.v-dialog .v-card) {
  border-radius: 12px;
}

/* List Styling in Dialog */
:deep(.v-list-item) {
  min-height: 40px;
}

:deep(.v-list-item-title) {
  font-weight: 500;
  color: #666;
  font-size: 0.875rem;
}

:deep(.v-list-item-subtitle) {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

/* Card Actions */
:deep(.v-card-actions) {
  padding: 16px 0 0 0;
}

/* Form Styling */
:deep(.v-text-field),
:deep(.v-select),
:deep(.v-textarea) {
  margin-bottom: 8px;
}

/* Alert Styling */
:deep(.v-alert) {
  border-radius: 8px;
}

/* Chip Styling */
:deep(.v-chip) {
  font-weight: 500;
}

:deep(.v-chip--size-small) {
  height: 24px;
  font-size: 0.75rem;
}

/* Loading States */
.v-data-table--loading {
  position: relative;
}

/* Print Styles */
@media print {
  .payment-history {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .mobile-payments {
    display: none;
  }

  :deep(.v-btn),
  .v-card-actions {
    display: none;
  }

  :deep(.v-data-table) {
    border: 1px solid #000;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
    background-color: #f0f0f0 !important;
    color: #000 !important;
  }

  .balance-card,
  .stat-card {
    border: 1px solid #000;
    background-color: #f9f9f9 !important;
  }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .amount-display {
    background: #2d2d2d;
  }

  :deep(.v-table th) {
    background-color: #2d2d2d;
    color: #fff;
  }

  :deep(.v-data-table tbody tr:hover) {
    background-color: #333;
  }

  .empty-state {
    color: #fff;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .balance-card,
  .stat-card,
  .mobile-payments .v-card {
    border: 2px solid #000;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
  }

  :deep(.v-data-table) {
    border: 1px solid #000;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .balance-card,
  .stat-card,
  .mobile-payments .v-card {
    transition: none;
  }

  .balance-card:hover,
  .stat-card:hover,
  .mobile-payments .v-card:hover {
    transform: none;
  }
}

/* Focus Styles */
:deep(.v-btn:focus),
:deep(.v-text-field:focus-within),
:deep(.v-select:focus-within) {
  outline: 2px solid #2E7D32;
  outline-offset: 2px;
}

/* Custom Scrollbar */
.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Transaction ID Styling */
.transaction-id {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #666;
}

/* Payment Status Indicators */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Amount Formatting */
.amount-large {
  font-size: 1.5rem;
  font-weight: 700;
}

.amount-medium {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Breakdown Section */
.breakdown-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

/* Notes Section */
.notes-section {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
}
</style>