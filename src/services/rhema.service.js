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

export async function detectEmotion(concern) {
  return callFunction('detect-emotion', { concern })
}

export async function searchVerses(concern, themes = []) {
  const { verses } = await callFunction('search-verses', { query: concern, themes })
  return verses
}

export async function generateWord(concern, verses, emotionContext, userName) {
  return callFunction('generate-word', { concern, verses, emotionContext, userName: userName || undefined })
}
