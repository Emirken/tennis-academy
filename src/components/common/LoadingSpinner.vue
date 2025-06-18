<template>
  <div
      class="loading-spinner"
      :class="containerClass"
  >
    <!-- Overlay Background -->
    <div
        v-if="overlay"
        class="loading-overlay"
        :class="overlayClass"
    />

    <!-- Spinner Content -->
    <div class="spinner-content" :class="contentClass">
      <!-- Spinner Type Selection -->
      <div class="spinner-wrapper">
        <!-- Tennis Ball Spinner (Custom) -->
        <div
            v-if="type === 'tennis'"
            class="tennis-spinner"
            :style="{ width: spinnerSize, height: spinnerSize }"
        >
          <div class="tennis-ball">
            <div class="ball-curve"></div>
          </div>
        </div>

        <!-- Racket Spinner (Custom) -->
        <div
            v-else-if="type === 'racket'"
            class="racket-spinner"
            :style="{ width: spinnerSize, height: spinnerSize }"
        >
          <v-icon
              icon="mdi-tennis"
              :size="parseInt(size)"
              :color="color"
              class="racket-icon"
          />
        </div>

        <!-- Court Lines Spinner (Custom) -->
        <div
            v-else-if="type === 'court'"
            class="court-spinner"
            :style="{ width: spinnerSize, height: spinnerSize }"
        >
          <div class="court-lines">
            <div class="line line-1"></div>
            <div class="line line-2"></div>
            <div class="line line-3"></div>
            <div class="line line-4"></div>
          </div>
        </div>

        <!-- Vuetify Progress Circular -->
        <v-progress-circular
            v-else-if="type === 'circular'"
            :size="size"
            :width="width"
            :color="color"
            indeterminate
        />

        <!-- Vuetify Progress Linear -->
        <v-progress-linear
            v-else-if="type === 'linear'"
            :color="color"
            :height="width"
            indeterminate
            class="linear-spinner"
        />

        <!-- Dots Spinner -->
        <div
            v-else-if="type === 'dots'"
            class="dots-spinner"
        >
          <div
              v-for="i in 3"
              :key="i"
              class="dot"
              :style="{
              backgroundColor: getDotColor(color),
              animationDelay: `${(i - 1) * 0.2}s`
            }"
          />
        </div>

        <!-- Pulse Spinner -->
        <div
            v-else-if="type === 'pulse'"
            class="pulse-spinner"
            :style="{ width: spinnerSize, height: spinnerSize }"
        >
          <div
              class="pulse-circle"
              :style="{
              backgroundColor: getPulseColor(color),
              width: spinnerSize,
              height: spinnerSize
            }"
          />
        </div>

        <!-- Default: Vuetify Circular -->
        <v-progress-circular
            v-else
            :size="size"
            :width="width"
            :color="color"
            indeterminate
        />
      </div>

      <!-- Loading Text -->
      <div
          v-if="text"
          class="loading-text mt-4"
          :class="textClass"
      >
        {{ text }}
      </div>

      <!-- Custom Content Slot -->
      <slot name="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  type?: 'tennis' | 'racket' | 'court' | 'circular' | 'linear' | 'dots' | 'pulse'
  size?: any
  width?: string | number
  color?: string
  text?: string
  overlay?: boolean
  fullscreen?: boolean
  center?: boolean
  absolute?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'circular',
  size: 48,
  width: 4,
  color: 'primary',
  text: '',
  overlay: false,
  fullscreen: false,
  center: true,
  absolute: false,
  zIndex: 1000
})

// Computed
const spinnerSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const containerClass = computed(() => {
  const classes = []

  if (props.fullscreen) classes.push('fullscreen')
  if (props.center) classes.push('centered')
  if (props.absolute) classes.push('absolute')
  if (props.overlay) classes.push('with-overlay')

  return classes
})

const overlayClass = computed(() => {
  const classes = ['overlay-bg']

  if (props.fullscreen) classes.push('fullscreen-overlay')

  return classes
})

const contentClass = computed(() => {
  const classes = ['text-center']

  if (props.overlay) classes.push('elevated-content')

  return classes
})

const textClass = computed(() => {
  const classes = ['text-body-1']

  // Text color based on spinner color
  if (props.color === 'white') {
    classes.push('text-white')
  } else if (props.overlay) {
    classes.push('text-white')
  } else {
    classes.push(`text-${props.color}`)
  }

  return classes
})

// Methods
const getDotColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'primary': '#2E7D32',
    'secondary': '#4CAF50',
    'success': '#4CAF50',
    'warning': '#FF9800',
    'error': '#F44336',
    'info': '#2196F3',
    'white': '#FFFFFF'
  }

  return colorMap[color] || color
}

const getPulseColor = (color: string): string => {
  return getDotColor(color)
}
</script>

<style scoped>
/* Container Styles */
.loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner.centered {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-spinner.absolute {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-spinner.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: v-bind(zIndex);
}

.loading-spinner.with-overlay {
  z-index: v-bind(zIndex);
}

/* Overlay Background */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.overlay-bg {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.fullscreen-overlay {
  position: fixed;
}

/* Content */
.spinner-content {
  position: relative;
  z-index: 1;
}

.elevated-content {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(8px);
}

.spinner-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  color: inherit;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Linear Spinner */
.linear-spinner {
  min-width: 200px;
  border-radius: 4px;
}

/* Tennis Ball Spinner */
.tennis-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  animation: tennisRotate 2s linear infinite;
}

.tennis-ball {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, #90EE90, #228B22);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.ball-curve {
  position: absolute;
  top: 20%;
  left: 10%;
  right: 10%;
  height: 60%;
  border: 2px solid white;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  border-left: none;
  border-right: none;
}

@keyframes tennisRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Racket Spinner */
.racket-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  animation: racketSpin 1.5s ease-in-out infinite;
}

.racket-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

@keyframes racketSpin {
  0%, 100% { transform: rotate(-15deg) scale(1); }
  50% { transform: rotate(15deg) scale(1.1); }
}

/* Court Lines Spinner */
.court-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.court-lines {
  width: 100%;
  height: 60%;
  position: relative;
  border: 2px solid #2E7D32;
  border-radius: 4px;
}

.line {
  position: absolute;
  background-color: #2E7D32;
  animation: courtPulse 1.5s ease-in-out infinite;
}

.line-1 {
  top: 20%;
  left: 0;
  right: 0;
  height: 2px;
  animation-delay: 0s;
}

.line-2 {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  animation-delay: 0.2s;
}

.line-3 {
  bottom: 20%;
  left: 0;
  right: 0;
  height: 2px;
  animation-delay: 0.4s;
}

.line-4 {
  top: 20%;
  bottom: 20%;
  left: 25%;
  width: 2px;
  animation-delay: 0.6s;
}

@keyframes courtPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Dots Spinner */
.dots-spinner {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: dotBounce 1.4s ease-in-out infinite;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Pulse Spinner */
.pulse-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.pulse-circle {
  border-radius: 50%;
  animation: pulseScale 2s ease-in-out infinite;
  position: relative;
}

.pulse-circle::before,
.pulse-circle::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background-color: inherit;
  animation: pulseRipple 2s ease-in-out infinite;
}

.pulse-circle::after {
  animation-delay: 1s;
}

@keyframes pulseScale {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.8; }
}

@keyframes pulseRipple {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Responsive Design */
@media (max-width: 600px) {
  .elevated-content {
    padding: 16px;
    margin: 16px;
  }

  .linear-spinner {
    min-width: 150px;
  }

  .loading-text {
    font-size: 0.875rem;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .elevated-content {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .overlay-bg {
    background-color: rgba(0, 0, 0, 0.7);
  }
}
</style>