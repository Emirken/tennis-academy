<template>
  <div class="price-management">
    <!-- Header Section -->
    <div class="management-header mb-6">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="text-h4 font-weight-bold text-white">
            <v-icon icon="mdi-currency-usd" class="mr-2" />
            Price Management
          </h2>
          <p class="text-body-1 text-white mt-2 opacity-90">
            Manage pricing for courts, lessons, and membership packages
          </p>
        </v-col>
        <v-col cols="12" md="6" class="text-md-right">
          <v-btn
              color="white"
              variant="flat"
              size="large"
              @click="showAddPriceDialog = true"
          >
            <v-icon icon="mdi-plus" class="mr-2" color="primary" />
            <span class="text-primary font-weight-bold">Add Price Package</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Revenue Statistics -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="success">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-trending-up</v-icon>
            <h3 class="text-h4 font-weight-bold">${{ stats.monthlyRevenue.toLocaleString() }}</h3>
            <p class="text-body-1">Monthly Revenue</p>
            <v-chip size="small" color="white" variant="flat" class="mt-2">
              <v-icon start size="16">mdi-trending-up</v-icon>
              +{{ stats.revenueGrowth }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="primary">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-currency-usd</v-icon>
            <h3 class="text-h4 font-weight-bold">${{ stats.averageSessionPrice }}</h3>
            <p class="text-body-1">Avg. Session Price</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="warning">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-star</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.premiumMembers }}</h3>
            <p class="text-body-1">Premium Members</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="info">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-calendar-multiple</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.activePackages }}</h3>
            <p class="text-body-1">Active Packages</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-lightning-bolt" class="mr-2" />
        Quick Actions
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="success"
                variant="flat"
                block
                size="large"
                @click="applyBulkDiscount"
            >
              <v-icon icon="mdi-sale" class="mr-2" />
              Apply Discount
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="warning"
                variant="flat"
                block
                size="large"
                @click="showSeasonalPricingDialog = true"
            >
              <v-icon icon="mdi-calendar-range" class="mr-2" />
              Seasonal Pricing
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="info"
                variant="flat"
                block
                size="large"
                @click="exportPricing"
            >
              <v-icon icon="mdi-download" class="mr-2" />
              Export Pricing
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="purple"
                variant="flat"
                block
                size="large"
                @click="showRevenueAnalytics = true"
            >
              <v-icon icon="mdi-chart-line" class="mr-2" />
              Revenue Analytics
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Price Categories -->
    <v-row>
      <v-col cols="12" md="4">
        <!-- Court Rental Pricing -->
        <v-card class="price-category-card mb-6" elevation="4">
          <v-card-title class="pa-6 bg-success text-white">
            <v-icon icon="mdi-tennis" class="mr-2" />
            Court Rental
          </v-card-title>
          <v-card-text class="pa-6">
            <div
                v-for="courtPrice in courtPricing"
                :key="courtPrice.id"
                class="price-item mb-4"
            >
              <v-card variant="outlined" class="pa-4">
                <div class="d-flex justify-space-between align-center mb-3">
                  <div>
                    <h4 class="text-h6 font-weight-bold">{{ courtPrice.name }}</h4>
                    <p class="text-caption text-grey">{{ courtPrice.description }}</p>
                  </div>
                  <v-chip
                      :color="courtPrice.active ? 'success' : 'grey'"
                      size="small"
                      variant="flat"
                  >
                    {{ courtPrice.active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>

                <div class="price-details mb-3">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-body-2">Hourly Rate:</span>
                    <span class="text-h6 font-weight-bold text-success">
                      ${{ courtPrice.hourlyRate }}
                    </span>
                  </div>

                  <div class="d-flex justify-space-between align-center mt-2">
                    <span class="text-body-2">Peak Hours:</span>
                    <span class="text-h6 font-weight-bold text-warning">
                      ${{ courtPrice.peakRate }}
                    </span>
                  </div>
                </div>

                <v-btn
                    variant="outlined"
                    size="small"
                    block
                    @click="editCourtPrice(courtPrice)"
                >
                  <v-icon icon="mdi-pencil" class="mr-1" />
                  Edit Pricing
                </v-btn>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Lesson Pricing -->
        <v-card class="price-category-card mb-6" elevation="4">
          <v-card-title class="pa-6 bg-primary text-white">
            <v-icon icon="mdi-school" class="mr-2" />
            Lesson Pricing
          </v-card-title>
          <v-card-text class="pa-6">
            <div
                v-for="lessonPrice in lessonPricing"
                :key="lessonPrice.id"
                class="price-item mb-4"
            >
              <v-card variant="outlined" class="pa-4">
                <div class="d-flex justify-space-between align-center mb-3">
                  <div>
                    <h4 class="text-h6 font-weight-bold">{{ lessonPrice.name }}</h4>
                    <p class="text-caption text-grey">{{ lessonPrice.description }}</p>
                  </div>
                  <v-chip
                      :color="lessonPrice.popular ? 'warning' : 'grey'"
                      size="small"
                      variant="flat"
                  >
                    {{ lessonPrice.popular ? 'Popular' : 'Standard' }}
                  </v-chip>
                </div>

                <div class="price-details mb-3">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-body-2">Per Hour:</span>
                    <span class="text-h6 font-weight-bold text-primary">
                      ${{ lessonPrice.hourlyRate }}
                    </span>
                  </div>

                  <div class="d-flex justify-space-between align-center mt-2">
                    <span class="text-body-2">Package (10 sessions):</span>
                    <span class="text-body-1 font-weight-bold">
                      ${{ lessonPrice.packageRate }}
                    </span>
                  </div>
                </div>

                <v-btn
                    variant="outlined"
                    size="small"
                    block
                    @click="editLessonPrice(lessonPrice)"
                >
                  <v-icon icon="mdi-pencil" class="mr-1" />
                  Edit Pricing
                </v-btn>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Membership Pricing -->
        <v-card class="price-category-card mb-6" elevation="4">
          <v-card-title class="pa-6 bg-warning text-white">
            <v-icon icon="mdi-card-membership" class="mr-2" />
            Membership Plans
          </v-card-title>
          <v-card-text class="pa-6">
            <div
                v-for="membership in membershipPricing"
                :key="membership.id"
                class="price-item mb-4"
            >
              <v-card
                  variant="outlined"
                  class="pa-4"
                  :class="{ 'border-warning': membership.recommended }"
              >
                <div class="d-flex justify-space-between align-center mb-3">
                  <div>
                    <h4 class="text-h6 font-weight-bold">{{ membership.name }}</h4>
                    <p class="text-caption text-grey">{{ membership.description }}</p>
                  </div>
                  <v-chip
                      :color="membership.recommended ? 'warning' : 'grey'"
                      size="small"
                      variant="flat"
                  >
                    {{ membership.recommended ? 'Recommended' : 'Standard' }}
                  </v-chip>
                </div>

                <div class="price-details mb-3">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-body-2">Monthly:</span>
                    <span class="text-h6 font-weight-bold text-warning">
                      ${{ membership.monthlyRate }}
                    </span>
                  </div>

                  <div class="d-flex justify-space-between align-center mt-2">
                    <span class="text-body-2">Annual:</span>
                    <span class="text-body-1 font-weight-bold">
                      ${{ membership.annualRate }}
                    </span>
                  </div>

                  <div class="d-flex justify-space-between align-center mt-2">
                    <span class="text-body-2">Members:</span>
                    <span class="text-body-2 font-weight-bold">
                      {{ membership.memberCount }}
                    </span>
                  </div>
                </div>

                <v-btn
                    variant="outlined"
                    size="small"
                    block
                    @click="editMembershipPrice(membership)"
                >
                  <v-icon icon="mdi-pencil" class="mr-1" />
                  Edit Plan
                </v-btn>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Price History -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-info text-white">
        <v-icon icon="mdi-history" class="mr-2" />
        Recent Price Changes
      </v-card-title>
      <v-card-text class="pa-0">
        <v-data-table
            :headers="historyHeaders"
            :items="priceHistory"
            :items-per-page="5"
            class="elevation-0"
        >
          <template #item.category="{ item }">
            <v-chip
                :color="getCategoryColor(item.category)"
                size="small"
                variant="flat"
            >
              {{ item.category }}
            </v-chip>
          </template>

          <template #item.changeType="{ item }">
            <v-chip
                :color="item.changeType === 'increase' ? 'error' : 'success'"
                size="small"
                variant="outlined"
            >
              <v-icon
                  :icon="item.changeType === 'increase' ? 'mdi-trending-up' : 'mdi-trending-down'"
                  class="mr-1"
              />
              {{ item.changeType }}
            </v-chip>
          </template>

          <template #item.oldPrice="{ item }">
            <span class="text-decoration-line-through text-grey">
              ${{ item.oldPrice }}
            </span>
          </template>

          <template #item.newPrice="{ item }">
            <span class="font-weight-bold text-primary">
              ${{ item.newPrice }}
            </span>
          </template>

          <template #item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add Price Package Dialog -->
    <v-dialog v-model="showAddPriceDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 pa-6">
          <v-icon icon="mdi-currency-usd" class="mr-2" />
          Add New Price Package
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="priceForm" v-model="formValid">
            <v-select
                v-model="newPrice.category"
                label="Category"
                :items="priceCategories"
                variant="outlined"
                :rules="categoryRules"
                class="mb-4"
                required
            />

            <v-text-field
                v-model="newPrice.name"
                label="Package Name"
                variant="outlined"
                :rules="nameRules"
                class="mb-4"
                required
            />

            <v-text-field
                v-model="newPrice.price"
                label="Price ($)"
                type="number"
                variant="outlined"
                :rules="priceRules"
                class="mb-4"
                required
            />

            <v-textarea
                v-model="newPrice.description"
                label="Description"
                variant="outlined"
                rows="3"
                class="mb-4"
            />

            <v-switch
                v-model="newPrice.active"
                label="Activate immediately"
                color="success"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showAddPriceDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!formValid"
              :loading="addingPrice"
              @click="addNewPrice"
          >
            Add Package
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, reactive } from 'vue'

// Data
const showAddPriceDialog = ref(false)
const showSeasonalPricingDialog = ref(false)
const showRevenueAnalytics = ref(false)
const addingPrice = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const formValid = ref(false)

// Stats
const stats = ref({
  monthlyRevenue: 28450,
  revenueGrowth: 15,
  averageSessionPrice: 45,
  premiumMembers: 67,
  activePackages: 12
})

// New price form
const newPrice = reactive({
  category: '',
  name: '',
  price: 0,
  description: '',
  active: true
})

// Categories
const priceCategories = [
  { title: 'Court Rental', value: 'court' },
  { title: 'Private Lesson', value: 'lesson' },
  { title: 'Membership Plan', value: 'membership' }
]

// Validation rules
const categoryRules = [
  (v: string) => !!v || 'Category is required'
]

const nameRules = [
  (v: string) => !!v || 'Package name is required',
  (v: string) => v.length >= 3 || 'Name must be at least 3 characters'
]

const priceRules = [
  (v: number) => !!v || 'Price is required',
  (v: number) => v > 0 || 'Price must be greater than 0'
]

// Court pricing data
const courtPricing = ref([
  {
    id: '1',
    name: 'Indoor Court',
    description: 'Climate-controlled indoor courts',
    hourlyRate: 25,
    peakRate: 35,
    active: true
  },
  {
    id: '2',
    name: 'Outdoor Court',
    description: 'Natural outdoor courts',
    hourlyRate: 20,
    peakRate: 25,
    active: true
  }
])

// Lesson pricing data
const lessonPricing = ref([
  {
    id: '1',
    name: 'Private Lesson',
    description: 'One-on-one coaching',
    hourlyRate: 60,
    packageRate: 550,
    popular: true
  },
  {
    id: '2',
    name: 'Group Lesson',
    description: 'Small group coaching (2-4 people)',
    hourlyRate: 40,
    packageRate: 360,
    popular: false
  },
  {
    id: '3',
    name: 'Tennis Clinic',
    description: 'Large group training sessions',
    hourlyRate: 25,
    packageRate: 220,
    popular: false
  }
])

// Membership pricing data
const membershipPricing = ref([
  {
    id: '1',
    name: 'Basic',
    description: 'Access to courts and basic facilities',
    monthlyRate: 99,
    annualRate: 990,
    memberCount: 45,
    recommended: false
  },
  {
    id: '2',
    name: 'Premium',
    description: 'Full access plus priority booking',
    monthlyRate: 199,
    annualRate: 1990,
    memberCount: 67,
    recommended: true
  },
  {
    id: '3',
    name: 'VIP',
    description: 'All premium features plus personal coaching',
    monthlyRate: 299,
    annualRate: 2990,
    memberCount: 23,
    recommended: false
  }
])

// Price history
const priceHistory = ref([
  {
    id: '1',
    category: 'Court Rental',
    item: 'Indoor Court',
    changeType: 'increase',
    oldPrice: 20,
    newPrice: 25,
    date: new Date('2025-05-15'),
    changedBy: 'Admin'
  },
  {
    id: '2',
    category: 'Membership',
    item: 'Premium Plan',
    changeType: 'increase',
    oldPrice: 179,
    newPrice: 199,
    date: new Date('2025-05-01'),
    changedBy: 'Admin'
  },
  {
    id: '3',
    category: 'Lesson',
    item: 'Group Lesson',
    changeType: 'decrease',
    oldPrice: 45,
    newPrice: 40,
    date: new Date('2025-04-20'),
    changedBy: 'Admin'
  }
])

// Table headers
const historyHeaders = [
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Item', key: 'item', sortable: true },
  { title: 'Change', key: 'changeType', sortable: true },
  { title: 'Old Price', key: 'oldPrice', sortable: true },
  { title: 'New Price', key: 'newPrice', sortable: true },
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Changed By', key: 'changedBy', sortable: true }
]

// Methods
const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Court Rental': 'success',
    'Lesson': 'primary',
    'Membership': 'warning'
  }
  return colors[category] || 'grey'
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const editCourtPrice = (court: any) => {
  console.log('Edit court price:', court)
}

const editLessonPrice = (lesson: any) => {
  console.log('Edit lesson price:', lesson)
}

const editMembershipPrice = (membership: any) => {
  console.log('Edit membership price:', membership)
}

const applyBulkDiscount = () => {
  console.log('Apply bulk discount')
  successMessage.value = 'Bulk discount applied successfully'
  successSnackbar.value = true
}

const exportPricing = () => {
  console.log('Export pricing data')
  successMessage.value = 'Pricing data exported successfully'
  successSnackbar.value = true
}

const addNewPrice = async () => {
  if (!formValid.value) return

  addingPrice.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Add to appropriate category
    console.log('New price package:', newPrice)

    // Reset form
    Object.assign(newPrice, {
      category: '',
      name: '',
      price: 0,
      description: '',
      active: true
    })

    showAddPriceDialog.value = false
    successMessage.value = 'New price package added successfully'
    successSnackbar.value = true

  } finally {
    addingPrice.value = false
  }
}
</script>

<style scoped>
.price-management {
  padding: 0;
}

.management-header {
  background: linear-gradient(135deg, #8BC34A 0%, #9CCC65 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.price-category-card {
  border-radius: 12px;
  height: fit-content;
}

.price-item {
  transition: all 0.3s ease;
}

.price-item:hover {
  transform: translateY(-2px);
}

.price-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.border-warning {
  border: 2px solid #FF9800 !important;
}

:deep(.v-data-table) {
  border-radius: 0;
}

@media (max-width: 600px) {
  .management-header {
    padding: 16px;
  }

  .stat-card .text-h4 {
    font-size: 1.5rem;
  }

  .price-category-card {
    margin-bottom: 16px;
  }
}
</style>