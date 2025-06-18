<template>
  <div class="reservation-form">
    <!-- Header Section -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-calendar-plus" class="mr-2" />
        Make a Reservation
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="8">
            <p class="text-body-1 mb-0">
              Reserve your preferred court and time slot. Choose from our indoor and outdoor courts.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-md-right">
            <v-chip color="success" variant="flat" prepend-icon="mdi-check-circle">
              {{ availableSlots }} slots available today
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Reservation Stepper -->
    <v-card elevation="4">
      <v-stepper
          v-model="currentStep"
          :items="steps"
          class="reservation-stepper"
      >
        <!-- Step 1: Select Court & Date -->
        <template #item.1>
          <div class="step-content pa-6">
            <h3 class="text-h5 mb-4 text-primary">
              <v-icon icon="mdi-tennis" class="mr-2" />
              Select Court & Date
            </h3>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="reservation.date"
                    label="Preferred Date"
                    type="date"
                    variant="outlined"
                    :min="minDate"
                    :max="maxDate"
                    :rules="dateRules"
                    required
                    @update:model-value="onDateChange"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                    v-model="reservation.courtType"
                    label="Court Type Preference"
                    :items="courtTypeOptions"
                    variant="outlined"
                    @update:model-value="onCourtTypeChange"
                />
              </v-col>
            </v-row>

            <!-- Available Courts Display -->
            <div class="available-courts mt-6">
              <h4 class="text-h6 mb-4">Available Courts</h4>
              <v-row>
                <v-col
                    v-for="court in availableCourts"
                    :key="court.id"
                    cols="12"
                    sm="6"
                    md="4"
                >
                  <v-card
                      class="court-card"
                      :class="{ 'selected': reservation.courtId === court.id }"
                      :color="reservation.courtId === court.id ? 'primary' : 'white'"
                      :variant="reservation.courtId === court.id ? 'flat' : 'outlined'"
                      @click="selectCourt(court)"
                  >
                    <v-card-text class="text-center pa-4">
                      <v-icon
                          :icon="getCourtIcon(court.type)"
                          :color="reservation.courtId === court.id ? 'white' : 'primary'"
                          size="32"
                          class="mb-2"
                      />
                      <h4
                          class="text-h6 font-weight-bold"
                          :class="reservation.courtId === court.id ? 'text-white' : 'text-primary'"
                      >
                        {{ court.name }}
                      </h4>
                      <p
                          class="text-body-2 mb-2"
                          :class="reservation.courtId === court.id ? 'text-white opacity-90' : 'text-grey'"
                      >
                        {{ court.type === 'indoor' ? 'Indoor Court' : 'Outdoor Court' }}
                      </p>
                      <v-chip
                          :color="reservation.courtId === court.id ? 'white' : 'success'"
                          :variant="reservation.courtId === court.id ? 'flat' : 'tonal'"
                          size="small"
                      >
                        ${{ court.hourlyRate }}/hour
                      </v-chip>
                    </v-card-text>

                    <!-- Court Features -->
                    <v-card-text v-if="court.features" class="pt-0">
                      <div class="d-flex flex-wrap gap-1 justify-center">
                        <v-chip
                            v-for="feature in court.features"
                            :key="feature"
                            size="x-small"
                            :color="reservation.courtId === court.id ? 'white' : 'grey'"
                            :variant="reservation.courtId === court.id ? 'outlined' : 'tonal'"
                        >
                          {{ feature }}
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>
        </template>

        <!-- Step 2: Select Time -->
        <template #item.2>
          <div class="step-content pa-6">
            <h3 class="text-h5 mb-4 text-primary">
              <v-icon icon="mdi-clock-outline" class="mr-2" />
              Select Time & Duration
            </h3>

            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select
                    v-model="reservation.startTime"
                    label="Start Time"
                    :items="availableTimeSlots"
                    variant="outlined"
                    :rules="timeRules"
                    required
                    @update:model-value="onTimeChange"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                    v-model="reservation.duration"
                    label="Duration"
                    :items="durationOptions"
                    variant="outlined"
                    :rules="durationRules"
                    required
                    @update:model-value="calculateEndTime"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                    v-model="reservation.endTime"
                    label="End Time"
                    variant="outlined"
                    readonly
                    append-inner-icon="mdi-clock-end"
                />
              </v-col>
            </v-row>

            <!-- Time Slot Calendar -->
            <div class="time-slots-grid">
              <h4 class="text-h6 mb-3">Available Time Slots</h4>
              <div class="slots-container">
                <div
                    v-for="slot in timeSlots"
                    :key="slot.time"
                    class="time-slot"
                    :class="getTimeSlotClass(slot)"
                    @click="selectTimeSlot(slot)"
                >
                  <div class="slot-time">{{ slot.time }}</div>
                  <div class="slot-status">{{ getSlotStatusText(slot) }}</div>
                  <div v-if="slot.price" class="slot-price">${{ slot.price }}</div>
                </div>
              </div>
            </div>

            <!-- Pricing Summary -->
            <v-card v-if="reservation.startTime && reservation.duration" class="pricing-summary mt-4" variant="tonal" color="info">
              <v-card-text class="pa-4">
                <h4 class="text-h6 mb-2">Pricing Summary</h4>
                <div class="d-flex justify-space-between align-center">
                  <span>Court rental ({{ reservation.duration }} minutes)</span>
                  <span class="font-weight-bold">${{ calculateBasePrice() }}</span>
                </div>
                <div v-if="isPeakHour" class="d-flex justify-space-between align-center text-warning">
                  <span>Peak hour surcharge ({{ peakSurcharge }}%)</span>
                  <span class="font-weight-bold">+${{ calculatePeakSurcharge() }}</span>
                </div>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between align-center text-h6">
                  <span class="font-weight-bold">Total</span>
                  <span class="font-weight-bold text-primary">${{ totalPrice }}</span>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </template>

        <!-- Step 3: Additional Details -->
        <template #item.3>
          <div class="step-content pa-6">
            <h3 class="text-h5 mb-4 text-primary">
              <v-icon icon="mdi-information-outline" class="mr-2" />
              Additional Details
            </h3>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                    v-model="reservation.purpose"
                    label="Purpose of Reservation"
                    :items="purposeOptions"
                    variant="outlined"
                    :rules="purposeRules"
                    required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="reservation.numberOfPlayers"
                    label="Number of Players"
                    type="number"
                    variant="outlined"
                    :rules="playersRules"
                    min="1"
                    max="4"
                    required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                    v-model="reservation.notes"
                    label="Additional Notes (Optional)"
                    variant="outlined"
                    rows="3"
                    placeholder="Any special requests or requirements..."
                />
              </v-col>
            </v-row>

            <!-- Equipment Rental -->
            <div class="equipment-section mt-4">
              <h4 class="text-h6 mb-3">Equipment Rental (Optional)</h4>
              <v-row>
                <v-col
                    v-for="equipment in equipmentOptions"
                    :key="equipment.id"
                    cols="12"
                    sm="6"
                    md="4"
                >
                  <v-card
                      class="equipment-card"
                      :color="isEquipmentSelected(equipment.id) ? 'success' : 'white'"
                      :variant="isEquipmentSelected(equipment.id) ? 'tonal' : 'outlined'"
                      @click="toggleEquipment(equipment)"
                  >
                    <v-card-text class="text-center pa-3">
                      <v-icon
                          :icon="equipment.icon"
                          :color="isEquipmentSelected(equipment.id) ? 'success' : 'grey'"
                          size="24"
                          class="mb-2"
                      />
                      <div class="text-body-2 font-weight-medium">{{ equipment.name }}</div>
                      <div class="text-caption text-grey">${{ equipment.price }}/session</div>
                      <v-checkbox
                          :model-value="isEquipmentSelected(equipment.id)"
                          color="success"
                          hide-details
                          class="mt-2"
                          @click.stop
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Contact Information -->
            <div class="contact-section mt-4">
              <h4 class="text-h6 mb-3">Contact Information</h4>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                      v-model="reservation.contactPhone"
                      label="Contact Phone"
                      variant="outlined"
                      :rules="phoneRules"
                      required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                      v-model="reservation.emergencyContact"
                      label="Emergency Contact (Optional)"
                      variant="outlined"
                  />
                </v-col>
              </v-row>
            </div>
          </div>
        </template>

        <!-- Step 4: Review & Confirm -->
        <template #item.4>
          <div class="step-content pa-6">
            <h3 class="text-h5 mb-4 text-primary">
              <v-icon icon="mdi-check-circle-outline" class="mr-2" />
              Review & Confirm
            </h3>

            <!-- Reservation Summary -->
            <v-card class="reservation-summary" variant="outlined">
              <v-card-title class="pa-4 bg-grey-lighten-4">
                <v-icon icon="mdi-file-document-outline" class="mr-2" />
                Reservation Summary
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <h4 class="text-h6 mb-3">Court & Time Details</h4>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Court:</v-list-item-title>
                        <v-list-item-subtitle>{{ getSelectedCourtName() }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Date:</v-list-item-title>
                        <v-list-item-subtitle>{{ formatReservationDate() }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Time:</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.startTime }} - {{ reservation.endTime }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Duration:</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.duration }} minutes</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <v-col cols="12" md="6">
                    <h4 class="text-h6 mb-3">Additional Information</h4>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Purpose:</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.purpose }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Players:</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.numberOfPlayers }} player(s)</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Contact:</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.contactPhone }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="selectedEquipment.length > 0">
                        <v-list-item-title>Equipment:</v-list-item-title>
                        <v-list-item-subtitle>{{ getEquipmentSummary() }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>

                <v-divider class="my-4" />

                <!-- Final Pricing -->
                <div class="final-pricing">
                  <h4 class="text-h6 mb-3">Payment Summary</h4>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span>Court rental</span>
                    <span>${{ calculateBasePrice() }}</span>
                  </div>
                  <div v-if="isPeakHour" class="d-flex justify-space-between align-center mb-2 text-warning">
                    <span>Peak hour surcharge</span>
                    <span>+${{ calculatePeakSurcharge() }}</span>
                  </div>
                  <div v-if="equipmentTotal > 0" class="d-flex justify-space-between align-center mb-2">
                    <span>Equipment rental</span>
                    <span>+${{ equipmentTotal }}</span>
                  </div>
                  <v-divider class="my-2" />
                  <div class="d-flex justify-space-between align-center text-h5">
                    <span class="font-weight-bold">Total Amount</span>
                    <span class="font-weight-bold text-primary">${{ grandTotal }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Terms and Conditions -->
            <v-card class="terms-section mt-4" variant="tonal" color="warning">
              <v-card-text class="pa-4">
                <h4 class="text-h6 mb-2">Terms & Conditions</h4>
                <ul class="text-body-2">
                  <li>Cancellations must be made at least 24 hours in advance</li>
                  <li>Late cancellations will incur a 50% charge</li>
                  <li>Players must arrive 10 minutes before their scheduled time</li>
                  <li>Court time includes setup and cleanup</li>
                  <li>Equipment rental is subject to availability</li>
                </ul>
                <v-checkbox
                    v-model="reservation.agreedToTerms"
                    color="primary"
                    :rules="termsRules"
                    class="mt-3"
                >
                  <template #label>
                    <span class="text-body-2">
                      I agree to the terms and conditions
                    </span>
                  </template>
                </v-checkbox>
              </v-card-text>
            </v-card>
          </div>
        </template>

        <!-- Navigation -->
        <template #actions>
          <div class="stepper-actions d-flex justify-space-between w-100 pa-4">
            <v-btn
                v-if="currentStep > 1"
                variant="outlined"
                color="primary"
                @click="previousStep"
            >
              <v-icon icon="mdi-arrow-left" class="mr-2" />
              Previous
            </v-btn>
            <v-spacer v-else />

            <v-btn
                v-if="currentStep < 4"
                color="primary"
                variant="flat"
                :disabled="!canProceedToNext"
                @click="nextStep"
            >
              Next
              <v-icon icon="mdi-arrow-right" class="ml-2" />
            </v-btn>

            <v-btn
                v-else
                color="success"
                variant="flat"
                size="large"
                :disabled="!canSubmit"
                :loading="submitting"
                @click="submitReservation"
            >
              <v-icon icon="mdi-check" class="mr-2" />
              Confirm Reservation
            </v-btn>
          </div>
        </template>
      </v-stepper>
    </v-card>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-text class="text-center pa-8">
          <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
          <h3 class="text-h5 mb-2">Reservation Confirmed!</h3>
          <p class="text-body-1 mb-4">
            Your court reservation has been successfully created.
          </p>
          <v-chip color="success" variant="flat" class="mb-4">
            Confirmation ID: {{ confirmationId }}
          </v-chip>
          <p class="text-body-2">
            You will receive a confirmation email shortly with all the details.
          </p>
        </v-card-text>
        <v-card-actions class="justify-center pa-6">
          <v-btn color="primary" variant="flat" @click="resetForm">
            Make Another Reservation
          </v-btn>
          <v-btn color="success" variant="outlined" @click="viewReservations">
            View My Reservations
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// Define interfaces
interface Court {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  hourlyRate: number
  features?: string[]
  available: boolean
}

interface TimeSlot {
  time: string
  available: boolean
  price: number
  isPeak: boolean
}

interface Equipment {
  id: string
  name: string
  price: number
  icon: string
}

// Emits
const emit = defineEmits<{
  'reservation-created': [reservation: any]
  'navigate-to-reservations': []
}>()

// Data
const currentStep = ref(1)
const submitting = ref(false)
const showSuccessDialog = ref(false)
const confirmationId = ref('')
const availableSlots = ref(12)

// Steps configuration
const steps = [
  { title: 'Court & Date', value: 1 },
  { title: 'Time', value: 2 },
  { title: 'Details', value: 3 },
  { title: 'Review', value: 4 }
]

// Date constraints
const today = new Date()
const minDate = today.toISOString().split('T')[0]
const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// Peak hours configuration
const peakSurcharge = 25 // 25% surcharge
const peakHours = ['17:00', '18:00', '19:00', '20:00'] // 5-8 PM

// Reservation form data
const reservation = reactive({
  date: '',
  courtId: '',
  courtType: '',
  startTime: '',
  endTime: '',
  duration: 60,
  purpose: '',
  numberOfPlayers: 2,
  notes: '',
  contactPhone: '',
  emergencyContact: '',
  agreedToTerms: false
})

// Selected equipment
const selectedEquipment = ref<string[]>([])

// Options
const courtTypeOptions = [
  { title: 'Any', value: '' },
  { title: 'Indoor Courts', value: 'indoor' },
  { title: 'Outdoor Courts', value: 'outdoor' }
]

const durationOptions = [
  { title: '30 minutes', value: 30 },
  { title: '1 hour', value: 60 },
  { title: '1.5 hours', value: 90 },
  { title: '2 hours', value: 120 }
]

const purposeOptions = [
  { title: 'Practice Session', value: 'practice' },
  { title: 'Friendly Match', value: 'friendly_match' },
  { title: 'Training', value: 'training' },
  { title: 'Tournament Prep', value: 'tournament' },
  { title: 'Recreation', value: 'recreation' }
]

// Mock data
const courts = ref<Court[]>([
  {
    id: '1',
    name: 'Court 1',
    type: 'indoor',
    hourlyRate: 25,
    features: ['Climate Control', 'Professional Net', 'Sound System'],
    available: true
  },
  {
    id: '2',
    name: 'Court 2',
    type: 'outdoor',
    hourlyRate: 20,
    features: ['Natural Light', 'Wind Shield'],
    available: true
  },
  {
    id: '3',
    name: 'Court 3',
    type: 'indoor',
    hourlyRate: 25,
    features: ['Climate Control', 'Video Recording'],
    available: true
  }
])

const equipmentOptions = ref<Equipment[]>([
  { id: '1', name: 'Tennis Racket', price: 5, icon: 'mdi-tennis' },
  { id: '2', name: 'Tennis Balls (Set)', price: 3, icon: 'mdi-tennis-ball' },
  { id: '3', name: 'Towel', price: 2, icon: 'mdi-towel' },
  { id: '4', name: 'Water Bottle', price: 1, icon: 'mdi-bottle-water' }
])

// Validation rules
const dateRules = [
  (v: string) => !!v || 'Date is required',
  (v: string) => new Date(v) >= new Date(minDate) || 'Date cannot be in the past'
]

const timeRules = [
  (v: string) => !!v || 'Start time is required'
]

const durationRules = [
  (v: number) => !!v || 'Duration is required'
]

const purposeRules = [
  (v: string) => !!v || 'Purpose is required'
]

const playersRules = [
  (v: number) => !!v || 'Number of players is required',
  (v: number) => v >= 1 || 'At least 1 player required',
  (v: number) => v <= 4 || 'Maximum 4 players allowed'
]

const phoneRules = [
  (v: string) => !!v || 'Contact phone is required',
  (v: string) => /^[\+]?[0-9\s\-\(\)]+$/.test(v) || 'Please enter a valid phone number'
]

const termsRules = [
  (v: boolean) => v || 'You must agree to the terms and conditions'
]

// Computed
const availableCourts = computed(() => {
  let filtered = courts.value.filter(court => court.available)

  if (reservation.courtType) {
    filtered = filtered.filter(court => court.type === reservation.courtType)
  }

  return filtered
})

const availableTimeSlots = computed(() => {
  // Generate time slots from 8 AM to 10 PM
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`
    slots.push({ title: time, value: time })
  }
  return slots
})

const timeSlots = computed((): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let hour = 8; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`
    const isPeak = peakHours.includes(time)
    const basePrice = getSelectedCourt()?.hourlyRate || 20
    const price = isPeak ? basePrice * (1 + peakSurcharge / 100) : basePrice

    slots.push({
      time,
      available: true, // In real app, check availability
      price,
      isPeak
    })
  }
  return slots
})

const isPeakHour = computed(() => {
  return peakHours.includes(reservation.startTime)
})

const equipmentTotal = computed(() => {
  return selectedEquipment.value.reduce((total, equipId) => {
    const equipment = equipmentOptions.value.find(eq => eq.id === equipId)
    return total + (equipment?.price || 0)
  }, 0)
})

const totalPrice = computed(() => {
  return calculateBasePrice() + calculatePeakSurcharge()
})

const grandTotal = computed(() => {
  return totalPrice.value + equipmentTotal.value
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return reservation.date && reservation.courtId
    case 2:
      return reservation.startTime && reservation.duration
    case 3:
      return reservation.purpose &&
          reservation.numberOfPlayers &&
          reservation.contactPhone
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return canProceedToNext.value && reservation.agreedToTerms
})

// Methods
const getCourtIcon = (type: string): string => {
  return type === 'indoor' ? 'mdi-home' : 'mdi-weather-sunny'
}

const getSelectedCourt = (): Court | undefined => {
  return courts.value.find(court => court.id === reservation.courtId)
}

const getSelectedCourtName = (): string => {
  const court = getSelectedCourt()
  return court ? `${court.name} (${court.type})` : ''
}

const selectCourt = (court: Court) => {
  reservation.courtId = court.id
}

const onDateChange = () => {
  // Reset time selection when date changes
  reservation.startTime = ''
  reservation.endTime = ''
}

const onCourtTypeChange = () => {
  // Reset court selection when type changes
  reservation.courtId = ''
}

const onTimeChange = () => {
  calculateEndTime()
}

const calculateEndTime = () => {
  if (reservation.startTime && reservation.duration) {
    const [hours, minutes] = reservation.startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate.getTime() + reservation.duration * 60000)
    reservation.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }
}

const selectTimeSlot = (slot: TimeSlot) => {
  if (slot.available) {
    reservation.startTime = slot.time
    calculateEndTime()
  }
}

const getTimeSlotClass = (slot: TimeSlot): string => {
  const classes = ['time-slot']

  if (!slot.available) {
    classes.push('slot-unavailable')
  } else if (reservation.startTime === slot.time) {
    classes.push('slot-selected')
  } else if (slot.isPeak) {
    classes.push('slot-peak')
  } else {
    classes.push('slot-available')
  }

  return classes.join(' ')
}

const getSlotStatusText = (slot: TimeSlot): string => {
  if (!slot.available) return 'Unavailable'
  if (slot.isPeak) return 'Peak Hours'
  return 'Available'
}

const calculateBasePrice = (): number => {
  const court = getSelectedCourt()
  if (!court || !reservation.duration) return 0

  return (court.hourlyRate * reservation.duration) / 60
}

const calculatePeakSurcharge = (): number => {
  if (!isPeakHour.value) return 0
  return Math.round((calculateBasePrice() * peakSurcharge) / 100)
}

const isEquipmentSelected = (equipmentId: string): boolean => {
  return selectedEquipment.value.includes(equipmentId)
}

const toggleEquipment = (equipment: Equipment) => {
  const index = selectedEquipment.value.indexOf(equipment.id)
  if (index > -1) {
    selectedEquipment.value.splice(index, 1)
  } else {
    selectedEquipment.value.push(equipment.id)
  }
}

const getEquipmentSummary = (): string => {
  return selectedEquipment.value
      .map(id => equipmentOptions.value.find(eq => eq.id === id)?.name)
      .filter(Boolean)
      .join(', ')
}

const formatReservationDate = (): string => {
  if (!reservation.date) return ''
  return new Date(reservation.date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const nextStep = () => {
  if (canProceedToNext.value && currentStep.value < 4) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitReservation = async () => {
  if (!canSubmit.value) return

  submitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate confirmation ID
    confirmationId.value = `RES-${Date.now().toString().slice(-8)}`

    // Create reservation object
    const reservationData = {
      ...reservation,
      equipment: selectedEquipment.value,
      totalAmount: grandTotal.value,
      confirmationId: confirmationId.value,
      status: 'confirmed',
      createdAt: new Date()
    }

    // Emit event
    emit('reservation-created', reservationData)

    // Show success dialog
    showSuccessDialog.value = true

  } catch (error) {
    console.error('Reservation submission failed:', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  // Reset all form data
  Object.assign(reservation, {
    date: '',
    courtId: '',
    courtType: '',
    startTime: '',
    endTime: '',
    duration: 60,
    purpose: '',
    numberOfPlayers: 2,
    notes: '',
    contactPhone: '',
    emergencyContact: '',
    agreedToTerms: false
  })

  selectedEquipment.value = []
  currentStep.value = 1
  showSuccessDialog.value = false
  confirmationId.value = ''
}

const viewReservations = () => {
  showSuccessDialog.value = false
  emit('navigate-to-reservations')
}

onMounted(() => {
  // Set default date to tomorrow
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  reservation.date = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.reservation-form {
  padding: 0;
}

/* Stepper Styling */
.reservation-stepper {
  border-radius: 12px;
}

:deep(.v-stepper) {
  box-shadow: none;
}

:deep(.v-stepper-header) {
  box-shadow: none;
  background: #f8f9fa;
}

:deep(.v-stepper-item) {
  padding: 16px 24px;
}

/* Step Content */
.step-content {
  min-height: 400px;
}

/* Court Cards */
.court-card {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.court-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.court-card.selected {
  border-color: #2E7D32;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(46, 125, 50, 0.3);
}

/* Time Slots Grid */
.time-slots-grid {
  margin-top: 24px;
}

.slots-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.time-slot {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.slot-available {
  background: #E8F5E8;
  border-color: #4CAF50;
  color: #2E7D32;
}

.slot-available:hover {
  background: #C8E6C9;
  transform: translateY(-2px);
}

.slot-peak {
  background: #FFF3E0;
  border-color: #FF9800;
  color: #F57C00;
}

.slot-peak:hover {
  background: #FFE0B2;
  transform: translateY(-2px);
}

.slot-selected {
  background: #2E7D32;
  border-color: #1B5E20;
  color: white;
  transform: translateY(-2px);
}

.slot-unavailable {
  background: #FAFAFA;
  border-color: #E0E0E0;
  color: #9E9E9E;
  cursor: not-allowed;
}

.slot-time {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 4px;
}

.slot-status {
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.slot-price {
  font-size: 0.875rem;
  font-weight: 600;
}

/* Equipment Cards */
.equipment-card {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Pricing Summary */
.pricing-summary {
  border-radius: 12px;
  border-left: 4px solid #2196F3;
}

/* Reservation Summary */
.reservation-summary {
  border-radius: 12px;
}

.final-pricing {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

/* Terms Section */
.terms-section {
  border-radius: 12px;
  border-left: 4px solid #FF9800;
}

.terms-section ul {
  margin: 0;
  padding-left: 20px;
}

.terms-section li {
  margin-bottom: 4px;
}

/* Stepper Actions */
.stepper-actions {
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

/* Gap utility */
.gap-1 > * {
  margin-right: 4px;
  margin-bottom: 4px;
}

.gap-1 > *:last-child {
  margin-right: 0;
}

/* Responsive Design */
@media (max-width: 960px) {
  .slots-container {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .time-slot {
    padding: 8px;
  }

  .slot-time {
    font-size: 0.875rem;
  }

  .court-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 600px) {
  .step-content {
    padding: 16px !important;
    min-height: 300px;
  }

  .stepper-actions {
    flex-direction: column;
    gap: 12px;
  }

  .stepper-actions .v-btn {
    width: 100%;
  }

  .slots-container {
    grid-template-columns: repeat(2, 1fr);
  }

  :deep(.v-stepper-item) {
    padding: 12px 16px;
  }
}

/* Form Field Spacing */
:deep(.v-text-field),
:deep(.v-select),
:deep(.v-textarea) {
  margin-bottom: 8px;
}

/* List Styling */
:deep(.v-list) {
  background: transparent;
}

:deep(.v-list-item) {
  min-height: 36px;
  padding: 4px 0;
}

:deep(.v-list-item-title) {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

:deep(.v-list-item-subtitle) {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

/* Checkbox Styling */
:deep(.v-checkbox) {
  margin: 0;
}

:deep(.v-selection-control) {
  min-height: auto;
}

/* Success Dialog */
:deep(.v-dialog .v-card) {
  border-radius: 16px;
}

/* Loading States */
.v-btn--loading {
  pointer-events: none;
}

/* Animation for cards */
.court-card,
.equipment-card,
.time-slot {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

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

/* Equipment section delay */
.equipment-card:nth-child(1) { animation-delay: 0.1s; }
.equipment-card:nth-child(2) { animation-delay: 0.2s; }
.equipment-card:nth-child(3) { animation-delay: 0.3s; }
.equipment-card:nth-child(4) { animation-delay: 0.4s; }

/* Print Styles */
@media print {
  .reservation-form {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .stepper-actions,
  :deep(.v-btn) {
    display: none;
  }

  .step-content {
    border: 1px solid #000;
    margin-bottom: 16px;
  }

  .court-card.selected,
  .time-slot.slot-selected {
    background: #f0f0f0 !important;
    color: #000 !important;
    border: 2px solid #000;
  }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  :deep(.v-stepper-header) {
    background: #2d2d2d;
  }

  .final-pricing {
    background: #2d2d2d;
  }

  .stepper-actions {
    background: #2d2d2d;
    border-top-color: #444;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .court-card,
  .equipment-card,
  .time-slot {
    border: 2px solid #000;
  }

  .court-card.selected,
  .time-slot.slot-selected {
    border: 3px solid #000;
    background: #fff !important;
    color: #000 !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .court-card,
  .equipment-card,
  .time-slot {
    transition: none;
    animation: none;
  }

  .court-card:hover,
  .equipment-card:hover,
  .time-slot:hover {
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

/* Tooltip Styling */
:deep(.v-tooltip .v-overlay__content) {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  font-size: 0.875rem;
  max-width: 300px;
}
</style>