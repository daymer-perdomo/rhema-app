import { ref } from 'vue'
import {
  listUsers, updateProfile, sendPasswordReset,
  getUserStats, getUserEventHistory,
  getConfig, setConfig, uploadPostImage,
} from '@/services/admin.service'

export function useAdmin() {
  const users       = ref([])
  const statsMap    = ref({})
  const postUrl     = ref('')
  const loading     = ref(false)
  const saving      = ref(false)
  const errorMsg    = ref('')

  async function loadAll() {
    loading.value = true
    errorMsg.value = ''
    try {
      const [u, stats, url] = await Promise.all([
        listUsers(),
        getUserStats(),
        getConfig('homepage_post_url'),
      ])
      users.value    = u
      statsMap.value = stats
      postUrl.value  = url ?? ''
    } catch (e) {
      errorMsg.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveUser(userId, updates) {
    saving.value = true
    try {
      await updateProfile(userId, updates)
      const u = users.value.find(x => x.id === userId)
      if (u) Object.assign(u, updates)
    } finally {
      saving.value = false
    }
  }

  async function resetPassword(email) {
    await sendPasswordReset(email)
  }

  async function loadUserHistory(userId) {
    return getUserEventHistory(userId)
  }

  async function savePostImage(file) {
    saving.value = true
    try {
      const url = await uploadPostImage(file)
      postUrl.value = url
      return url
    } finally {
      saving.value = false
    }
  }

  async function savePostUrl(url) {
    saving.value = true
    try {
      await setConfig('homepage_post_url', url)
      postUrl.value = url
    } finally {
      saving.value = false
    }
  }

  return {
    users, statsMap, postUrl,
    loading, saving, errorMsg,
    loadAll, saveUser, resetPassword, loadUserHistory,
    savePostImage, savePostUrl,
  }
}
