<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  placeholder: String,
  maxlength: { type: Number, default: 500 },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm text-rhema-muted font-medium">{{ label }}</label>
    <div class="relative">
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        rows="4"
        class="w-full bg-rhema-surface border border-rhema-border rounded-xl px-4 py-3 text-rhema-text placeholder-rhema-muted resize-none focus:outline-none focus:border-rhema-gold transition-colors duration-200 text-sm leading-relaxed"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span class="absolute bottom-3 right-4 text-xs text-rhema-muted select-none">
        {{ modelValue.length }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>
