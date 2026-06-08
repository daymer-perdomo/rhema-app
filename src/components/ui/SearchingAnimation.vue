<template>
  <div class="searching-root" aria-hidden="true">

    <!-- Orbs de luz -->
    <div class="orb orb-1" style="--tx:42px; --ty:-28px" />
    <div class="orb orb-2" style="--tx:-38px; --ty:32px" />
    <div class="orb orb-3" style="--tx:26px; --ty:22px" />
    <div class="orb orb-4" style="--tx:-26px; --ty:-24px" />
    <div class="orb orb-5" style="--tx:18px; --ty:38px" />

    <!-- Líneas de escaneo -->
    <div class="scan-line" />
    <div class="scan-line scan-delay" />

    <!-- Texto central -->
    <div class="center-group">
      <span class="center-ornament">✦</span>
      <p class="center-text">Buscando en la Palabra...</p>
      <div class="dots">
        <span /><span /><span />
      </div>
    </div>

  </div>
</template>

<style scoped>
.searching-root {
  position: absolute;
  inset: 0;
  background: var(--color-overlay-scrim);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: var(--z-overlay);
}

/* ─── Orbs ────────────────────────────────────────────────────────────────── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  animation: orb-drift var(--dur, 6s) ease-in-out var(--del, 0s) infinite;
}

.orb-1 { width:180px; height:180px; background:rgba(201,168,76,0.18);  --dur:6s;   --del:0s;  top:20%; left:10%; }
.orb-2 { width:140px; height:140px; background:rgba(91,141,217,0.15);  --dur:8s;   --del:-2s; top:50%; right:15%; }
.orb-3 { width:200px; height:200px; background:rgba(106,181,139,0.10); --dur:7s;   --del:-4s; bottom:20%; left:30%; }
.orb-4 { width:120px; height:120px; background:rgba(201,168,76,0.12);  --dur:9s;   --del:-1s; top:10%; right:30%; }
.orb-5 { width:160px; height:160px; background:rgba(155,114,207,0.10); --dur:7.5s; --del:-3s; bottom:35%; right:5%; }

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
    rgba(201,168,76,0.00) 10%,
    rgba(201,168,76,0.40) 40%,
    rgba(201,168,76,0.60) 50%,
    rgba(201,168,76,0.40) 60%,
    rgba(201,168,76,0.00) 90%,
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

/* ─── Center text ─────────────────────────────────────────────────────────── */
.center-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.center-ornament {
  font-size: 1.25rem;
  color: var(--color-rhema-gold);
  animation: breathe 2.5s ease-in-out infinite;
}

.center-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.1rem;
  color: var(--color-rhema-gold);
  text-align: center;
  animation: breathe 2.5s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1; }
}

.dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-rhema-gold);
  animation: dot-bounce 1.2s ease-in-out infinite;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 100% { opacity: 0.2; transform: translateY(0); }
  50%       { opacity: 1;   transform: translateY(-4px); }
}
</style>
