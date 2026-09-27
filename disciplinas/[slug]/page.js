import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SubjectPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: subject } = await supabase.from('subjects').select('id,name,slug').eq('slug',slug).maybeSingle()
  if (!subject) notFound()
  const { data: topics } = await supabase.from('topics').select('id,name,slug,order_index,flashcards(id)').eq('subject_id',subject.id).order('order_index')
  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>{subject.name}</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Dashboard</Link></header>
    <div className="section-title"><div><div className="eyebrow">ASSUNTOS</div><h3>Escolha o bloco para revisar</h3></div></div>
    <section className="grid">{(topics||[]).map(t=><Link className="subject" key={t.id} href={`/estudar/${t.slug}`}><div className="subject-head"><div><h4>{t.name}</h4><small>{t.flashcards?.length||0} cards</small></div><span className="tag">ESTUDAR</span></div></Link>)}</section>
    {(!topics || topics.length===0) && <div className="empty">Os assuntos desta disciplina ainda não foram importados.</div>}
  </main>
}
