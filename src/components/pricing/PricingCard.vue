<template>
  <v-card
      class="pricing-card"
      :class="cardClass"
      elevation="8"
      :color="cardColor"
  >
    <!-- Popular Badge -->
    <div v-if="plan.popular" class="popular-badge">
      <v-chip
          color="secondary"
          variant="flat"
          size="small"
          class="popular-chip"
      >
        <v-icon icon="mdi-star" size="16" class="mr-1" />
        Most Popular
      </v-chip>
    </div>

    <!-- Header -->
    <v-card-text class="pa-8 text-center header-section">
      <v-icon
          :icon="plan.icon"
          :size="iconSize"
          :color="iconColor"
          class="mb-4"
      />

      <h3 class="text-h4 font-weight-bold mb-2" :class="titleClass">
        {{ plan.name }}
      </h3>

      <p class="text-body-1 mb-4" :class="subtitleClass">
        {{ plan.description }}
      </p>

      <!-- Price Display -->
      <div class="price-section mb-4">
        <div class="d-flex align-center justify-center mb-2">
          <span class="currency" :class="priceTextClass">$</span>
          <span class="price" :class="priceTextClass">{{ displayPrice }}</span>
          <span class="period" :class="periodTextClass">{{ displayPeriod }}</span>
        </div>

        <!-- Billing Toggle -->
        <div v-if="plan.billing" class="billing-toggle">
          <v-btn-toggle
              v-model="selectedBilling"
              color="primary"
              variant="outlined"
              divided
              density="compact"
              @update:model-value="updateBilling"
          >
            <v-btn value="monthly" size="small">
              Monthly
            </v-btn>
            <v-btn value="yearly" size="small">
              Yearly
              <v-chip
                  v-if="plan.billing.yearlyDiscount"
                  color="success"
                  size="x-small"
                  class="ml-1"
              >
                Save {{ plan.billing.yearlyDiscount }}%
              </v-chip>
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- Original Price (if discounted) -->
        <div v-if="showOriginalPrice" class="original-price mt-2">
          <span class="text-decoration-line-through text-grey">
            ${{ originalPrice }}{{ displayPeriod }}
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- Features List -->
    <v-card-text class="pa-8 pt-0 features-section">
      <v-list class="features-list bg-transparent">
        <v-list-item
            v-for="(feature, index) in plan.features"
            :key="index"
            class="feature-item px-0"
            :class="featureItemClass"
        >
          <template #prepend>
            <v-icon
                :icon="getFeatureIcon(feature)"
                :color="getFeatureIconColor(feature)"
                size="20"
                class="mr-3"
            />
          </template>

          <v-list-item-title
              class="feature-text"
              :class="featureTextClass"
          >
            {{ getFeatureText(feature) }}
          </v-list-item-title>

          <!-- Feature Tooltip -->
          <template v-if="feature.tooltip" #append>
            <v-tooltip :text="feature.tooltip" location="top">
              <template #activator="{ props }">
                <v-icon
                    icon="mdi-information-outline"
                    size="16"
                    color="grey"
                    v-bind="props"
                />
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Additional Info -->
    <v-card-text v-if="plan.additionalInfo" class="pa-8 pt-0">
      <v-alert
          :type="plan.additionalInfo.type || 'info'"
          variant="tonal"
          density="compact"
          class="text-body-2"
      >
        {{ plan.additionalInfo.text }}
      </v-alert>
    </v-card-text>

    <!-- Action Button -->
    <v-card-actions class="pa-8 pt-0">
      <v-btn
          :color="buttonColor"
          :variant="buttonVariant"
          :size="buttonSize"
          :loading="loading"
          :disabled="disabled || plan.disabled"
          block
          class="action-button font-weight-bold"
          @click="handleAction"
      >
        <v-icon v-if="buttonIcon" :icon="buttonIcon" class="mr-2" />
        {{ buttonText }}
      </v-btn>

      <!-- Secondary Action -->
      <v-btn
          v-if="plan.secondaryAction"
          variant="text"
          :color="secondaryButtonColor"
          size="small"
          block
          class="mt-2"
          @click="handleSecondaryAction"
      >
        {{ plan.secondaryAction.text }}
      </v-btn>
    </v-card-actions>

    <!-- Footer Info -->
    <v-card-text v-if="plan.footer" class="pa-8 pt-0 text-center">
      <p class="text-caption text-grey">
        {{ plan.footer }}
      </p>
    </v-card-text>

    <!-- Loading Overlay -->
    <v-overlay
        v-if="loading"
        :model-value="loading"
        contained
        class="align-center justify-center"
    >
      <v-progress-circular
          color="primary"
          indeterminate
          size="32"
      />
    </v-overlay>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Define interfaces
interface Feature {
  text: string
  included: boolean
  highlight?: boolean
  tooltip?: string
}

interface AdditionalInfo {
  type: 'info' | 'warning' | 'success' | 'error'
  text: string
}

interface SecondaryAction {
  text: string
  action: string
}

interface Billing {
  monthly: number
  yearly: number
  yearlyDiscount?: number
}

interface PricingPlan {
  id: string
  name: string
  description: string
  icon: string
  price: number
  period: 'month' | 'year' | 'hour' | 'session'
  popular?: boolean
  featured?: boolean
  disabled?: boolean
  features: Feature[]
  billing?: Billing
  additionalInfo?: AdditionalInfo
  secondaryAction?: SecondaryAction
  footer?: string
  color?: string
}

// Props
interface Props {
  plan: PricingPlan
  size?: 'small' | 'medium' | 'large'
  variant?: 'standard' | 'featured' | 'compact'
  loading?: boolean
  disabled?: boolean
  showBillingToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  variant: 'standard',
  loading: false,
  disabled: false,
  showBillingToggle: true
})

// Emits
const emit = defineEmits<{
  select: [plan: PricingPlan, billing?: string]
  secondary: [plan: PricingPlan, action: string]
  billingChange: [plan: PricingPlan, billing: string]
}>()

// Data
const selectedBilling = ref<'monthly' | 'yearly'>('monthly')

// Computed
const cardClass = computed(() => {
  const classes = [`pricing-card--${props.variant}`, `pricing-card--${props.size}`]

  if (props.plan.popular) classes.push('pricing-card--popular')
  if (props.plan.featured) classes.push('pricing-card--featured')
  if (props.disabled || props.plan.disabled) classes.push('pricing-card--disabled')

  return classes
})

const cardColor = computed(() => {
  if (props.plan.featured) return 'primary'
  if (props.plan.popular) return 'white'
  return 'white'
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'small': return 32
    case 'large': return 64
    default: return 48
  }
})

const iconColor = computed(() => {
  if (props.plan.featured) return 'white'
  return props.plan.color || 'primary'
})

const titleClass = computed(() => {
  if (props.plan.featured) return 'text-white'
  return 'text-primary'
})

const subtitleClass = computed(() => {
  if (props.plan.featured) return 'text-white opacity-90'
  return 'text-grey-darken-1'
})

const priceTextClass = computed(() => {
  if (props.plan.featured) return 'text-white'
  return 'text-primary'
})

const periodTextClass = computed(() => {
  if (props.plan.featured) return 'text-white opacity-75'
  return 'text-grey'
})

const featureItemClass = computed(() => {
  if (props.plan.featured) return 'text-white'
  return ''
})

const featureTextClass = computed(() => {
  if (props.plan.featured) return 'text-white'
  return ''
})

const displayPrice = computed(() => {
  if (props.plan.billing && selectedBilling.value === 'yearly') {
    return props.plan.billing.yearly
  }
  return props.plan.price
})

const displayPeriod = computed(() => {
  if (props.plan.billing) {
    return selectedBilling.value === 'yearly' ? '/year' : '/month'
  }

  switch (props.plan.period) {
    case 'month': return '/month'
    case 'year': return '/year'
    case 'hour': return '/hour'
    case 'session': return '/session'
    default: return ''
  }
})

const originalPrice = computed(() => {
  if (props.plan.billing && selectedBilling.value === 'yearly' && props.plan.billing.yearlyDiscount) {
    const monthlyTotal = props.plan.billing.monthly * 12
    return monthlyTotal
  }
  return null
})

const showOriginalPrice = computed(() => {
  return originalPrice.value && selectedBilling.value === 'yearly'
})

const buttonColor = computed(() => {
  if (props.plan.featured) return 'white'
  if (props.plan.popular) return 'primary'
  return 'primary'
})

const buttonVariant = computed(() => {
  if (props.plan.featured) return 'flat'
  if (props.plan.popular) return 'flat'
  return 'outlined'
})

const buttonSize = computed(() => {
  switch (props.size) {
    case 'small': return 'default'
    case 'large': return 'x-large'
    default: return 'large'
  }
})

const buttonText = computed(() => {
  if (props.plan.disabled) return 'Not Available'
  if (props.disabled) return 'Loading...'
  if (props.plan.popular) return 'Get Started'
  return 'Choose Plan'
})

const buttonIcon = computed(() => {
  if (props.plan.disabled) return 'mdi-lock'
  if (props.plan.popular) return 'mdi-rocket-launch'
  return 'mdi-arrow-right'
})

const secondaryButtonColor = computed(() => {
  if (props.plan.featured) return 'white'
  return 'primary'
})

// Methods
const getFeatureIcon = (feature: Feature): string => {
  if (!feature.included) return 'mdi-close'
  if (feature.highlight) return 'mdi-star'
  return 'mdi-check'
}

const getFeatureIconColor = (feature: Feature): string => {
  if (!feature.included) return 'error'
  if (feature.highlight) return 'warning'
  if (props.plan.featured) return 'white'
  return 'success'
}

const getFeatureText = (feature: Feature): string => {
  return feature.text
}

const updateBilling = (billing: 'monthly' | 'yearly') => {
  selectedBilling.value = billing
  emit('billingChange', props.plan, billing)
}

const handleAction = () => {
  if (props.disabled || props.plan.disabled) return
  emit('select', props.plan, selectedBilling.value)
}

const handleSecondaryAction = () => {
  if (props.plan.secondaryAction) {
    emit('secondary', props.plan, props.plan.secondaryAction.action)
  }
}
</script>

<style scoped>
.pricing-card {
  position: relative;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: visible;
}

.pricing-card:hover:not(.pricing-card--disabled) {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

/* Popular Badge */
.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.popular-chip {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Card Variants */
.pricing-card--featured {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
  color: white;
  border: 3px solid #4CAF50;
  transform: scale(1.05);
}

.pricing-card--featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.pricing-card--popular {
  border: 2px solid #FF9800;
  box-shadow: 0 8px 32px rgba(255, 152, 0, 0.2);
}

.pricing-card--disabled {
  opacity: 0.6;
  filter: grayscale(50%);
  cursor: not-allowed;
}

.pricing-card--disabled:hover {
  transform: none;
  box-shadow: inherit !important;
}

/* Size Variants */
.pricing-card--small {
  max-width: 280px;
}

.pricing-card--small .header-section {
  padding: 24px !important;
}

.pricing-card--small .features-section {
  padding: 16px 24px !important;
}

.pricing-card--large {
  max-width: 400px;
}

/* Header Section */
.header-section {
  background: transparent;
}

.pricing-card--featured .header-section {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  backdrop-filter: blur(10px);
}

/* Price Section */
.price-section {
  position: relative;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  vertical-align: top;
  margin-right: 4px;
}

.price {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
}

.period {
  font-size: 1.125rem;
  font-weight: 500;
  vertical-align: bottom;
  margin-left: 4px;
}

.pricing-card--small .price {
  font-size: 2.5rem;
}

.pricing-card--large .price {
  font-size: 4rem;
}

.billing-toggle {
  margin-top: 16px;
}

.original-price {
  font-size: 0.875rem;
}

/* Features Section */
.features-list {
  padding: 0;
}

.feature-item {
  padding: 8px 0;
  min-height: auto;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.pricing-card--featured .feature-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-text {
  font-size: 0.95rem;
  line-height: 1.4;
}

.feature-item:not(.feature-item--included) .feature-text {
  opacity: 0.6;
  text-decoration: line-through;
}

/* Action Button */
.action-button {
  height: 48px;
  border-radius: 12px;
  text-transform: none;
  font-size: 1rem;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pricing-card--featured .action-button {
  color: #2E7D32 !important;
  background-color: white !important;
}

.pricing-card--featured .action-button:hover {
  background-color: #f5f5f5 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 960px) {
  .pricing-card--featured {
    transform: none;
  }

  .pricing-card--featured:hover {
    transform: translateY(-4px);
  }

  .pricing-card:hover:not(.pricing-card--disabled) {
    transform: translateY(-4px);
  }
}

@media (max-width: 600px) {
  .pricing-card {
    margin-bottom: 24px;
  }

  .header-section,
  .features-section {
    padding: 24px !important;
  }

  .price {
    font-size: 2.5rem;
  }

  .popular-badge {
    top: -8px;
  }

  .billing-toggle {
    margin-top: 12px;
  }

  .action-button {
    height: 44px;
    font-size: 0.9rem;
  }
}

/* Animation for features */
.feature-item {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.feature-item:nth-child(1) { animation-delay: 0.1s; }
.feature-item:nth-child(2) { animation-delay: 0.2s; }
.feature-item:nth-child(3) { animation-delay: 0.3s; }
.feature-item:nth-child(4) { animation-delay: 0.4s; }
.feature-item:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .pricing-card:not(.pricing-card--featured) {
    background-color: #1e1e1e;
    border-color: #333;
  }

  .feature-item {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .pricing-card {
    border: 2px solid #000;
  }

  .pricing-card--featured {
    border: 3px solid #fff;
  }

  .feature-item {
    border-bottom: 1px solid #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pricing-card,
  .action-button,
  .feature-item {
    transition: none;
    animation: none;
  }

  .pricing-card:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .pricing-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #000;
  }

  .popular-badge {
    position: static;
    transform: none;
    margin-bottom: 16px;
  }

  .action-button {
    display: none;
  }
}
</style>