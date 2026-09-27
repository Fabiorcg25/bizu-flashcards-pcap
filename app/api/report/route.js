import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['conteudo','desatualizado','duplicado','texto','outro'])

export async function POST(request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error:'Não autenticado' }, { status:401 })

  const body = await request.json()
  const flashcardId = String(body.flashcardId || '')
  const reason = ALLOWED.has(String(body.reason || '')) ? String(body.reason) : 'outro'
  const details = String(body.details || '').trim().slice(0,1500) || null
  if (!flashcardId) return NextResponse.json({ error:'Flashcard inválido' }, { status:400 })

  const { error } = await supabase.from('flashcard_reports').insert({
    user_id:userId,
    flashcard_id:flashcardId,
    reason,
    details
  })

  if (error) return NextResponse.json({ error:'Não foi possível registrar o relato.' }, { status:400 })
  return NextResponse.json({ ok:true })
}
