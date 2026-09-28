import Image from 'next/image'
import Link from 'next/link'
import AppNav from '@/components/app-nav'

function daysUntil(dateString) {
  if (!dateString) return null
  const target = new Date(`${dateString}T12:00:00`)
  const now = new Date()
  const diff = Math.ceil((target - now) / 86400000)
  return Number.isFinite(diff) ? diff : null
}

export default function DashboardShell({ subjects, demo = false, email = '', metrics = null, profile = {}, weakTopics = [], prioritySubject = null, isAdmin = false }) {
  const m = metrics || { dailyGoal:50, studiedToday:0, due:0, mastered:0, errors:0, streak:0, favorites:0, unseen:0, accuracy:0 }
  const goalPct = Math.min(100, Math.round((m.studiedToday / Math.max(1,m.dailyGoal))*100))
  const totalCards = subjects.reduce((n,s)=>n+(s.count||0),0)
  const totalMastered = subjects.reduce((n,s)=>n+(s.mastered||0),0)
  const overall = totalCards ? Math.round((totalMastered/totalCards)*100) : 0
  const firstName = (profile?.full_name || email || 'Aluno').split(' ')[0]
  const days = daysUntil(profile?.exam_date)
  const weak = weakTopics?.[0]

  return <main className="shell app-shell">
    <header className="topbar app-topbar">
      <div className="brand"><div className="bolt">⚡</div><div><h1>BIZU FLASHCARDS</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div>
      <div className="top-actions">
        {isAdmin && !demo && <Link className="admin-link" href="/admin">⚙ Admin</Link>}
        <div className="pill">{demo ? 'MODO DEMONSTRAÇÃO' : email || 'ÁREA DO ALUNO'}</div>
      </div>
    </header>

    {!demo && <AppNav />}

    <section className="hero smart-hero">
      <div className="card hero-card">
        <div className="hero-card-header">
          <div className="eyebrow">PLANO DE ESTUDO INTELIGENTE</div>
          <div className="pcap-emblem" aria-label="Polícia Civil do Amapá">
            <Image
              src="/policia-civil-ap.png"
              alt="Brasão da Polícia Civil do Amapá"
              width={180}
              height={180}
              className="pcap-emblem-image"
              priority
            />
            <div className="pcap-emblem-text">
              <strong>PC/AP 2026</strong>
              <span>OFICIAL INVESTIGADOR</span>
            </div>
          </div>
        </div>
        <h2>Olá, {firstName}. Sua revisão de hoje já está priorizada.</h2>
        <p className="muted">O sistema combina incidência em prova, erros recentes e tempo desde a última revisão para montar sua próxima fila.</p>
        <div className="daily-progress"><div><span>Meta diária</span><b>{m.studiedToday}/{m.dailyGoal} cards</b></div><div className="progress"><span style={{width:`${goalPct}%`}} /></div></div>
        <div className="cta-row">
          <Link className="btn btn-primary" href={demo ? '/demo?estudar=1' : '/estudar/revisao'}>▶ CONTINUAR REVISÃO</Link>
          <Link className="btn btn-ghost" href={demo ? '/demo?estudar=1' : '/estudar/novos'}>＋ NOVOS CARDS</Link>
        </div>
        <div className="hero-insights">
          {weak ? <div><span>PONTO FRACO</span><b>{weak.topic_name}</b><small>{weak.subject_name} • {weak.accuracy}% de acerto</small></div> : <div><span>PONTO FRACO</span><b>Aguardando dados</b><small>Estude alguns cards para o sistema detectar padrões.</small></div>}
          {prioritySubject && <div><span>PRIORIDADE DE HOJE</span><b>{prioritySubject.name}</b><small>{prioritySubject.progress}% dominado • {prioritySubject.question_count} questões no edital</small></div>}
          <div><span>PROVA</span><b>{days === null ? 'Defina a data' : days >= 0 ? `${days} dias` : 'Data passada'}</b><small>{days === null ? 'Configure em Perfil para ativar a reta final automática.' : 'Use o Modo Reta Final para acelerar a revisão.'}</small></div>
        </div>
      </div>

      <div className="stats smart-stats">
        <div className="stat"><span className="muted">Revisões pendentes</span><b>{m.due}</b><small className="muted">cards vencidos</small></div>
        <div className="stat"><span className="muted">Novos</span><b>{m.unseen}</b><small className="muted">ainda não vistos</small></div>
        <div className="stat"><span className="muted">Precisão</span><b>{m.accuracy}%</b><small className="muted">respostas “Sei”</small></div>
        <div className="stat"><span className="muted">Sequência</span><b>🔥 {m.streak}</b><small className="muted">dias</small></div>
        <div className="stat wide"><span className="muted">Domínio geral</span><b>{overall}%</b><small className="muted">{m.mastered} de {totalCards} cards dominados</small><div className="progress"><span style={{width:`${overall}%`}} /></div></div>
      </div>
    </section>

    <section className="quick study-modes">
      <Link href={demo?'/demo?estudar=1':'/estudar/revisao'} className="card quick-link"><strong>🧠 Revisão do dia</strong><span className="muted">{m.due} pendentes • prioridade automática</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/novos'} className="card quick-link"><strong>✨ Aprender novos</strong><span className="muted">Conteúdo ainda não estudado</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/pontos-fracos'} className="card quick-link"><strong>🎯 Pontos fracos</strong><span className="muted">Erros + assuntos de alta incidência</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/reta-final-50'} className="card quick-link"><strong>🚨 Reta final</strong><span className="muted">Prioriza prova, erros e não vistos</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/erros'} className="card quick-link"><strong>❌ Revisar erros</strong><span className="muted">{m.errors} cards com erro recente</span></Link>
      <Link href={demo?'/demo?estudar=1':'/estudar/favoritos'} className="card quick-link"><strong>⭐ Favoritos</strong><span className="muted">{m.favorites} cards salvos</span></Link>
    </section>

    <div className="section-title" id="disciplinas"><div><div className="eyebrow">COBERTURA DO EDITAL</div><h3>Disciplinas de Oficial Investigador</h3></div><span className="tag">13 DISCIPLINAS • {totalCards.toLocaleString('pt-BR')} CARDS</span></div>
    <section className="grid subject-grid">
      {subjects.map((s) => <Link key={s.slug} href={demo ? '/demo?estudar=1' : `/disciplinas/${s.slug}`} className="subject subject-card">
        <div className="subject-head"><div><h4>{s.name}</h4><small>{s.seen || 0}/{s.count || 0} vistos • {s.question_count || 0} questões no edital</small></div><b>{s.progress || 0}%</b></div>
        <div className="subject-meta"><span>{s.mastered || 0} dominados</span><span>{s.due || 0} revisões</span></div>
        <div className="progress"><span style={{width:`${s.progress || 0}%`}} /></div>
      </Link>)}
    </section>
    <div className="footer">BIZU PREMIUM • PC/AP 2026 • OFICIAL INVESTIGADOR</div>
  </main>
}
