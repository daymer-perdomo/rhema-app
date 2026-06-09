<script setup>
defineProps({ step: { type: Number, default: 1 } })

const steps = [
  { label: 'Entendiendo tu corazón...', icon: '🌿', short: 'Emoción'    },
  { label: 'Buscando en la Palabra...',  icon: '📖', short: 'Versículos' },
  { label: 'Preparando tu respuesta...', icon: '✦',  short: 'Respuesta'  },
]
</script>

<template>
  <div class="searching-root" aria-hidden="true">

    <!-- Orbes de fondo -->
    <div class="orb orb-1" style="--tx:42px; --ty:-28px" />
    <div class="orb orb-2" style="--tx:-38px; --ty:32px" />
    <div class="orb orb-3" style="--tx:26px; --ty:22px" />
    <div class="orb orb-4" style="--tx:-26px; --ty:-24px" />
    <div class="orb orb-5" style="--tx:18px; --ty:38px" />

    <!-- Líneas de escaneo -->
    <div class="scan-line" />
    <div class="scan-line scan-delay" />

    <!-- Centro -->
    <div class="center-group">

      <!-- Fila de pasos -->
      <div class="steps-row">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="step-item"
          :class="{
            'is-active': step === i + 1,
            'is-done':   step >  i + 1,
          }"
        >
          <div class="step-circle">{{ s.icon }}</div>
          <span class="step-label">{{ s.short }}</span>
        </div>
      </div>

      <!-- Label del paso actual -->
      <p class="center-text">{{ steps[(step || 1) - 1]?.label }}</p>

      <!-- Barra de progreso -->
      <div class="progress-bar">
        <div class="progress-fill" :data-step="step" />
      </div>

    </div>

  </div>
</template>

<style scoped>
.searching-root {
  position: absolute;
  inset: 0;
  background: rgba(14, 14, 14, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 40;
}

/* ─── Orbs ────────────────────────────────────────────────────────────────── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  animation: orb-drift var(--dur, 6s) ease-in-out var(--del, 0s) infinite;
}

.orb-1 { width:180px; height:180px; background:rgba(225,237,224,0.14); --dur:6s;   --del:0s;  top:20%; left:10%; }
.orb-2 { width:140px; height:140px; background:rgba(91,141,217,0.12);  --dur:8s;   --del:-2s; top:50%; right:15%; }
.orb-3 { width:200px; height:200px; background:rgba(106,181,139,0.08); --dur:7s;   --del:-4s; bottom:20%; left:30%; }
.orb-4 { width:120px; height:120px; background:rgba(225,237,224,0.10); --dur:9s;   --del:-1s; top:10%; right:30%; }
.orb-5 { width:160px; height:160px; background:rgba(155,114,207,0.08); --dur:7.5s; --del:-3s; bottom:35%; right:5%; }

@keyframes orb-drift {
  0%   { opacity: 0;   transform: translate(0, 0) scale(1); }
  20%  { opacity: 1; }
  50%  { opacity: 0.8; transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(1.1); }
  80%  { opacity: 1; }
  100% { opacity: 0;   transform: translate(0, 0) scale(1); }
}

/* ─── Scan lines ──────────────────────────────────────────────────────────── */
.scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(225,237,224,0.00) 10%,
    rgba(225,237,224,0.40) 40%,
    rgba(225,237,224,0.60) 50%,
    rgba(225,237,224,0.40) 60%,
    rgba(225,237,224,0.00) 90%,
    transparent 100%
  );
  filter: blur(1px);
  animation: scan 4s ease-in-out infinite;
}
.scan-delay { animation-delay: -2s; opacity: 0.6; }

@keyframes scan {
  0%   { top: -2px;  opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%;  opacity: 0; }
}

/* ─── Contenedor central ──────────────────────────────────────────────────── */
.center-group {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 2.5rem;
  background: rgba(14, 14, 14, 0.6);
  border: 1px solid rgba(225, 237, 224, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  min-width: 260px;
}

/* ─── Fila de pasos ───────────────────────────────────────────────────────── */
.steps-row {
  display: flex;
  align-items: flex-start;
  gap: 32px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 14px;
  left: calc(50% + 14px);
  width: 32px;
  height: 1px;
  background: var(--color-border);
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: all 400ms ease;
}

.step-item.is-active .step-circle {
  border-color: var(--color-accent);
  background: rgba(225, 237, 224, 0.08);
  color: var(--color-accent);
  box-shadow: 0 0 12px rgba(225, 237, 224, 0.2);
}

.step-item.is-done .step-circle {
  border-color: var(--color-accent-mid);
  background: rgba(168, 196, 162, 0.1);
  color: var(--color-accent-mid);
}

.step-label {
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: transparent;
  transition: color 300ms ease;
  white-space: nowrap;
}

.step-item.is-active .step-label { color: var(--color-text-muted); }
.step-item.is-done   .step-label { color: var(--color-text-muted); opacity: 0.5; }

/* ─── Texto del paso activo ───────────────────────────────────────────────── */
.center-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-accent);
  text-align: center;
  animation: breathe 2.5s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}

/* ─── Barra de progreso ───────────────────────────────────────────────────── */
.progress-bar {
  width: 100%;
  height: 2px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-mid), var(--color-accent));
  border-radius: 2px;
  transition: width 800ms ease;
}

.progress-fill[data-step="1"] { width: 33%; }
.progress-fill[data-step="2"] { width: 66%; }
.progress-fill[data-step="3"] { width: 90%; animation: progress-pulse 1.5s ease-in-out infinite; }

@keyframes progress-pulse {
  0%, 100% { opacity: 0.8; }
  50%       { opacity: 1; }
}
</style>
