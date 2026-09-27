import Link from 'next/link'
import AppNav from '@/components/app-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function pct(n,d){ return d ? Math.round((n/d)*100) : 0 }

export default async function PerformancePage() {
  const supabase = await createClient()
  const since = new Date(Date.now()-30*86400000).toISOString()
  const [subjectsRes,metricsRes,weakRes,eventsRes] = await Promise.all([
    supabase.rpc('get_dashboard_subject_stats'),
    supabase.rpc('get_dashboard_counts'),
    supabase.rpc('get_weak_topics',{p_limit:8}),
    supabase.from('review_events').select('rating,reviewed_at').gte('reviewed_at',since).order('reviewed_at')
  ])
  const subjects = subjectsRes.data || []
  const m = metricsRes.data?.[0] || {}
  const events = eventsRes.data || []
  const total = subjects.reduce((n,s)=>n+Number(s.card_count||0),0)
  const mastered = subjects.reduce((n,s)=>n+Number(s.mastered_count||0),0)
  const seen = subjects.reduce((n,s)=>n+Number(s.seen_count||0),0)
  const hard = events.filter(e=>e.rating==='hard').length
  const again = events.filter(e=>e.rating==='again').length
  const know = events.filter(e=>e.rating==='know').length

  return <main className="shell app-shell">
    <header className="topbar app-topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>DESEMPENHO</h1><small>PC/AP 2026 • SUA EVOLUÇÃO REAL</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Início</Link></header>
    <AppNav />

    <section className="performance-kpis">
      <div className="card"><span>DOMÍNIO GERAL</span><b>{pct(mastered,total)}%</b><small>{mastered} de {total} cards</small></div>
      <div className="card"><span>EDITAL VISTO</span><b>{pct(seen,total)}%</b><small>{seen} cards estudados</small></div>
      <div className="card"><span>PRECISÃO</span><b>{Number(m.accuracy||0)}%</b><small>histórico de respostas “Sei”</small></div>
      <div className="card"><span>ÚLTIMOS 30 DIAS</span><b>{events.length}</b><small>{know} sei • {hard} difícil • {again} errei</small></div>
    </section>

    <section className="performance-layout">
      <div className="card">
        <div className="eyebrow">POR DISCIPLINA</div><h2>Onde você está mais forte</h2>
        <div className="performance-list">{subjects.map(s=>{
          const progress=Number(s.progress||0)
          return <Link href={`/disciplinas/${s.slug}`} key={s.subject_id} className="performance-row"><div><strong>{s.name}</strong><small>{Number(s.seen_count||0)}/{Number(s.card_count||0)} vistos • {Number(s.due_count||0)} revisões</small></div><div className="performance-bar"><div className="progress"><span style={{width:`${progress}%`}} /></div><b>{progress}%</b></div></Link>
        })}</div>
      </div>

      <div className="card">
        <div className="eyebrow">PONTOS FRACOS</div><h2>O que merece voltar primeiro</h2>
        <div className="weak-list">{(weakRes.data||[]).map((w,i)=><Link href={`/estudar/${w.topic_slug}`} key={w.topic_id} className="weak-row"><span>{i+1}</span><div><strong>{w.topic_name}</strong><small>{w.subject_name} • {w.accuracy}% acerto • {w.error_events} erros</small></div><b>→</b></Link>)}</div>
        {!(weakRes.data||[]).length && <div className="empty">Estude alguns cards para o sistema identificar seus pontos fracos.</div>}
        <Link className="btn btn-primary full-btn" href="/estudar/pontos-fracos">TREINAR PONTOS FRACOS</Link>
      </div>
    </section>
  </main>
}
