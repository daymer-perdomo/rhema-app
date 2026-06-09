import { supabase } from '@/services/supabase'

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, plan, plan_status, plan_expires_at, full_name, created_at')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateFullName(fullName) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
  if (error) throw new Error(error.message)
}

export async function getProfileStats(userId) {
  if (!userId) return null
  const now       = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endDate   = now.toISOString().split('T')[0]

  const [diaryRes, questionsRes] = await Promise.all([
    supabase.from('diaries').select('id').eq('user_id', userId).limit(1),
    supabase.from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'question'),
  ])

  const diaryId       = diaryRes.data?.[0]?.id ?? localStorage.getItem('rhema_diary_id')
  const questionsCount = questionsRes.count ?? 0

  let monthEntries = []
  if (diaryId) {
    const { data } = await supabase
      .from('entries')
      .select('emotion, entry_date')
      .eq('diary_id', diaryId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
    monthEntries = data ?? []
  }

  return { questionsCount, monthEntries }
}

export async function getAppConfig(key) {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return null
  return data?.value ?? null
}
