<template>
  <div class="app-loader" aria-label="Cargando Rhema" role="status">

    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />

    <div class="loader-center">

      <div class="loader-logo">
        <span class="loader-star">✦</span>
        <span class="loader-name">Rhema</span>
      </div>

      <p class="loader-tagline">La Palabra para tu momento</p>

      <div class="loader-bar">
        <div class="loader-bar-fill" />
      </div>

    </div>

  </div>
</template>

<style scoped>
.app-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-image:
    linear-gradient(rgba(225, 237, 224, 0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(225, 237, 224, 0.012) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── Orbes ── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: orb-drift var(--dur) ease-in-out var(--del) infinite;
  opacity: 0;
}

.orb-1 { width: 300px; height: 300px; background: rgba(225, 237, 224, 0.07); top: 10%;    left: 5%;   --dur: 8s;  --del: 0s;  --tx: 40px;  --ty: 30px;  }
.orb-2 { width: 250px; height: 250px; background: rgba(168, 196, 162, 0.06); bottom: 15%; right: 8%;  --dur: 10s; --del: -3s; --tx: -30px; --ty: -25px; }
.orb-3 { width: 200px; height: 200px; background: rgba(225, 237, 224, 0.05); top: 40%;   right: 20%; --dur: 7s;  --del: -5s; --tx: 20px;  --ty: 40px;  }

@keyframes orb-drift {
  0%   { opacity: 0;   transform: translate(0, 0) scale(1); }
  20%  { opacity: 1; }
  50%  { opacity: 0.8; transform: translate(var(--tx), var(--ty)) scale(1.1); }
  80%  { opacity: 1; }
  100% { opacity: 0;   transform: translate(0, 0) scale(1); }
}

/* ── Centro ── */
.loader-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  z-index: 1;
}

/* ── Logo ── */
.loader-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  animation: logo-appear 800ms ease both;
}

@keyframes logo-appear {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.loader-star {
  color: var(--color-accent);
  font-size: 1rem;
  animation: pulse-star 2.5s ease-in-out infinite;
}

@keyframes pulse-star {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.2); }
}

.loader-name {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.04em;
  line-height: 1;
}

/* ── Tagline ── */
.loader-tagline {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  opacity: 0;
  animation: tagline-appear 600ms ease 400ms both;
  letter-spacing: 0.02em;
}

@keyframes tagline-appear {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 0.6; transform: translateY(0); }
}

/* ── Barra ── */
.loader-bar {
  width: 120px;
  height: 1px;
  background: var(--color-border);
  border-radius: 1px;
  overflow: hidden;
  opacity: 0;
  animation: bar-appear 400ms ease 600ms both;
}

@keyframes bar-appear {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.loader-bar-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--color-accent-mid), var(--color-accent));
  border-radius: 1px;
  animation: bar-fill 1800ms cubic-bezier(0.4, 0, 0.2, 1) 200ms both;
}

@keyframes bar-fill {
  0%   { width: 0%; }
  40%  { width: 60%; }
  70%  { width: 80%; }
  100% { width: 95%; }
}
</style>
