<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const particles = ref([])
const dataLines = ref([
  { label: 'Momentos capturados',   value: 0, target: 18847 },
  { label: 'Versículos consultados', value: 0, target: 34291 },
  { label: 'Días de prueba',         value: 0, target: 47    },
  { label: 'Corazones involucrados', value: 0, target: 1      },
])
const showHeart = ref(false)

let animFrame = null

function randomBetween(a, b) {
  return a + Math.floor(Math.random() * (b - a))
}

function spawnParticles() {
  for (let i = 0; i < 28; i++) {
    particles.value.push({
      id: i,
      x: randomBetween(2, 98),
      y: randomBetween(5, 95),
      size: randomBetween(2, 5),
      delay: (i * 0.18).toFixed(2),
      dur: (4 + Math.random() * 4).toFixed(1),
    })
  }
}

function animateCounters() {
  const start = performance.now()
  const duration = 2800

  function tick(now) {
    const t = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    dataLines.value.forEach(line => {
      line.value = Math.floor(ease * line.target)
    })
    if (t < 1) {
      animFrame = requestAnimationFrame(tick)
    } else {
      dataLines.value.forEach(line => { line.value = line.target })
      showHeart.value = true
    }
  }
  animFrame = requestAnimationFrame(tick)
}

onMounted(() => {
  spawnParticles()
  setTimeout(animateCounters, 800)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<template>
  <div class="overlay">
    <!-- Partículas de fondo -->
    <span
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="{
        left: p.x + '%',
        top:  p.y + '%',
        width:  p.size + 'px',
        height: p.size + 'px',
        animationDelay: p.delay + 's',
        animationDuration: p.dur + 's',
      }"
    />

    <div class="card">
      <!-- Icono superior -->
      <div class="icon-wrap">
        <span class="icon-ring" />
        <span class="icon-text">✦</span>
      </div>

      <!-- Título principal -->
      <h1 class="title">Tiempo de prueba <em>terminado</em></h1>

      <p class="subtitle">
        ¡Lo logramos! — y fue gracias a cada uno de ustedes.
      </p>

      <!-- Mensaje -->
      <div class="message">
        <p>
          La comunidad Rhema nos dio algo que ningún equipo puede fabricar solo:
          <strong>datos reales, de personas reales, en momentos reales.</strong>
          Cada toque en la pantalla, cada versículo buscado a las 2&nbsp;am,
          cada bug que nos reportaron con cara de "¿esto es normal?" —
          todo eso vive ahora en nuestros servidores esperando ser analizado. 🔬
        </p>
        <p>
          Estamos descifrando el ruido, separando las pepitas de oro
          y preparando algo mucho más grande para la próxima temporada.
          <strong>No se vayan muy lejos.</strong> 🚀
        </p>
      </div>

      <!-- Contadores animados -->
      <div class="stats">
        <div v-for="line in dataLines" :key="line.label" class="stat-row">
          <span class="stat-label">{{ line.label }}</span>
          <span class="stat-value">
            {{ line.value.toLocaleString('es') }}
            <span v-if="line.label === 'Corazones involucrados'" class="heart" :class="{ visible: showHeart }">♥</span>
          </span>
        </div>
        <div class="stat-row processing">
          <span class="stat-label">Estado</span>
          <span class="stat-value blink">Analizando…</span>
        </div>
      </div>

      <!-- Firma -->
      <div class="signature">
        <span class="sig-line" />
        <p>
          Con gratitud infinita,<br>
          <strong>Developer Daymer Perdomo</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Overlay bloqueante ── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 1.5rem 1rem;
}

/* ── Partículas ── */
.particle {
  position: absolute;
  border-radius: 50%;
  background: var(--color-accent-mid);
  opacity: 0;
  animation: float linear infinite;
}
@keyframes float {
  0%   { opacity: 0;    transform: translateY(0)      scale(1); }
  20%  { opacity: 0.35; }
  80%  { opacity: 0.2;  }
  100% { opacity: 0;    transform: translateY(-60px)  scale(0.6); }
}

/* ── Tarjeta central ── */
.card {
  position: relative;
  max-width: 560px;
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 0 60px rgba(168, 196, 162, 0.06);
  animation: card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

/* ── Icono ── */
.icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}
.icon-ring {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid var(--color-accent-mid);
  opacity: 0.4;
  animation: pulse-ring 2.4s ease-in-out infinite;
}
@keyframes pulse-ring {
  0%, 100% { transform: scale(1);    opacity: 0.4; }
  50%       { transform: scale(1.18); opacity: 0.12; }
}
.icon-text {
  font-size: 1.6rem;
  color: var(--color-accent);
  line-height: 1;
  animation: spin-star 8s linear infinite;
}
@keyframes spin-star {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Textos ── */
.title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.5rem, 5vw, 2.1rem);
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}
.title em {
  color: var(--color-accent);
  font-style: italic;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.message {
  font-family: 'Lora', serif;
  font-size: 0.88rem;
  line-height: 1.75;
  color: var(--color-text-soft);
  text-align: left;
  border-left: 2px solid var(--color-accent-mid);
  padding-left: 1rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.message strong {
  color: var(--color-text);
  font-weight: 600;
}

/* ── Stats ── */
.stats {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}
.stat-label {
  color: var(--color-text-muted);
}
.stat-value {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.processing .stat-value {
  color: var(--color-accent-mid);
}
.blink {
  animation: blink 1.2s step-start infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.heart {
  display: inline-block;
  opacity: 0;
  color: #c47a7a;
  transition: opacity 0.6s ease, transform 0.6s ease;
  transform: scale(0.4);
}
.heart.visible {
  opacity: 1;
  transform: scale(1.1);
}

/* ── Firma ── */
.signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.sig-line {
  display: block;
  width: 48px;
  height: 1px;
  background: var(--color-border-light);
}
.signature p {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}
.signature strong {
  color: var(--color-text-soft);
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .overlay {
    align-items: flex-start;
    padding: 0.75rem 0.6rem;
  }

  .card {
    padding: 1.1rem 0.9rem;
    border-radius: 12px;
    margin: auto 0;
  }

  .icon-wrap {
    margin-bottom: 0.5rem;
  }
  .icon-ring {
    width: 34px;
    height: 34px;
  }
  .icon-text {
    font-size: 1rem;
  }

  .title {
    font-size: 1.15rem;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    font-size: 0.72rem;
    margin-bottom: 0.75rem;
  }

  .message {
    font-size: 0.73rem;
    line-height: 1.55;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-left: 0.65rem;
  }

  .stats {
    padding: 0.6rem 0.85rem;
    margin-bottom: 1rem;
    gap: 0.35rem;
  }
  .stat-row {
    font-size: 0.7rem;
  }

  .signature p {
    font-size: 0.66rem;
  }
}
</style>
