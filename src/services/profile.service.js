import { supabase } from '@/services/supabase'

export async function getMyProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, plan, plan_status, plan_expires_at, full_name, created_at')
    .single()
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

export async function getAppConfig(key) {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return null
  return data?.value ?? null
}
