'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateStudyProfile(formData) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect('/login')

  const fullName = String(formData.get('full_name') || '').trim().slice(0,120)
  const dailyGoal = Math.min(200,Math.max(10,Number(formData.get('daily_goal') || 50)))
  const examDateRaw = String(formData.get('exam_date') || '').trim()
  const examDate = /^\d{4}-\d{2}-\d{2}$/.test(examDateRaw) ? examDateRaw : null

  const { error } = await supabase.from('profiles').upsert({
    id:claims.sub,
    email:claims.email || null,
    full_name:fullName || null,
    daily_goal:dailyGoal,
    exam_date:examDate
  },{onConflict:'id'})

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/perfil')
  redirect('/perfil?salvo=1')
}

export async function resetStudyProgress() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return { ok:false, error:'Não autenticado.' }

  const { data:result, error } = await supabase.rpc('reset_my_study_progress')
  if (error) return { ok:false, error:'Não foi possível zerar o progresso.' }

  revalidatePath('/dashboard')
  revalidatePath('/desempenho')
  revalidatePath('/estudar')
  revalidatePath('/perfil')

  return {
    ok:true,
    deletedReviewEvents:Number(result?.[0]?.deleted_review_events || 0),
    deletedReviews:Number(result?.[0]?.deleted_reviews || 0)
  }
}
