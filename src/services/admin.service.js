import { supabase } from '@/services/supabase'

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, plan, plan_status, plan_expires_at, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateProfile(userId, updates) {
  const allowed = ['role', 'plan', 'plan_status', 'plan_expires_at']
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )
  const { error } = await supabase
    .from('profiles')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/perfil`,
  })
  if (error) throw new Error(error.message)
}

// ─── Usage stats ──────────────────────────────────────────────────────────────

export async function getUserStats() {
  const { data, error } = await supabase
    .from('usage_events')
    .select('user_id, event_type, tokens_input, tokens_output, emotion, created_at')
  if (error) throw new Error(error.message)

  const map = {}
  for (const e of data ?? []) {
    if (!map[e.user_id]) {
      map[e.user_id] = {
        user_id:        e.user_id,
        questions:      0,
        diary_saves:    0,
        tokens_total:   0,
        emotions:       {},
        last_active:    null,
      }
    }
    const s = map[e.user_id]
    if (e.event_type === 'question')    s.questions++
    if (e.event_type === 'diary_save')  s.diary_saves++
    s.tokens_total += (e.tokens_input ?? 0) + (e.tokens_output ?? 0)
    if (e.emotion) s.emotions[e.emotion] = (s.emotions[e.emotion] ?? 0) + 1
    if (!s.last_active || e.created_at > s.last_active) s.last_active = e.created_at
  }
  return map
}

export async function getUserEventHistory(userId) {
  const { data, error } = await supabase
    .from('usage_events')
    .select('event_type, tokens_input, tokens_output, emotion, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── App config ───────────────────────────────────────────────────────────────

export async function getConfig(key) {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return null
  return data?.value ?? null
}

export async function setConfig(key, value) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user?.id })
  if (error) throw new Error(error.message)
}

// ─── Post image upload ────────────────────────────────────────────────────────

export async function uploadPostImage(file) {
  const ext  = file.name.split('.').pop()
  const path = `homepage-post.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('app-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('app-assets').getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  await setConfig('homepage_post_url', publicUrl)
  return publicUrl
}
