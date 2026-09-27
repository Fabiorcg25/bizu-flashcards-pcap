import Link from 'next/link'

export default function DashboardShell({ subjects, demo = false, email = '' }) {
  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="bolt">⚡</div><div><h1>BIZU FLASHCARDS</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div>
      <div className="pill">{demo ? 'MODO DEMONSTRAÇÃO' : email || 'ÁREA DO ALUNO'}</div>
    </header>

    <section className="hero">
      <div className="card hero-card">
        <div className="eyebrow">REVISÃO INTELIGENTE</div>
        <h2>Seu edital, transformado em revisão diária.</h2>
        <p className="muted">Estude por disciplina, marque o que errou e deixe o sistema organizar o que precisa voltar para sua revisão.</p>
        <div className="cta-row">
          <Link className="btn btn-primary" href={demo ? '/demo?estudar=1' : '/estudar/revisao'}>▶ COMEÇAR REVISÃO</Link>
          <Link className="btn btn-ghost" href="#disciplinas">📚 VER DISCIPLINAS</Link>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><span className="muted">Meta de hoje</span><b>50</b><small className="muted">cards</small></div>
        <div className="stat"><span className="muted">Revisões</span><b>24</b><small className="muted">pendentes</small></div>
        <div className="stat"><span className="muted">Sequência</span><b>🔥 6</b><small className="muted">dias</small></div>
        <div className="stat"><span className="muted">Dominados</span><b>438</b><small className="muted">cards</small></div>
      </div>
    </section>

    <section className="quick">
      <div className="card"><strong>🧠 Revisão do dia</strong><span className="muted">Fila programada</span></div>
      <div className="card"><strong>❌ Revisar erros</strong><span className="muted">Prioridade máxima</span></div>
      <div className="card"><strong>⭐ Favoritos</strong><span className="muted">Sua seleção</span></div>
      <div className="card"><strong>🚨 Reta final</strong><span className="muted">10, 20, 50 ou 100 cards</span></div>
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
