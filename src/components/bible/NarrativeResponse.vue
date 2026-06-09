<script setup>
import { computed } from 'vue'

const props = defineProps({
  intro:     { type: String,  required: true },
  cards:     { type: Array,   required: true },
  closing:   { type: String,  required: true },
  showSave:  { type: Boolean, default: false },
  showReset: { type: Boolean, default: true  },
})

defineEmits(['reset', 'save'])

const TRANSITIONS = [
  'La Escritura también dice:',
  'Y hay más:',
  'También la Palabra declara:',
]

const blocks = computed(() => {
  const list = []
  list.push({ type: 'ornament-open' })
  list.push({ type: 'intro' })
  for (let i = 0; i < props.cards.length; i++) {
    if (i > 0) list.push({ type: 'transition', cardIndex: i })
    list.push({ type: 'verse', cardIndex: i })
    list.push({ type: 'reflection', cardIndex: i })
  }
  list.push({ type: 'closing' })
  list.push({ type: 'ornament-close' })
  list.push({ type: 'reset' })
  return list
})

function delay(idx) {
  return { animationDelay: `${idx * 160}ms` }
}
</script>

<template>
  <article class="narrative">
    <template v-for="(block, idx) in blocks" :key="idx">

      <div
        v-if="block.type === 'ornament-open' || block.type === 'ornament-close'"
        class="ornament"
        :style="delay(idx)"
      >✦</div>

      <p
        v-else-if="block.type === 'intro'"
        class="prose"
        :style="delay(idx)"
      >{{ intro }}</p>

      <p
        v-else-if="block.type === 'transition'"
        class="transition-label"
        :style="delay(idx)"
      >{{ TRANSITIONS[(block.cardIndex - 1) % TRANSITIONS.length] }}</p>

      <div
        v-else-if="block.type === 'verse'"
        class="verse-block"
        :style="delay(idx)"
      >
        <blockquote class="verse-text">
          "{{ cards[block.cardIndex].text ?? cards[block.cardIndex].verse }}"
        </blockquote>
        <cite class="verse-ref">— {{ cards[block.cardIndex].reference }}</cite>
      </div>

      <p
        v-else-if="block.type === 'reflection'"
        class="prose"
        :style="delay(idx)"
      >{{ cards[block.cardIndex].reflection }}</p>

      <p
        v-else-if="block.type === 'closing'"
        class="prose closing"
        :style="delay(idx)"
      >{{ closing }}</p>

      <div
        v-else-if="block.type === 'reset' && (showSave || showReset)"
        class="reset-row"
        :style="delay(idx)"
      >
        <button v-if="showSave" class="save-diary-btn" @click="$emit('save')">
          Guardar en diario
        </button>
        <button v-if="showReset" class="reset-btn" @click="$emit('reset')">
          Hacer otra consulta
        </button>
      </div>

    </template>
  </article>
</template>

<style scoped>
.narrative {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 2rem 0 3rem;
  display: flex;
  flex-direction: column;
}

.narrative > * {
  animation: narrative-appear 0.5s ease both;
}

.ornament {
  text-align: center;
  color: var(--ornament-color);
  font-size: 1rem;
  letter-spacing: 0.3em;
  margin: 1.25rem 0;
  user-select: none;
}

.prose {
  font-family: var(--font-prose);
  font-size: 1.0625rem;
  line-height: var(--prose-line-height);
  color: var(--color-text);
  margin-bottom: 1.75rem;
}

.transition-label {
  font-family: var(--font-prose);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.verse-block {
  margin: 0.25rem 0 1.75rem 0;
  padding-left: 1.75rem;
  border-left: var(--verse-border);
}

.verse-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  line-height: var(--verse-line-height);
  color: var(--verse-text-color);
  quotes: none;
  margin: 0 0 0.5rem 0;
}

.verse-ref {
  display: block;
  font-style: normal;
  font-size: 0.8125rem;
  color: var(--color-accent-mid);
  letter-spacing: 0.05em;
}

.closing {
  font-family: var(--font-prose);
  font-style: italic;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  padding-top: 1.75rem;
  margin-top: 0.25rem;
}

.reset-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding-top: 0.5rem;
}

.save-diary-btn {
  font-size: 0.8125rem;
  color: var(--color-accent);
  background: none;
  border: 1px solid rgba(225, 237, 224, 0.22);
  border-radius: 0.5rem;
  padding: 0.375rem 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-diary-btn:hover {
  background: rgba(225, 237, 224, 0.06);
  border-color: var(--color-accent);
}

.reset-btn {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.reset-btn:hover {
  color: var(--color-accent);
}
</style>
