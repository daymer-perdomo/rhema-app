<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'ghost'].includes(v),
  },
  loading: Boolean,
  disabled: Boolean,
})
</script>

<template>
  <button
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'primary'
        ? 'bg-rhema-gold text-rhema-dark hover:bg-rhema-gold-light active:scale-95'
        : 'border border-rhema-border text-rhema-muted hover:text-rhema-text hover:border-rhema-muted',
    ]"
  >
    <svg
      v-if="loading"
      class="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    <slot />
  </button>
</template>
