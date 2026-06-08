import { supabase } from './supabase'

const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function callFunction(name, body) {
  const res = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error ?? `Error en ${name}`)
  }

  return res.json()
}

export async function searchVerses(concern) {
  const { verses } = await callFunction('search-verses', { query: concern })
  return verses
}

export async function generateWord(concern, verses) {
  return callFunction('generate-word', { concern, verses })
}
