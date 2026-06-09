const VERSION = 'v2'
const PREFIX = 'rhema_cache'

export const TTL = {
  profile: 30 * 60 * 1000,
  diary:   10 * 60 * 1000,
}

function key(name) { return `${PREFIX}_${VERSION}_${name}` }

export function cacheGet(name) {
  try {
    const raw = localStorage.getItem(key(name))
    if (!raw) return null
    const { value, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key(name))
      return null
    }
    return value
  } catch {
    return null
  }
}

export function cacheSet(name, value, ttl = TTL.profile) {
  try {
    localStorage.setItem(key(name), JSON.stringify({ value, expiresAt: Date.now() + ttl }))
  } catch {}
}

export function cacheDelete(name) {
  try { localStorage.removeItem(key(name)) } catch {}
}
