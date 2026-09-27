'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect('/login')
  if (claims?.app_metadata?.role !== 'admin') redirect('/dashboard')
  return { supabase, claims }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function createTopic(formData) {
  const { supabase } = await requireAdmin()
  const subjectId = String(formData.get('subject_id') || '')
  const name = String(formData.get('name') || '').trim()
  const orderIndex = Number(formData.get('order_index') || 0)
  if (!subjectId || !name) return
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2,7)}`
  const { error } = await supabase.from('topics').insert({ subject_id: subjectId, name, slug, order_index: orderIndex })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function createFlashcard(formData) {
  const { supabase } = await requireAdmin()
  const topicId = String(formData.get('topic_id') || '')
  const front = String(formData.get('front') || '').trim()
  const back = String(formData.get('back') || '').trim()
  const reference = String(formData.get('reference') || '').trim() || null
  const difficulty = Number(formData.get('difficulty') || 2)
  if (!topicId || !front || !back) return
  const { error } = await supabase.from('flashcards').insert({ topic_id: topicId, front, back, reference, difficulty })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateFlashcard(formData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const topicId = String(formData.get('topic_id') || '')
  const front = String(formData.get('front') || '').trim()
  const back = String(formData.get('back') || '').trim()
  const reference = String(formData.get('reference') || '').trim() || null
  const difficulty = Math.min(3, Math.max(1, Number(formData.get('difficulty') || 2)))
  const active = String(formData.get('active') || '') === 'true'
  if (!id || !topicId || !front || !back) return
  const { error } = await supabase.from('flashcards').update({ topic_id: topicId, front, back, reference, difficulty, active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  redirect('/admin?tab=flashcards')
}

export async function toggleFlashcard(formData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const nextActive = String(formData.get('active') || '') === 'true'
  if (!id) return
  const { error } = await supabase.from('flashcards').update({ active: nextActive }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function setUserAccess(formData) {
  const { supabase } = await requireAdmin()
  const userId = String(formData.get('user_id') || '')
  const active = String(formData.get('active') || '') === 'true'
  if (!userId) return
  const { error } = await supabase.from('access_grants').upsert({
    user_id: userId,
    product_code: 'pcap_oficial_investigador_2026',
    active,
    expires_at: null
  }, { onConflict: 'user_id,product_code' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

function parseCsv(text) {
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i+1] === '"') { cell += '"'; i++ }
      else quoted = !quoted
    } else if (ch === ',' && !quoted) { row.push(cell); cell = '' }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i+1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(v => String(v).trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(v => String(v).trim() !== '')) rows.push(row)
  if (!rows.length) return []
  const headers = rows.shift().map(h => h.trim().toLowerCase())
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])))
}

export async function importFlashcards(formData) {
  const { supabase } = await requireAdmin()
  const file = formData.get('file')
  if (!file || typeof file.text !== 'function') return
  const rows = parseCsv(await file.text())
  if (!rows.length) return

  const { data: subjects } = await supabase.from('subjects').select('id,slug,name')
  const subjectMap = new Map()
  for (const s of subjects || []) {
    subjectMap.set(String(s.slug).toLowerCase(), s)
    subjectMap.set(String(s.name).toLowerCase(), s)
  }

  const { data: topicsExisting } = await supabase.from('topics').select('id,subject_id,name,slug')
  const topicMap = new Map((topicsExisting || []).map(t => [`${t.subject_id}::${t.name.toLowerCase()}`, t]))

  for (const r of rows) {
    const subjectKey = (r.disciplina || r.subject || '').toLowerCase()
    const topicName = (r.assunto || r.topic || '').trim()
    const front = r.frente || r.front || ''
    const back = r.verso || r.back || ''
    if (!subjectKey || !topicName || !front || !back) continue
    const subject = subjectMap.get(subjectKey)
    if (!subject) continue

    const tkey = `${subject.id}::${topicName.toLowerCase()}`
    let topic = topicMap.get(tkey)
    if (!topic) {
      const { data: created, error } = await supabase.from('topics').insert({
        subject_id: subject.id,
        name: topicName,
        slug: `${slugify(topicName)}-${Math.random().toString(36).slice(2,7)}`,
        order_index: 0
      }).select('id,subject_id,name,slug').single()
      if (error) throw new Error(error.message)
      topic = created
      topicMap.set(tkey, topic)
    }

    const { error } = await supabase.from('flashcards').insert({
      topic_id: topic.id,
      front,
      back,
      reference: r.referencia || r.reference || null,
      difficulty: Math.min(3, Math.max(1, Number(r.dificuldade || r.difficulty || 2)))
    })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) throw new Error(error.message)
  }
  revalidatePath('/admin')
}
