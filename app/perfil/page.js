import Link from 'next/link'
import AppNav from '@/components/app-nav'
import { createClient } from '@/lib/supabase/server'
import { updateStudyProfile } from './actions'
import { logout } from '@/app/login/actions'

export const dynamic = 'force-dynamic'

function daysUntil(dateString) {
  if (!dateString) return null
  const target = new Date(`${dateString}T12:00:00`)
  return Math.ceil((target-new Date())/86400000)
}

export default async function ProfilePage({ searchParams }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data:claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const { data:profile } = await supabase.from('profiles').select('full_name,email,daily_goal,exam_date').eq('id',claims.sub).maybeSingle()
  const days = daysUntil(profile?.exam_date)

  return <main className="shell app-shell">
    <header className="topbar app-topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>PERFIL</h1><small>SUAS PREFERÊNCIAS DE ESTUDO</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Início</Link></header>
    <AppNav />

    <section className="profile-layout">
      <div className="card profile-card">
        <div className="eyebrow">PLANO PESSOAL</div><h2>Configure sua meta</h2><p className="muted">Esses dados ajustam o dashboard e ajudam a organizar sua reta final.</p>
        {query?.salvo === '1' && <div className="success-note">✓ Preferências salvas.</div>}
        <form action={updateStudyProfile}>
          <div className="field"><label>Nome</label><input name="full_name" defaultValue={profile?.full_name || ''} placeholder="Seu nome" /></div>
          <div className="field"><label>E-mail</label><input value={claims.email || profile?.email || ''} disabled /></div>
          <div className="field"><label>Meta diária de cards</label><select name="daily_goal" defaultValue={String(profile?.daily_goal || 50)}><option value="20">20 cards</option><option value="30">30 cards</option><option value="50">50 cards</option><option value="80">80 cards</option><option value="100">100 cards</option><option value="150">150 cards</option></select></div>
          <div className="field"><label>Data da prova</label><input type="date" name="exam_date" defaultValue={profile?.exam_date || ''} /></div>
          <button className="btn btn-primary" type="submit">SALVAR PREFERÊNCIAS</button>
        </form>
      </div>

      <div className="profile-side">
        <div className="card countdown-card"><div className="eyebrow">RETA FINAL</div><b>{days === null ? '—' : days >= 0 ? days : 0}</b><span>{days === null ? 'Defina a data da prova' : 'dias para a prova'}</span><p className="muted">Com a data preenchida, o dashboard passa a mostrar sua contagem regressiva.</p><Link className="btn btn-ghost" href="/estudar/reta-final-50">ABRIR RETA FINAL</Link></div>
        <div className="card account-card"><div className="eyebrow">CONTA</div><h3>{claims.email}</h3><p className="muted">Seu progresso, revisões e favoritos ficam vinculados a este acesso.</p><form action={logout}><button className="btn btn-ghost" type="submit">SAIR DA CONTA</button></form></div>
      </div>
    </section>
  </main>
}
