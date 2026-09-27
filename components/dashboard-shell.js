import Link from 'next/link'

export default function DashboardShell({ subjects, demo = false, email = '', metrics = null }) {
  const m = metrics || { dailyGoal:50, studiedToday:0, due:0, mastered:0, errors:0, streak:0, favorites:0 }
  const goalPct = Math.min(100, Math.round((m.studiedToday / Math.max(1,m.dailyGoal))*100))
  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="bolt">⚡</div><div><h1>BIZU FLASHCARDS</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div>
      <div className="top-actions">{!demo && <Link className="admin-link" href="/admin">⚙ Admin</Link>}<div className="pill">{demo ? 'MODO DEMONSTRAÇÃO' : email || 'ÁREA DO ALUNO'}</div></div>
    </header>

    <section className="hero">
      <div className="card hero-card">
        <div className="eyebrow">REVISÃO INTELIGENTE</div>
        <h2>Seu edital, transformado em revisão diária.</h2>
        <p className="muted">Estude por disciplina, marque o que errou e deixe o sistema organizar o que precisa voltar para sua revisão.</p>
        <div className="daily-progress"><div><span>Meta diária</span><b>{m.studiedToday}/{m.dailyGoal} cards</b></div><div className="progress"><span style={{width:`${goalPct}%`}} /></div></div>
        <div className="cta-row">
          <Link className="btn btn-primary" href={demo ? '/demo?estudar=1' : '/estudar/revisao'}>▶ COMEÇAR REVISÃO</Link>
          <Link className="btn btn-ghost" href="#disciplinas">📚 VER DISCIPLINAS</Link>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><span className="muted">Estudados hoje</span><b>{m.studiedToday}</b><small className="muted">de {m.dailyGoal} cards</small></div>
        <div className="stat"><span className="muted">Revisões</span><b>{m.due}</b><small className="muted">pendentes</small></div>
        <div className="stat"><span className="muted">Sequência</span><b>🔥 {m.streak}</b><small className="muted">dias</small></div>
        <div className="stat"><span className="muted">Dominados</span><b>{m.mastered}</b><small className="muted">cards</small></div>
      </div>
    </section>

    <section className="quick">
      <Link href={demo?'/demo?estudar=1':'/estudar/revisao'} className="card quick-link"><strong>🧠 Revisão do dia</strong><span className="muted">{m.due} cards pendentes</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/erros'} className="card quick-link"><strong>❌ Revisar erros</strong><span className="muted">{m.errors} cards prioritários</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/favoritos'} className="card quick-link"><strong>⭐ Favoritos</strong><span className="muted">{m.favorites} cards salvos</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/reta-final-20'} className="card quick-link"><strong>🚨 Reta final</strong><span className="muted">10, 20, 50 ou 100 cards</span></Link>
    </section>

    <div className="section-title" id="disciplinas"><div><div className="eyebrow">CONTEÚDO</div><h3>Disciplinas de Oficial Investigador</h3></div><span className="tag">13 DISCIPLINAS • 80 QUESTÕES</span></div>
    <section className="grid">
      {subjects.map((s) => <Link key={s.slug} href={demo ? '/demo?estudar=1' : `/disciplinas/${s.slug}`} className="subject">
        <div className="subject-head"><div><h4>{s.name}</h4><small>{s.count || 0} cards • {s.question_count || 0} questões no edital</small></div><b>{s.progress || 0}%</b></div>
        <div className="progress"><span style={{width:`${s.progress || 0}%`}} /></div>
      </Link>)}
    </section>
    <div className="footer">BIZU PREMIUM • PC/AP 2026 • OFICIAL INVESTIGADOR</div>
  </main>
}
