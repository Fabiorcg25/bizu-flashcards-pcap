import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppNav from '@/components/app-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function priorityLabel(weight) {
  if (Number(weight) >= 4) return ['ALTA INCIDÊNCIA','high']
  if (Number(weight) === 3) return ['MÉDIA','medium']
  return ['BASE','base']
}

export default async function SubjectPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  const [{ data: subject }, { data: topics }] = await Promise.all([
    supabase.from('subjects').select('id,name,slug,question_count').eq('slug',slug).maybeSingle(),
    supabase.rpc('get_topic_stats',{p_subject_slug:slug})
  ])
  if (!subject) notFound()

  const rows = topics || []
  const total = rows.reduce((n,t)=>n+Number(t.card_count||0),0)
  const seen = rows.reduce((n,t)=>n+Number(t.seen_count||0),0)
  const mastered = rows.reduce((n,t)=>n+Number(t.mastered_count||0),0)
  const errors = rows.reduce((n,t)=>n+Number(t.error_count||0),0)
  const progress = total ? Math.round(mastered/total*100) : 0

  return <main className="shell app-shell">
    <header className="topbar app-topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>{subject.name}</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Início</Link></header>
    <AppNav />

    <section className="card subject-summary">
      <div><div className="eyebrow">PROGRESSO DA DISCIPLINA</div><h2>{progress}% dominado</h2><p className="muted">{seen} de {total} cards vistos • {mastered} dominados • {errors} erros atuais</p></div>
      <div className="subject-summary-kpis"><div><b>{subject.question_count}</b><span>questões no edital</span></div><div><b>{total}</b><span>flashcards</span></div><div><b>{rows.length}</b><span>assuntos</span></div></div>
      <div className="progress"><span style={{width:`${progress}%`}} /></div>
    </section>

    <div className="section-title"><div><div className="eyebrow">ASSUNTOS PRIORIZADOS</div><h3>Estude primeiro o que mais importa</h3></div><span className="tag">ORDENADO POR INCIDÊNCIA</span></div>
    <section className="topic-study-list">{rows.map(t=>{
      const [label,cls]=priorityLabel(t.priority_weight)
      return <Link className="topic-study-card" key={t.id} href={`/estudar/${t.slug}`}>
        <div className="topic-study-main"><div className="topic-title-row"><h4>{t.name}</h4><span className={`priority-badge ${cls}`}>{label}</span></div><small>{Number(t.seen_count||0)}/{Number(t.card_count||0)} vistos • {Number(t.mastered_count||0)} dominados • {Number(t.error_count||0)} erros</small><div className="progress"><span style={{width:`${Number(t.progress||0)}%`}} /></div></div>
        <div className="topic-study-progress"><b>{Number(t.progress||0)}%</b><span>ESTUDAR →</span></div>
      </Link>
    })}</section>
    {!rows.length && <div className="empty">Os assuntos desta disciplina ainda não foram importados.</div>}
  </main>
}
