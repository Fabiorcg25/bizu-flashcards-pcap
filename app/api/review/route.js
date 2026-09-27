import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAY = 24 * 60 * 60 * 1000

function priorityFactor(priority) {
  if (priority >= 5) return 0.70
  if (priority === 4) return 0.85
  if (priority === 2) return 1.15
  if (priority <= 1) return 1.30
  return 1
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error:'Não autenticado' }, { status:401 })

  const body = await request.json()
  const flashcardId = String(body.flashcardId || '')
  const rating = String(body.rating || '')
  if (!flashcardId || !['again','hard','know'].includes(rating)) {
    return NextResponse.json({ error:'Dados inválidos' }, { status:400 })
  }

  const [{ data:current }, { data:card }] = await Promise.all([
    supabase.from('reviews').select('interval_days,ease_factor,repetitions,lapses').eq('user_id',userId).eq('flashcard_id',flashcardId).maybeSingle(),
    supabase.from('flashcards').select('id,topics(priority_weight)').eq('id',flashcardId).maybeSingle()
  ])
  if (!card) return NextResponse.json({ error:'Flashcard não encontrado' }, { status:404 })

  const now = new Date()
  const next = new Date(now)
  const priority = Number(card?.topics?.priority_weight || 3)
  const factor = priorityFactor(priority)
  let intervalDays = Number(current?.interval_days || 0)
  let easeFactor = Number(current?.ease_factor || 2.5)
  let repetitions = Number(current?.repetitions || 0)
  let lapses = Number(current?.lapses || 0)

  if (rating === 'again') {
    repetitions = 0
    lapses += 1
    intervalDays = 0
    easeFactor = Math.max(1.3,easeFactor-0.20)
    next.setMinutes(next.getMinutes()+10)
  } else if (rating === 'hard') {
    repetitions = Math.max(1,repetitions)
    easeFactor = Math.max(1.3,easeFactor-0.10)
    const base = intervalDays > 0 ? intervalDays*1.4 : 1
    intervalDays = Math.max(1,Math.round(base*factor))
    next.setTime(now.getTime()+intervalDays*DAY)
  } else {
    repetitions += 1
    easeFactor = Math.min(3.2,easeFactor+0.05)
    let base
    if (repetitions === 1) base = 2
    else if (repetitions === 2) base = 6
    else base = Math.max(2,intervalDays||2)*easeFactor
    intervalDays = Math.max(1,Math.round(base*factor))
    next.setTime(now.getTime()+intervalDays*DAY)
  }

  const { error:reviewError } = await supabase.from('reviews').upsert({
    user_id:userId,
    flashcard_id:flashcardId,
    rating,
    last_reviewed_at:now.toISOString(),
    next_review_at:next.toISOString(),
    interval_days:intervalDays,
    ease_factor:easeFactor,
    repetitions,
    lapses
  },{onConflict:'user_id,flashcard_id'})

  if (reviewError) return NextResponse.json({ error:'Não foi possível registrar a revisão.' }, { status:400 })

  const { error:eventError } = await supabase.from('review_events').insert({
    user_id:userId,
    flashcard_id:flashcardId,
    rating,
    reviewed_at:now.toISOString()
  })
  if (eventError) return NextResponse.json({ error:'Revisão salva, mas o histórico não pôde ser atualizado.' }, { status:400 })

  return NextResponse.json({ ok:true,nextReviewAt:next.toISOString(),intervalDays,priority })
}
