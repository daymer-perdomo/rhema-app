import { supabase } from '@/services/supabase'
import { encrypt, hashPassword } from '@/services/crypto.service'

export async function createDiary({ name = 'Mi Diario', password, userId }) {
  if (!userId) throw new Error('Debes iniciar sesión para crear tu diario.')
  const { data, error } = await supabase
    .from('diaries')
    .insert({ name, password_hash: hashPassword(password), user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function findDiaryByUser(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('diaries')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  if (error || !data?.length) return null
  return data[0]
}

export async function getDiary(diaryId) {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', diaryId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getEntry(id) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveEntry({ diaryId, password, title, rawContent, emotionContext, verses, narrative }) {
  const content_encrypted = encrypt(rawContent, password)
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('entries')
    .insert({
      diary_id: diaryId,
      title: title || null,
      content_encrypted,
      emotion: emotionContext?.emotion ?? null,
      category: emotionContext?.category ?? null,
      intensity: emotionContext?.intensity ?? null,
      themes: emotionContext?.themes ?? [],
      verses: verses ?? [],
      narrative: narrative ?? {},
      entry_date: today,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getEntries(diaryId, filters = {}) {
  let query = supabase
    .from('entries')
    .select('id, title, emotion, category, intensity, themes, verses, narrative, content_encrypted, entry_date, created_at')
    .eq('diary_id', diaryId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (filters.emotion)    query = query.eq('emotion', filters.emotion)
  if (filters.startDate)  query = query.gte('entry_date', filters.startDate)
  if (filters.endDate)    query = query.lte('entry_date', filters.endDate)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getEntriesByRange(diaryId, range = 'month') {
  const now = new Date()
  let startDate

  if (range === 'week') {
    const dow = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow))
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const startStr = startDate.toISOString().split('T')[0]
  const endStr   = now.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('entries')
    .select('id, emotion, intensity, entry_date')
    .eq('diary_id', diaryId)
    .gte('entry_date', startStr)
    .lte('entry_date', endStr)
    .order('entry_date', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function verifyPassword(diaryId, password) {
  const diary = await getDiary(diaryId)
  return diary.password_hash === hashPassword(password)
}
