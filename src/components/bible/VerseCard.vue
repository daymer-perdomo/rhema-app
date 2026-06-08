<script setup>
defineProps({
  verse: { type: String, required: true },
  reference: { type: String, required: true },
  reflection: { type: String, required: true },
})
</script>

<template>
  <article class="bg-rhema-surface border border-rhema-border rounded-2xl p-6 flex flex-col gap-4">
    <header class="flex items-center gap-3">
      <div class="w-1 h-8 bg-rhema-gold rounded-full flex-shrink-0" />
      <span class="text-rhema-gold text-sm font-semibold tracking-wide">{{ reference }}</span>
    </header>

    <blockquote class="font-serif italic text-rhema-text text-base leading-relaxed pl-4 border-l border-rhema-border">
      "{{ verse }}"
    </blockquote>

    <p class="text-rhema-muted text-sm leading-relaxed">
      {{ reflection }}
    </p>
  </article>
</template>
