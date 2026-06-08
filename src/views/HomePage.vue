<script setup>
import { useWordOfGod } from '@/composables/useWordOfGod'
import ConcernInput from '@/components/bible/ConcernInput.vue'
import NarrativeResponse from '@/components/bible/NarrativeResponse.vue'

const { loading, error, result, askWord, reset } = useWordOfGod()
</script>

<template>
  <div class="min-h-screen bg-rhema-dark text-rhema-text flex flex-col">

    <!-- Navbar -->
    <nav class="px-8 py-5 flex items-center justify-between border-b border-rhema-border">
      <span class="text-xl font-semibold tracking-wide text-rhema-gold">Rhema</span>
      <span class="text-xs text-rhema-muted hidden sm:block">La Palabra viva para tu momento</span>
    </nav>

    <!-- Main -->
    <main class="flex-1 flex flex-col items-center px-4 py-16 gap-12">

      <!-- Hero — oculto cuando hay resultado -->
      <Transition name="fade">
        <div v-if="!result" class="text-center max-w-xl">
          <h1 class="text-4xl font-bold mb-4 text-white leading-tight">
            ¿Qué dice la<br />
            <span class="text-rhema-gold">Palabra del Señor</span>?
          </h1>
          <p class="text-rhema-muted text-lg">
            Comparte lo que hay en tu corazón y recibe una palabra viva de las Escrituras.
          </p>
        </div>
      </Transition>

      <!-- Input -->
      <div class="w-full max-w-2xl">
        <Transition name="fade">
          <ConcernInput
            v-if="!result"
            :loading="loading"
            @submit="askWord"
          />
        </Transition>

        <!-- Error -->
        <Transition name="fade">
          <div
            v-if="error"
            class="bg-rhema-surface border border-rhema-border rounded-2xl p-6 text-center"
          >
            <p class="text-rhema-muted mb-4">{{ error }}</p>
            <button
              class="text-sm text-rhema-gold hover:text-rhema-gold-light transition-colors"
              @click="reset"
            >
              Intentar de nuevo
            </button>
          </div>
        </Transition>

        <!-- Loading skeleton -->
        <Transition name="fade">
          <div v-if="loading" class="flex flex-col gap-4">
            <div class="h-4 bg-rhema-surface rounded-full w-3/4 animate-pulse" />
            <div class="h-32 bg-rhema-surface rounded-2xl animate-pulse" />
            <div class="h-32 bg-rhema-surface rounded-2xl animate-pulse" />
            <div class="h-32 bg-rhema-surface rounded-2xl animate-pulse" />
          </div>
        </Transition>

        <!-- Resultado -->
        <Transition name="fade">
          <NarrativeResponse
            v-if="result && !loading"
            :intro="result.intro"
            :cards="result.cards"
            :closing="result.closing"
            @reset="reset"
          />
        </Transition>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-6 text-center text-xs text-rhema-muted border-t border-rhema-border">
      Rhema · Búsqueda semántica en la Biblia RVR1960
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
