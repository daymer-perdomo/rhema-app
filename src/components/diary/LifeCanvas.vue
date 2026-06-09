<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLifeCanvas } from '@/composables/useLifeCanvas'

const props = defineProps({ entries: { type: Array, default: () => [] } })
const emit  = defineEmits(['nodeClick'])

const canvasRef = ref(null)
const { initCanvas, destroyCanvas, highlightNode, canvasStyle, nodesData } = useLifeCanvas(
  canvasRef,
  () => props.entries,
  emit
)

const ICONS = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
}

// Overlay matches canvas height (100% on desktop, px value on mobile)
const overlayStyle = computed(() => ({
  height: canvasStyle.value.height,
}))

defineExpose({ highlightNode })
onMounted(initCanvas)
onUnmounted(destroyCanvas)
</script>

<template>
  <div class="lc-root">

    <canvas
      ref="canvasRef"
      :aria-label="`Línea de vida espiritual — ${entries.length} entradas`"
      :style="canvasStyle"
    />

    <!-- HTML emoji overlay — crisp native rendering, no canvas blending issues -->
    <div class="lc-overlay" :style="overlayStyle" aria-hidden="true">
      <span
        v-for="(node, i) in nodesData"
        :key="node.entry.id"
        class="lc-emoji"
        :style="{
          left:           node.x + 'px',
          top:            node.y + 'px',
          animationDelay: -(i * 380) + 'ms',
        }"
      >
        {{ ICONS[node.entry.emotion] || '✦' }}
      </span>
    </div>

  </div>
</template>

<style scoped>
.lc-root {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Overlay sits exactly on top of the canvas */
.lc-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  overflow: hidden;
}

/* Each emoji node */
.lc-emoji {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 22px;
  line-height: 1;
  user-select: none;

  /* Native emoji quality */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;

  /* Subtle pulse synced with canvas halo */
  animation: lc-pulse 2.6s ease-in-out infinite;
}

@keyframes lc-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1);    }
  50%       { transform: translate(-50%, -50%) scale(1.18); }
}
</style>
