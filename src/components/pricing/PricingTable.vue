<template>
  <div class="pricing-table">
    <!-- Header Controls -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-table-edit" class="mr-2" />
        Pricing Comparison Table
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="4">
            <v-select
                v-model="selectedCategory"
                label="Category"
                :items="categories"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-filter"
                @update:model-value="filterByCategory"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-btn-toggle
                v-model="billingPeriod"
                color="primary"
                variant="outlined"
                mandatory
                @update:model-value="updateBilling"
            >
              <v-btn value="monthly">Monthly</v-btn>
              <v-btn value="yearly">
                Yearly
                <v-chip color="success" size="x-small" class="ml-1">
                  Save 20%
                </v-chip>
              </v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-end">
            <v-btn
                color="success"
                variant="flat"
                prepend-icon="mdi-download"
                @click="exportTable"
            >
              Export Table
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Responsive Table Container -->
    <v-card elevation="4">
      <div class="table-container">
        <div class="pricing-grid" :class="gridClass">
          <!-- Header Row -->
          <div class="grid-header">
            <!-- Features Column Header -->
            <div class="features-header">
              <h3 class="text-h6 font-weight-bold">Features</h3>
              <p class="text-caption text-grey">Compare all plans</p>
            </div>

            <!-- Plan Headers -->
            <div
                v-for="plan in filteredPlans"
                :key="plan.id"
                class="plan-header"
                :class="getPlanHeaderClass(plan)"
            >
              <!-- Popular Badge -->
              <div v-if="plan.popular" class="popular-badge-table">
                <v-chip color="secondary" size="x-small" variant="flat">
                  Most Popular
                </v-chip>
              </div>

              <!-- Plan Icon and Name -->
              <div class="plan-info">
                <v-icon
                    :icon="plan.icon"
                    :color="plan.featured ? 'white' : 'primary'"
                    size="32"
                    class="mb-2"
                />
                <h4 class="plan-name" :class="getPlanNameClass(plan)">
                  {{ plan.name }}
                </h4>
                <p class="plan-description" :class="getPlanDescClass(plan)">
                  {{ plan.description }}
                </p>
              </div>

              <!-- Price -->
              <div class="plan-price mb-3">
                <div class="price-display">
                  <span class="currency" :class="getPriceClass(plan)">$</span>
                  <span class="amount" :class="getPriceClass(plan)">
                    {{ getPlanPrice(plan) }}
                  </span>
                  <span class="period" :class="getPeriodClass(plan)">
                    {{ getPlanPeriod(plan) }}
                  </span>
                </div>
                <div v-if="showOriginalPrice(plan)" class="original-price">
                  <span class="text-decoration-line-through text-grey text-caption">
                    ${{ getOriginalPrice(plan) }}{{ getPlanPeriod(plan) }}
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <v-btn
                  :color="getButtonColor(plan)"
                  :variant="getButtonVariant(plan)"
                  size="small"
                  block
                  class="plan-action-btn"
                  @click="selectPlan(plan)"
              >
                <v-icon :icon="getButtonIcon(plan)" class="mr-1" />
                {{ getButtonText(plan) }}
              </v-btn>
            </div>
          </div>

          <!-- Feature Rows -->
          <div
              v-for="(category, categoryIndex) in featureCategories"
              :key="category.name"
              class="feature-category"
          >
            <!-- Category Header -->
            <div class="category-header">
              <div class="category-title">
                <v-icon :icon="category.icon" class="mr-2" />
                <span class="font-weight-bold">{{ category.name }}</span>
              </div>
              <div class="category-spacer"></div>
            </div>

            <!-- Feature Rows in Category -->
            <div
                v-for="(feature, featureIndex) in category.features"
                :key="feature.name"
                class="feature-row"
                :class="{ 'feature-row--highlight': feature.highlight }"
            >
              <!-- Feature Name -->
              <div class="feature-name">
                <div class="feature-content">
                  <span class="feature-text">{{ feature.name }}</span>
                  <v-tooltip v-if="feature.tooltip" :text="feature.tooltip" location="top">
                    <template #activator="{ props }">
                      <v-icon
                          icon="mdi-help-circle-outline"
                          size="16"
                          color="grey"
                          class="ml-2"
                          v-bind="props"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </div>

              <!-- Feature Values for Each Plan -->
              <div
                  v-for="plan in filteredPlans"
                  :key="`${feature.name}-${plan.id}`"
                  class="feature-value"
                  :class="getFeatureValueClass(plan)"
              >
                <div class="value-content">
                  <component
                      :is="getFeatureComponent(feature, plan)"
                      v-bind="getFeatureProps(feature, plan)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Row -->
          <div class="grid-footer">
            <div class="footer-spacer"></div>

            <div
                v-for="plan in filteredPlans"
                :key="`footer-${plan.id}`"
                class="footer-action"
                :class="getFooterClass(plan)"
            >
              <v-btn
                  :color="getButtonColor(plan)"
                  :variant="getButtonVariant(plan)"
                  size="large"
                  block
                  class="footer-btn font-weight-bold"
                  @click="selectPlan(plan)"
              >
                {{ getButtonText(plan) }}
              </v-btn>

              <div v-if="plan.footer" class="footer-text mt-2">
                <p class="text-caption text-center text-grey">
                  {{ plan.footer }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Mobile View -->
    <div class="mobile-pricing d-md-none mt-6">
      <v-card
          v-for="plan in filteredPlans"
          :key="`mobile-${plan.id}`"
          class="mb-4"
          :color="plan.featured ? 'primary' : 'white'"
          elevation="4"
      >
        <v-card-title class="pa-6" :class="plan.featured ? 'text-white' : ''">
          <div class="d-flex align-center">
            <v-icon
                :icon="plan.icon"
                :color="plan.featured ? 'white' : 'primary'"
                size="32"
                class="mr-3"
            />
            <div>
              <h3 class="text-h5 font-weight-bold">{{ plan.name }}</h3>
              <p class="text-body-2 mb-0" :class="plan.featured ? 'text-white opacity-90' : 'text-grey'">
                {{ plan.description }}
              </p>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-6" :class="plan.featured ? 'text-white' : ''">
          <!-- Price -->
          <div class="text-center mb-4">
            <div class="price-display">
              <span class="currency">$</span>
              <span class="amount">{{ getPlanPrice(plan) }}</span>
              <span class="period">{{ getPlanPeriod(plan) }}</span>
            </div>
          </div>

          <!-- Features -->
          <v-list class="bg-transparent" :class="plan.featured ? 'text-white' : ''">
            <v-list-item
                v-for="category in featureCategories"
                :key="category.name"
            >
              <v-list-item-title class="font-weight-bold mb-2">
                <v-icon :icon="category.icon" class="mr-2" />
                {{ category.name }}
              </v-list-item-title>

              <div class="ml-8">
                <div
                    v-for="feature in category.features"
                    :key="feature.name"
                    class="feature-mobile-item d-flex justify-space-between align-center mb-1"
                >
                  <span class="text-body-2">{{ feature.name }}</span>
                  <component
                      :is="getFeatureComponent(feature, plan)"
                      v-bind="getFeatureProps(feature, plan)"
                      size="small"
                  />
                </div>
              </div>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-btn
              :color="getButtonColor(plan)"
              :variant="getButtonVariant(plan)"
              size="large"
              block
              @click="selectPlan(plan)"
          >
            {{ getButtonText(plan) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

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
import { ref, computed, h } from 'vue'
import { VIcon, VChip } from 'vuetify/components'

// Define interfaces
interface PricingPlan {
  id: string
  name: string
  description: string
  icon: string
  price: number
  yearlyPrice?: number
  period: string
  popular?: boolean
  featured?: boolean
  disabled?: boolean
  category: string
  footer?: string
}

interface Feature {
  name: string
  key: string
  type: 'boolean' | 'text' | 'number' | 'limit'
  tooltip?: string
  highlight?: boolean
}

interface FeatureCategory {
  name: string
  icon: string
  features: Feature[]
}

// Props
interface Props {
  plans?: PricingPlan[]
  features?: FeatureCategory[]
  defaultBilling?: 'monthly' | 'yearly'
  showMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  plans: () => [],
  features: () => [],
  defaultBilling: 'monthly',
  showMobile: true
})

// Emits
const emit = defineEmits<{
  select: [plan: PricingPlan, billing: string]
  export: [data: any]
}>()

// Data
const selectedCategory = ref('all')
const billingPeriod = ref(props.defaultBilling)
const successSnackbar = ref(false)
const successMessage = ref('')

// Categories
const categories = [
  { title: 'All Categories', value: 'all' },
  { title: 'Membership Plans', value: 'membership' },
  { title: 'Court Rental', value: 'court' },
  { title: 'Lessons', value: 'lessons' },
  { title: 'Training Programs', value: 'training' }
]

// Mock data if not provided
const defaultPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for beginners',
    icon: 'mdi-account',
    price: 99,
    yearlyPrice: 990,
    period: '/month',
    category: 'membership'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Most popular choice',
    icon: 'mdi-star',
    price: 199,
    yearlyPrice: 1990,
    period: '/month',
    popular: true,
    category: 'membership'
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Ultimate experience',
    icon: 'mdi-crown',
    price: 299,
    yearlyPrice: 2990,
    period: '/month',
    featured: true,
    category: 'membership'
  }
]

const defaultFeatures: FeatureCategory[] = [
  {
    name: 'Court Access',
    icon: 'mdi-tennis',
    features: [
      { name: 'Indoor Courts', key: 'indoorCourts', type: 'boolean' },
      { name: 'Outdoor Courts', key: 'outdoorCourts', type: 'boolean' },
      { name: 'Peak Hours Access', key: 'peakHours', type: 'boolean' },
      { name: 'Monthly Court Hours', key: 'courtHours', type: 'limit', tooltip: 'Included court hours per month' }
    ]
  },
  {
    name: 'Training & Lessons',
    icon: 'mdi-school',
    features: [
      { name: 'Group Lessons', key: 'groupLessons', type: 'boolean' },
      { name: 'Private Lessons', key: 'privateLessons', type: 'limit' },
      { name: 'Professional Coaching', key: 'coaching', type: 'boolean' },
      { name: 'Video Analysis', key: 'videoAnalysis', type: 'boolean' }
    ]
  },
  {
    name: 'Facilities & Services',
    icon: 'mdi-dumbbell',
    features: [
      { name: 'Locker Room', key: 'lockerRoom', type: 'boolean' },
      { name: 'Equipment Rental', key: 'equipmentRental', type: 'boolean' },
      { name: 'Guest Passes', key: 'guestPasses', type: 'number' },
      { name: 'Priority Booking', key: 'priorityBooking', type: 'boolean', highlight: true }
    ]
  }
]

// Mock plan features data
const planFeatures: Record<string, Record<string, any>> = {
  basic: {
    indoorCourts: false,
    outdoorCourts: true,
    peakHours: false,
    courtHours: 10,
    groupLessons: true,
    privateLessons: 0,
    coaching: false,
    videoAnalysis: false,
    lockerRoom: true,
    equipmentRental: false,
    guestPasses: 2,
    priorityBooking: false
  },
  premium: {
    indoorCourts: true,
    outdoorCourts: true,
    peakHours: true,
    courtHours: 25,
    groupLessons: true,
    privateLessons: 2,
    coaching: true,
    videoAnalysis: false,
    lockerRoom: true,
    equipmentRental: true,
    guestPasses: 5,
    priorityBooking: true
  },
  vip: {
    indoorCourts: true,
    outdoorCourts: true,
    peakHours: true,
    courtHours: 'Unlimited',
    groupLessons: true,
    privateLessons: 'Unlimited',
    coaching: true,
    videoAnalysis: true,
    lockerRoom: true,
    equipmentRental: true,
    guestPasses: 10,
    priorityBooking: true
  }
}

// Computed
const filteredPlans = computed(() => {
  const plans = props.plans.length > 0 ? props.plans : defaultPlans

  if (selectedCategory.value === 'all') {
    return plans
  }

  return plans.filter(plan => plan.category === selectedCategory.value)
})

const featureCategories = computed(() => {
  return props.features.length > 0 ? props.features : defaultFeatures
})

const gridClass = computed(() => {
  const planCount = filteredPlans.value.length
  return `grid-${planCount}-plans`
})

// Methods
const getPlanHeaderClass = (plan: PricingPlan) => {
  const classes = []
  if (plan.popular) classes.push('plan-header--popular')
  if (plan.featured) classes.push('plan-header--featured')
  return classes
}

const getPlanNameClass = (plan: PricingPlan) => {
  return plan.featured ? 'text-white' : 'text-primary'
}

const getPlanDescClass = (plan: PricingPlan) => {
  return plan.featured ? 'text-white opacity-90' : 'text-grey'
}

const getPriceClass = (plan: PricingPlan) => {
  return plan.featured ? 'text-white' : 'text-primary'
}

const getPeriodClass = (plan: PricingPlan) => {
  return plan.featured ? 'text-white opacity-75' : 'text-grey'
}

const getFeatureValueClass = (plan: PricingPlan) => {
  return plan.featured ? 'feature-value--featured' : ''
}

const getFooterClass = (plan: PricingPlan) => {
  return plan.featured ? 'footer-action--featured' : ''
}

const getButtonColor = (plan: PricingPlan) => {
  if (plan.featured) return 'white'
  if (plan.popular) return 'primary'
  return 'primary'
}

const getButtonVariant = (plan: PricingPlan) => {
  if (plan.featured) return 'flat'
  if (plan.popular) return 'flat'
  return 'outlined'
}

const getButtonText = (plan: PricingPlan) => {
  if (plan.disabled) return 'Not Available'
  if (plan.popular) return 'Get Started'
  return 'Choose Plan'
}

const getButtonIcon = (plan: PricingPlan) => {
  if (plan.disabled) return 'mdi-lock'
  if (plan.popular) return 'mdi-rocket-launch'
  return 'mdi-arrow-right'
}

const getPlanPrice = (plan: PricingPlan) => {
  if (billingPeriod.value === 'yearly' && plan.yearlyPrice) {
    return Math.round(plan.yearlyPrice / 12)
  }
  return plan.price
}

const getPlanPeriod = (plan: PricingPlan) => {
  if (billingPeriod.value === 'yearly') {
    return '/month (billed yearly)'
  }
  return plan.period
}

const showOriginalPrice = (plan: PricingPlan) => {
  return billingPeriod.value === 'yearly' && plan.yearlyPrice && plan.yearlyPrice < plan.price * 12
}

const getOriginalPrice = (plan: PricingPlan) => {
  return plan.price
}

const getFeatureComponent = (feature: Feature, plan: PricingPlan) => {
  const value = planFeatures[plan.id]?.[feature.key]

  switch (feature.type) {
    case 'boolean':
      return VIcon
    case 'text':
    case 'number':
    case 'limit':
      return 'span'
    default:
      return 'span'
  }
}

const getFeatureProps = (feature: Feature, plan: PricingPlan) => {
  const value = planFeatures[plan.id]?.[feature.key]

  switch (feature.type) {
    case 'boolean':
      return {
        icon: value ? 'mdi-check' : 'mdi-close',
        color: value ? 'success' : 'error',
        size: '20'
      }
    case 'text':
      return {
        class: plan.featured ? 'text-white' : 'text-body-2'
      }
    case 'number':
    case 'limit':
      return {
        class: `font-weight-bold ${plan.featured ? 'text-white' : 'text-primary'}`
      }
    default:
      return {}
  }
}

const getFeatureValue = (feature: Feature, plan: PricingPlan) => {
  const value = planFeatures[plan.id]?.[feature.key]

  if (feature.type === 'boolean') {
    return ''
  }

  return value || '-'
}

const filterByCategory = () => {
  // Filter logic is handled by computed property
}

const updateBilling = () => {
  // Billing period updated reactively
}

const selectPlan = (plan: PricingPlan) => {
  emit('select', plan, billingPeriod.value)
  successMessage.value = `Selected ${plan.name} plan`
  successSnackbar.value = true
}

const exportTable = () => {
  const exportData = {
    plans: filteredPlans.value,
    features: featureCategories.value,
    billing: billingPeriod.value,
    category: selectedCategory.value
  }

  emit('export', exportData)
  successMessage.value = 'Table exported successfully'
  successSnackbar.value = true
}
</script>

<style scoped>
.pricing-table {
  width: 100%;
}

/* Table Container */
.table-container {
  overflow-x: auto;
  min-height: 600px;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  gap: 0;
  min-width: 800px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.grid-1-plans { grid-template-columns: 300px 1fr; }
.grid-2-plans { grid-template-columns: 300px repeat(2, 1fr); }
.grid-3-plans { grid-template-columns: 300px repeat(3, 1fr); }
.grid-4-plans { grid-template-columns: 300px repeat(4, 1fr); }

/* Header */
.grid-header {
  display: contents;
}

.features-header {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.plan-header {
  position: relative;
  padding: 24px 16px;
  text-align: center;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.plan-header:last-child {
  border-right: none;
}

.plan-header--popular {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 2px solid #ff9800;
  border-bottom: 1px solid #e0e0e0;
}

.plan-header--featured {
  background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
  color: white;
}

.popular-badge-table {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
}

.plan-info {
  margin-bottom: 16px;
}

.plan-name {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.plan-description {
  font-size: 0.875rem;
  margin-bottom: 0;
}

/* Price Display */
.price-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 8px;
}

.currency {
  font-size: 1.25rem;
  font-weight: 600;
  margin-right: 4px;
}

.amount {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1;
}

.period {
  font-size: 0.875rem;
  margin-left: 4px;
}

.original-price {
  text-align: center;
}

/* Feature Categories */
.feature-category {
  display: contents;
}

.category-header {
  display: contents;
}

.category-title {
  background: #f8f9fa;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  font-size: 1.1rem;
  color: #2e7d32;
}

.category-spacer {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  grid-column: 2 / -1;
}

/* Feature Rows */
.feature-row {
  display: contents;
}

.feature-row--highlight .feature-name {
  background: #fff3e0;
}

.feature-name {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.feature-content {
  display: flex;
  align-items: center;
}

.feature-text {
  font-size: 0.95rem;
  line-height: 1.4;
}

.feature-value {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #e0e0e0;
  background: white;
  text-align: center;
}

.feature-value:last-child {
  border-right: none;
}

.feature-value--featured {
  background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
  color: white;
}

.value-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
}

/* Footer */
.grid-footer {
  display: contents;
}

.footer-spacer {
  background: #f8f9fa;
  padding: 24px;
  border-right: 1px solid #e0e0e0;
}

.footer-action {
  padding: 24px 16px;
  background: white;
  border-right: 1px solid #e0e0e0;
}

.footer-action:last-child {
  border-right: none;
}

.footer-action--featured {
  background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
}

.footer-btn {
  border-radius: 8px;
  height: 48px;
}

.footer-text {
  color: #666;
}

/* Action Buttons */
.plan-action-btn {
  border-radius: 6px;
  height: 36px;
  font-weight: 600;
}

/* Mobile View */
.mobile-pricing {
  display: none;
}

.feature-mobile-item {
  padding: 4px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.feature-mobile-item:last-child {
  border-bottom: none;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .pricing-grid {
    min-width: 700px;
  }

  .grid-1-plans { grid-template-columns: 250px 1fr; }
  .grid-2-plans { grid-template-columns: 250px repeat(2, 1fr); }
  .grid-3-plans { grid-template-columns: 250px repeat(3, 1fr); }
  .grid-4-plans { grid-template-columns: 250px repeat(4, 1fr); }
}

@media (max-width: 960px) {
  .table-container {
    display: none;
  }

  .mobile-pricing {
    display: block !important;
  }
}

@media (max-width: 600px) {
  .mobile-pricing .price-display .amount {
    font-size: 2rem;
  }

  .mobile-pricing .currency {
    font-size: 1rem;
  }

  .mobile-pricing .period {
    font-size: 0.75rem;
  }
}

/* Hover Effects */
.plan-header:hover:not(.plan-header--featured) {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.feature-row:hover .feature-name {
  background: #f0f7ff;
}

.feature-row:hover .feature-value:not(.feature-value--featured) {
  background: #f0f7ff;
}

/* Animations */
.plan-header,
.feature-value {
  transition: all 0.3s ease;
}

/* Print Styles */
@media print {
  .pricing-table {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .mobile-pricing {
    display: none !important;
  }

  .table-container {
    display: block !important;
    overflow: visible;
  }

  .pricing-grid {
    min-width: auto;
    page-break-inside: avoid;
  }

  .plan-action-btn,
  .footer-btn {
    display: none;
  }

  .plan-header--featured {
    background: #f0f0f0 !important;
    color: #000 !important;
    border: 2px solid #000;
  }

  .feature-value--featured {
    background: #f0f0f0 !important;
    color: #000 !important;
  }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .features-header,
  .category-title,
  .footer-spacer {
    background: #2d2d2d;
    color: white;
  }

  .plan-header:not(.plan-header--featured) {
    background: #1e1e1e;
    color: white;
  }

  .feature-name,
  .feature-value:not(.feature-value--featured),
  .footer-action:not(.footer-action--featured) {
    background: #1e1e1e;
    color: white;
  }

  .pricing-grid {
    border-color: #444;
  }

  .feature-name,
  .feature-value,
  .category-title,
  .features-header {
    border-color: #444;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .pricing-grid,
  .plan-header,
  .feature-name,
  .feature-value {
    border: 2px solid #000;
  }

  .plan-header--popular {
    border: 3px solid #ff9800;
  }

  .plan-header--featured {
    border: 3px solid #fff;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .plan-header,
  .feature-value {
    transition: none;
  }

  .plan-header:hover {
    transform: none;
  }
}

/* Loading States */
.pricing-grid--loading {
  opacity: 0.6;
  pointer-events: none;
}

.pricing-grid--loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2e7d32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Accessibility Improvements */
.plan-header:focus-within,
.feature-value:focus-within {
  outline: 2px solid #2e7d32;
  outline-offset: 2px;
}

.feature-text {
  word-wrap: break-word;
  hyphens: auto;
}

/* Feature Value Specific Styles */
.feature-value span {
  font-size: 0.9rem;
}

.feature-value .font-weight-bold {
  font-size: 1rem;
}

/* Chip Styling in Table */
.feature-value .v-chip {
  font-size: 0.75rem;
  height: 20px;
}

/* Icon Adjustments */
.feature-value .v-icon {
  margin: 0;
}

/* Mobile Card Enhancements */
.mobile-pricing .v-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.mobile-pricing .v-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

/* Price Display Mobile */
.mobile-pricing .price-display {
  margin-bottom: 24px;
}

.mobile-pricing .price-display .currency {
  color: inherit;
}

.mobile-pricing .price-display .amount {
  color: inherit;
  font-weight: 900;
}

.mobile-pricing .price-display .period {
  color: inherit;
  opacity: 0.7;
}

/* Feature Mobile List */
.mobile-pricing .v-list {
  padding: 0;
}

.mobile-pricing .v-list-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.mobile-pricing .v-list-item:last-child {
  border-bottom: none;
}

/* Sticky Header for Large Tables */
@media (min-width: 961px) {
  .table-container {
    max-height: 80vh;
    overflow-y: auto;
  }

  .grid-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
}

/* Grid Alignment */
.pricing-grid > * {
  align-self: stretch;
}

/* Feature Category Spacing */
.category-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Value Content Alignment */
.value-content {
  word-break: break-word;
  line-height: 1.2;
}

/* Enhanced Popular Badge */
.popular-badge-table .v-chip {
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.05);
  }
}

/* Tooltip Adjustments */
.feature-content .v-icon {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.feature-content .v-icon:hover {
  opacity: 1;
}
</style>