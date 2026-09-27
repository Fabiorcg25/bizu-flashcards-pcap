import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const flashcardId = String(body.flashcardId || '')
  const favorite = Boolean(body.favorite)
  if (!flashcardId) return NextResponse.json({ error: 'Flashcard inválido' }, { status: 400 })

  if (favorite) {
    const { error } = await supabase.from('favorites').upsert({ user_id: userId, flashcard_id: flashcardId }, { onConflict: 'user_id,flashcard_id' })
    if (error) return NextResponse.json({ error: 'Não foi possível favoritar.' }, { status: 400 })
  } else {
    const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('flashcard_id', flashcardId)
    if (error) return NextResponse.json({ error: 'Não foi possível remover dos favoritos.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, favorite })
}
