import Link from 'next/link'
import AppNav from '@/components/app-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StudyHub() {
  const supabase = await createClient()
  const { data: metricsRes } = await supabase.rpc('get_dashboard_counts')
  const m = metricsRes?.[0] || {}

  const modes = [
    ['/estudar/revisao','🧠','Revisão do dia',`${Number(m.due||0)} cards vencidos e priorizados`],
    ['/estudar/novos','✨','Novos cards',`${Number(m.unseen||0)} cards ainda não vistos`],
    ['/estudar/pontos-fracos','🎯','Pontos fracos','Volte ao que você erra e ao que mais cai'],
    ['/estudar/erros','❌','Erros recentes',`${Number(m.errors||0)} cards marcados como erro`],
    ['/estudar/favoritos','⭐','Favoritos',`${Number(m.favorites||0)} cards salvos`],
    ['/estudar/reta-final-50','🚨','Modo Reta Final','Alta incidência + erros + conteúdo não visto']
  ]

  return <main className="shell app-shell">
    <header className="topbar app-topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>ESTUDAR</h1><small>BIZU FLASHCARDS • PC/AP 2026</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Início</Link></header>
    <AppNav />
    <section className="card study-hub-hero"><div className="eyebrow">ESCOLHA O MODO</div><h2>Uma fila diferente para cada objetivo.</h2><p className="muted">A ordem dos cards leva em conta a incidência do assunto e o seu histórico de respostas.</p></section>
    <section className="study-hub-grid">{modes.map(([href,icon,title,desc])=><Link href={href} key={href} className="card mode-card"><span className="mode-icon">{icon}</span><div><h3>{title}</h3><p>{desc}</p></div><b>→</b></Link>)}</section>
    <div className="section-title"><div><div className="eyebrow">ESTUDO LIVRE</div><h3>Ou escolha uma disciplina</h3></div></div>
    <Link className="card free-study-link" href="/dashboard#disciplinas"><span>📚</span><div><b>Abrir disciplinas e assuntos</b><small>Escolha exatamente o tópico que deseja estudar.</small></div><strong>→</strong></Link>
  </main>
}
