<script setup>
import VerseCard from './VerseCard.vue'

defineProps({
  intro: { type: String, required: true },
  cards: { type: Array, required: true },
  closing: { type: String, required: true },
})

defineEmits(['reset'])
</script>

<template>
  <section class="flex flex-col gap-6 animate-fade-in">
    <p class="text-rhema-text text-base leading-relaxed">{{ intro }}</p>

    <div class="flex flex-col gap-4">
      <VerseCard
        v-for="(card, i) in cards"
        :key="i"
        :verse="card.verse"
        :reference="card.reference"
        :reflection="card.reflection"
        :style="{ animationDelay: `${i * 80}ms` }"
        class="animate-fade-in"
      />
    </div>

    <p class="text-rhema-text text-base leading-relaxed border-t border-rhema-border pt-6">
      {{ closing }}
    </p>

    <div class="flex justify-center pt-2">
      <button
        class="text-sm text-rhema-muted hover:text-rhema-gold transition-colors duration-200"
        @click="$emit('reset')"
      >
        Hacer otra consulta
      </button>
    </div>
  </section>
</template>
