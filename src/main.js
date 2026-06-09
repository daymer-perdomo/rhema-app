import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import router          from './router'
import App             from './App.vue'
import './styles/main.css'

// Capture beforeinstallprompt before Vue mounts — the event fires during
// page load and would be missed by any onMounted listener.
window.__pwaPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaPrompt = e
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
