import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const flashcardId = String(body.flashcardId || '')
  const rating = String(body.rating || '')
  if (!flashcardId || !['again','hard','know'].includes(rating)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const now = new Date()
  const next = new Date(now)
  if (rating === 'again') next.setMinutes(next.getMinutes() + 10)
  if (rating === 'hard') next.setDate(next.getDate() + 1)
  if (rating === 'know') next.setDate(next.getDate() + 3)

  const { error } = await supabase.from('reviews').upsert({
    user_id: userId,
    flashcard_id: flashcardId,
    rating,
    last_reviewed_at: now.toISOString(),
    next_review_at: next.toISOString()
  }, { onConflict: 'user_id,flashcard_id' })

  if (error) return NextResponse.json({ error: 'Não foi possível registrar a revisão.' }, { status: 400 })
  return NextResponse.json({ ok: true, nextReviewAt: next.toISOString() })
}
