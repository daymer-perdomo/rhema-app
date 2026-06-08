<script setup>
import { ref } from 'vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  loading: Boolean,
})

const emit = defineEmits(['submit'])

const concern = ref('')

function handleSubmit() {
  const trimmed = concern.value.trim()
  if (!trimmed || props.loading) return
  emit('submit', trimmed)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <BaseTextarea
      v-model="concern"
      placeholder="Escribe lo que hay en tu corazón... una preocupación, una duda, algo que estás enfrentando."
      :maxlength="500"
      @keydown.ctrl.enter="handleSubmit"
      @keydown.meta.enter="handleSubmit"
    />

    <div class="flex items-center justify-between">
      <span class="text-xs text-rhema-muted">Ctrl+Enter para enviar</span>
      <BaseButton
        :loading="loading"
        :disabled="!concern.trim()"
        @click="handleSubmit"
      >
        <span v-if="!loading">¿Qué dice la Palabra del Señor?</span>
        <span v-else>Buscando en las Escrituras...</span>
      </BaseButton>
    </div>
  </div>
</template>
