<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useLifeCanvas } from '@/composables/useLifeCanvas'

const props = defineProps({ entries: { type: Array, default: () => [] } })
const emit  = defineEmits(['nodeClick'])

const canvasRef = ref(null)
const { initCanvas, destroyCanvas, highlightNode } = useLifeCanvas(
  canvasRef,
  () => props.entries,
  emit
)

defineExpose({ highlightNode })

onMounted(initCanvas)
onUnmounted(destroyCanvas)
</script>

<template>
  <canvas
    ref="canvasRef"
    :aria-label="`Línea de vida espiritual — ${entries.length} entradas`"
    style="display:block;width:100%;height:100%;"
  />
</template>
