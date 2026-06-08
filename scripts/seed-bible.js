import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const SPANISH_NAMES = {
  gn: 'Génesis', ex: 'Éxodo', lv: 'Levítico', nm: 'Números', dt: 'Deuteronomio',
  js: 'Josué', jg: 'Jueces', ru: 'Rut', '1sm': '1 Samuel', '2sm': '2 Samuel',
  '1kgs': '1 Reyes', '2kgs': '2 Reyes', '1ch': '1 Crónicas', '2ch': '2 Crónicas',
  ezr: 'Esdras', ne: 'Nehemías', et: 'Ester', job: 'Job', ps: 'Salmos',
  prv: 'Proverbios', ec: 'Eclesiastés', so: 'Cantares', is: 'Isaías',
  jr: 'Jeremías', lm: 'Lamentaciones', ez: 'Ezequiel', dn: 'Daniel',
  ho: 'Oseas', jl: 'Joel', am: 'Amós', ob: 'Abdías', jn: 'Jonás',
  mc: 'Miqueas', na: 'Nahúm', hk: 'Habacuc', zp: 'Sofonías', hg: 'Hageo',
  zc: 'Zacarías', ml: 'Malaquías', mt: 'Mateo', mk: 'Marcos', lk: 'Lucas',
  jo: 'Juan', act: 'Hechos', rm: 'Romanos', '1co': '1 Corintios',
  '2co': '2 Corintios', gl: 'Gálatas', eph: 'Efesios', ph: 'Filipenses',
  cl: 'Colosenses', '1ts': '1 Tesalonicenses', '2ts': '2 Tesalonicenses',
  '1tm': '1 Timoteo', '2tm': '2 Timoteo', tt: 'Tito', phm: 'Filemón',
  hb: 'Hebreos', jm: 'Santiago', '1pe': '1 Pedro', '2pe': '2 Pedro',
  '1jo': '1 Juan', '2jo': '2 Juan', '3jo': '3 Juan', jd: 'Judas', rv: 'Apocalipsis',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const EMBED_BATCH = 20
const INSERT_BATCH = 100
const DELAY_MS = 100

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getEmbeddings(texts) {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts })
  return res.data.map(d => d.embedding)
}

async function main() {
  const raw = JSON.parse(readFileSync(join(__dirname, 'rvr1960.json'), 'utf-8').replace(/^﻿/, ''))

  // Flatten to rows
  const verses = []
  for (const book of raw) {
    const bookName = SPANISH_NAMES[book.abbrev] ?? book.name
    book.chapters.forEach((chapter, chIdx) => {
      chapter.forEach((text, vIdx) => {
        const chNum = chIdx + 1
        const vNum = vIdx + 1
        verses.push({
          book: bookName,
          chapter: chNum,
          verse_number: vNum,
          text,
          reference: `${bookName} ${chNum}:${vNum}`,
        })
      })
    })
  }

  console.log(`Total versículos: ${verses.length}`)

  let processed = 0
  let insertBuffer = []

  for (let i = 0; i < verses.length; i += EMBED_BATCH) {
    const batch = verses.slice(i, i + EMBED_BATCH)
    const texts = batch.map(v => `${v.reference} — ${v.text}`)

    let embeddings
    try {
      embeddings = await getEmbeddings(texts)
    } catch (err) {
      console.warn(`Reintentando batch ${i} tras error: ${err.message}`)
      await sleep(2000)
      embeddings = await getEmbeddings(texts)
    }

    for (let j = 0; j < batch.length; j++) {
      insertBuffer.push({ ...batch[j], embedding: embeddings[j] })
    }

    if (insertBuffer.length >= INSERT_BATCH) {
      const { error } = await supabase.from('verses').insert(insertBuffer)
      if (error) { console.error('Error al insertar:', error.message); process.exit(1) }
      processed += insertBuffer.length
      insertBuffer = []
      console.log(`Progreso: ${processed}/${verses.length} (${Math.round(processed / verses.length * 100)}%)`)
    }

    await sleep(DELAY_MS)
  }

  if (insertBuffer.length > 0) {
    const { error } = await supabase.from('verses').insert(insertBuffer)
    if (error) { console.error('Error al insertar:', error.message); process.exit(1) }
    processed += insertBuffer.length
  }

  console.log(`\nSeed completado: ${processed} versículos insertados.`)
}

main()
