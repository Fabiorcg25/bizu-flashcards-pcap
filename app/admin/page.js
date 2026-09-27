import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createTopic, createFlashcard, importFlashcards, updateFlashcard, toggleFlashcard, setUserAccess } from './actions'

export const dynamic = 'force-dynamic'

const TABS = [
  ['overview','Visão geral','▦'],
  ['flashcards','Flashcards','◫'],
  ['topics','Assuntos','≡'],
  ['users','Usuários','◎'],
  ['import','Importar CSV','⇧']
]

function tabHref(tab) { return `/admin?tab=${tab}` }

export default async function AdminPage({ searchParams }) {
  const params = await searchParams
  const tab = TABS.some(([id]) => id === params?.tab) ? params.tab : 'overview'
  const q = String(params?.q || '').trim()
  const subjectFilter = String(params?.subject || '')
  const page = Math.max(1, Number(params?.page || 1))
  const editId = String(params?.edit || '')
  const pageSize = 24

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/login')
  if (claims?.app_metadata?.role !== 'admin') redirect('/dashboard')

  const [subjectsRes, topicsRes, cardCountRes, profilesRes, grantsRes] = await Promise.all([
    supabase.from('subjects').select('id,slug,name,order_index,question_count').order('order_index'),
    supabase.from('topics').select('id,name,slug,subject_id,order_index,subjects(id,name,slug),flashcards(id,active)').order('order_index'),
    supabase.from('flashcards').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id,email,full_name,daily_goal,created_at').order('created_at', { ascending: false }),
    supabase.from('access_grants').select('user_id,product_code,active,expires_at').eq('product_code','pcap_oficial_investigador_2026')
  ])

  const subjects = subjectsRes.data || []
  const topics = topicsRes.data || []
  const profiles = profilesRes.data || []
  const grants = grantsRes.data || []
  const grantMap = new Map(grants.map(g => [g.user_id, g]))
  const users = profiles.map(p => ({ ...p, access: grantMap.get(p.id) || null }))

  const coverage = subjects.map(s => {
    const st = topics.filter(t => t.subject_id === s.id)
    const cards = st.reduce((n,t) => n + (t.flashcards?.length || 0), 0)
    const active = st.reduce((n,t) => n + (t.flashcards || []).filter(f => f.active).length, 0)
    return { ...s, topics: st.length, cards, active }
  })

  let cards = []
  let cardsCount = cardCountRes.count || 0
  if (tab === 'flashcards') {
    let query = supabase.from('flashcards')
      .select('id,front,back,reference,difficulty,active,created_at,topic_id,topics(id,name,subject_id,subjects(id,name,slug))', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (subjectFilter) {
      const ids = topics.filter(t => t.subject_id === subjectFilter).map(t => t.id)
      if (ids.length) query = query.in('topic_id', ids)
      else query = query.eq('topic_id', '00000000-0000-0000-0000-000000000000')
    }
    if (q) {
      const clean = q.replace(/[,%()]/g, ' ')
      query = query.or(`front.ilike.%${clean}%,back.ilike.%${clean}%,reference.ilike.%${clean}%`)
    }
    const from = (page - 1) * pageSize
    const { data, count } = await query.range(from, from + pageSize - 1)
    cards = data || []
    cardsCount = count || 0
  }

  let editingCard = null
  if (editId) {
    const { data } = await supabase.from('flashcards').select('id,topic_id,front,back,reference,difficulty,active').eq('id', editId).maybeSingle()
    editingCard = data || null
  }

  const filteredTopics = topics.filter(t => {
    if (subjectFilter && t.subject_id !== subjectFilter) return false
    if (q && !`${t.name} ${t.subjects?.name || ''}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })
  const topicPageSize = 36
  const topicStart = (page - 1) * topicPageSize
  const visibleTopics = filteredTopics.slice(topicStart, topicStart + topicPageSize)

  const totalPages = Math.max(1, Math.ceil((tab === 'flashcards' ? cardsCount : filteredTopics.length) / (tab === 'flashcards' ? pageSize : topicPageSize)))

  return <main className="shell admin-shell">
    <header className="topbar admin-topbar">
      <div className="brand"><div className="bolt">⚡</div><div><h1>BIZU ADMIN</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div>
      <div className="admin-top-actions"><span className="status-dot">● ONLINE</span><Link className="btn btn-ghost" href="/dashboard">Área do aluno →</Link></div>
    </header>

    <nav className="admin-tabs">
      {TABS.map(([id,label,icon]) => <Link key={id} href={tabHref(id)} className={`admin-tab ${tab===id?'active':''}`}><span>{icon}</span>{label}</Link>)}
    </nav>

    {tab === 'overview' && <>
      <section className="admin-kpis">
        <div className="kpi"><span>DISCIPLINAS</span><b>{subjects.length}</b><small>estrutura oficial</small></div>
        <div className="kpi"><span>ASSUNTOS</span><b>{topics.length}</b><small>itens do edital</small></div>
        <div className="kpi"><span>FLASHCARDS</span><b>{cardCountRes.count || 0}</b><small>cadastrados</small></div>
        <div className="kpi"><span>USUÁRIOS</span><b>{users.length}</b><small>{users.filter(u=>u.access?.active).length} com acesso ativo</small></div>
      </section>

      <section className="card admin-section-card">
        <div className="admin-section-head"><div><div className="eyebrow">COBERTURA DO EDITAL</div><h2>Conteúdo por disciplina</h2></div><Link className="btn btn-primary" href="/admin?tab=flashcards">+ NOVO FLASHCARD</Link></div>
        <div className="coverage-table">
          <div className="coverage-row coverage-head"><span>Disciplina</span><span>Questões</span><span>Assuntos</span><span>Cards ativos</span><span>Cobertura</span></div>
          {coverage.map(s => {
            const target = Math.max(1, s.question_count * 20)
            const pct = Math.min(100, Math.round((s.active / target) * 100))
            return <div className="coverage-row" key={s.id}>
              <div><strong>{s.name}</strong><small>{s.cards} cards totais</small></div><span>{s.question_count}</span><span>{s.topics}</span><span>{s.active}</span>
              <div className="coverage-progress"><div><i style={{width:`${pct}%`}} /></div><small>{pct}%</small></div>
            </div>
          })}
        </div>
      </section>

      <section className="admin-grid admin-overview-grid">
        <div className="card"><div className="eyebrow">ATALHO</div><h2>Adicionar flashcard</h2><p className="muted">Cadastre um card manualmente e ele já entra no aplicativo.</p><Link className="btn btn-primary" href="/admin?tab=flashcards">CRIAR CARD</Link></div>
        <div className="card"><div className="eyebrow">LOTE</div><h2>Importação em massa</h2><p className="muted">Envie um CSV e distribua dezenas ou centenas de cards por disciplina e assunto.</p><Link className="btn btn-ghost" href="/admin?tab=import">IMPORTAR CSV</Link></div>
      </section>
    </>}

    {tab === 'flashcards' && <>
      <section className="admin-grid admin-editor-grid">
        <div className="card admin-form-card">
          <div className="eyebrow">{editingCard ? 'EDITAR FLASHCARD' : 'NOVO FLASHCARD'}</div><h2>{editingCard ? 'Editar card selecionado' : 'Adicionar conteúdo'}</h2>
          <form action={editingCard ? updateFlashcard : createFlashcard}>
            {editingCard && <input type="hidden" name="id" value={editingCard.id} />}
            <div className="field"><label>Assunto</label><select name="topic_id" required defaultValue={editingCard?.topic_id || topics[0]?.id}>{topics.map(t=><option key={t.id} value={t.id}>{t.subjects?.name} • {t.name}</option>)}</select></div>
            <div className="field"><label>Frente</label><textarea name="front" required rows="4" defaultValue={editingCard?.front || ''} placeholder="Pergunta, conceito ou comando do flashcard" /></div>
            <div className="field"><label>Verso</label><textarea name="back" required rows="4" defaultValue={editingCard?.back || ''} placeholder="Resposta objetiva e didática" /></div>
            <div className="field"><label>Referência</label><input name="reference" defaultValue={editingCard?.reference || ''} placeholder="Ex.: CF, art. 5º, XI" /></div>
            <div className="form-row"><div className="field"><label>Dificuldade</label><select name="difficulty" defaultValue={String(editingCard?.difficulty || 2)}><option value="1">Fácil</option><option value="2">Média</option><option value="3">Difícil</option></select></div>{editingCard && <div className="field"><label>Status</label><select name="active" defaultValue={editingCard.active ? 'true':'false'}><option value="true">Ativo</option><option value="false">Pausado</option></select></div>}</div>
            <div className="cta-row"><button className="btn btn-primary" type="submit">{editingCard ? 'SALVAR ALTERAÇÕES' : 'SALVAR FLASHCARD'}</button>{editingCard && <Link className="btn btn-ghost" href="/admin?tab=flashcards">Cancelar</Link>}</div>
          </form>
        </div>

        <div className="card admin-side-info"><div className="eyebrow">BASE ATUAL</div><h2>{cardCountRes.count || 0} flashcards</h2><p className="muted">Use os filtros abaixo para localizar cards, revisar referências e pausar conteúdos sem apagar o histórico.</p><div className="mini-metrics"><div><b>{coverage.reduce((n,s)=>n+s.active,0)}</b><span>ativos</span></div><div><b>{Math.max(0,(cardCountRes.count||0)-coverage.reduce((n,s)=>n+s.active,0))}</b><span>pausados</span></div></div></div>
      </section>

      <section className="card admin-section-card">
        <div className="admin-section-head"><div><div className="eyebrow">GERENCIAR CARDS</div><h2>Biblioteca de flashcards</h2></div><span className="tag">{cardsCount} RESULTADOS</span></div>
        <form className="admin-filters" method="GET"><input type="hidden" name="tab" value="flashcards"/><input name="q" defaultValue={q} placeholder="Buscar pergunta, resposta ou referência..."/><select name="subject" defaultValue={subjectFilter}><option value="">Todas as disciplinas</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="btn btn-ghost" type="submit">FILTRAR</button></form>
        <div className="flashcard-admin-list">
          {cards.map(c => <article className="flashcard-admin-item" key={c.id}><div className="flashcard-admin-main"><div className="flashcard-meta"><span className={`status-badge ${c.active?'active':'paused'}`}>{c.active?'ATIVO':'PAUSADO'}</span><span>{c.topics?.subjects?.name}</span><span>•</span><span>{c.topics?.name}</span></div><strong>{c.front}</strong><p>{c.back}</p><small>{c.reference || 'Sem referência'} • dificuldade {c.difficulty}</small></div><div className="flashcard-admin-actions"><Link className="btn btn-ghost btn-small" href={`/admin?tab=flashcards&edit=${c.id}`}>Editar</Link><form action={toggleFlashcard}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="active" value={c.active?'false':'true'}/><button className="btn btn-ghost btn-small" type="submit">{c.active?'Pausar':'Ativar'}</button></form></div></article>)}
          {!cards.length && <div className="empty">Nenhum flashcard encontrado com esses filtros.</div>}
        </div>
        <Pagination tab="flashcards" page={page} total={totalPages} q={q} subject={subjectFilter}/>
      </section>
    </>}

    {tab === 'topics' && <>
      <section className="admin-grid admin-editor-grid">
        <div className="card admin-form-card"><div className="eyebrow">NOVO ASSUNTO</div><h2>Adicionar tópico do edital</h2><form action={createTopic}><div className="field"><label>Disciplina</label><select name="subject_id" required>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="field"><label>Nome do assunto</label><input name="name" required placeholder="Ex.: Prisão em flagrante" /></div><div className="field"><label>Ordem</label><input name="order_index" type="number" defaultValue="0" /></div><button className="btn btn-primary" type="submit">ADICIONAR ASSUNTO</button></form></div>
        <div className="card admin-side-info"><div className="eyebrow">ESTRUTURA</div><h2>{topics.length} assuntos</h2><p className="muted">O edital está dividido em itens menores para facilitar a cobertura e a revisão por blocos.</p></div>
      </section>
      <section className="card admin-section-card"><div className="admin-section-head"><div><div className="eyebrow">ASSUNTOS CADASTRADOS</div><h2>Estrutura do edital</h2></div><span className="tag">{filteredTopics.length} RESULTADOS</span></div><form className="admin-filters" method="GET"><input type="hidden" name="tab" value="topics"/><input name="q" defaultValue={q} placeholder="Buscar assunto..."/><select name="subject" defaultValue={subjectFilter}><option value="">Todas as disciplinas</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="btn btn-ghost" type="submit">FILTRAR</button></form><div className="topic-table">{visibleTopics.map(t=><div key={t.id}><div><strong>{t.name}</strong><small>{t.subjects?.name}</small></div><span>{t.flashcards?.length || 0} cards</span></div>)}</div><Pagination tab="topics" page={page} total={totalPages} q={q} subject={subjectFilter}/></section>
    </>}

    {tab === 'users' && <section className="card admin-section-card"><div className="admin-section-head"><div><div className="eyebrow">CLIENTES E ACESSOS</div><h2>Usuários cadastrados</h2></div><span className="tag">{users.length} USUÁRIOS</span></div><div className="users-table"><div className="users-row users-head"><span>Usuário</span><span>Perfil</span><span>Acesso PC/AP</span><span>Ação</span></div>{users.map(u => { const isAdmin = u.id === claims.sub || u.email === 'bizupremium@gmail.com'; const active = Boolean(u.access?.active); return <div className="users-row" key={u.id}><div><strong>{u.full_name || 'Usuário'}</strong><small>{u.email || 'E-mail não sincronizado'}</small></div><span>{isAdmin ? <b className="role-admin">ADMIN</b> : 'Aluno'}</span><span className={`access-label ${active?'on':'off'}`}>{active?'ATIVO':'BLOQUEADO'}</span><div>{isAdmin ? <span className="muted">Protegido</span> : <form action={setUserAccess}><input type="hidden" name="user_id" value={u.id}/><input type="hidden" name="active" value={active?'false':'true'}/><button className="btn btn-ghost btn-small" type="submit">{active?'Bloquear':'Liberar'}</button></form>}</div></div>})}</div></section>}

    {tab === 'import' && <section className="admin-grid import-layout"><div className="card admin-form-card"><div className="eyebrow">IMPORTAÇÃO EM MASSA</div><h2>Importar flashcards por CSV</h2><p className="muted">Envie um arquivo com os cabeçalhos <b>disciplina, assunto, frente, verso, referencia, dificuldade</b>. Assuntos inexistentes são criados automaticamente.</p><form action={importFlashcards}><div className="upload-zone"><div className="upload-icon">⇧</div><strong>Selecione seu arquivo CSV</strong><span>Ideal para lotes grandes de conteúdo</span><input name="file" type="file" accept=".csv,text/csv" required /></div><button className="btn btn-primary" type="submit">IMPORTAR FLASHCARDS</button></form></div><div className="card admin-side-info"><div className="eyebrow">MODELO</div><h2>Estrutura recomendada</h2><pre className="csv-preview">disciplina,assunto,frente,verso,referencia,dificuldade{`\n`}penal,Homicídio,Qual é o núcleo?,Matar alguém,CP art. 121,1</pre><a className="btn btn-ghost" href="/modelo_importacao_flashcards.csv" download>BAIXAR MODELO CSV</a><div className="import-tips"><span>1 = fácil</span><span>2 = média</span><span>3 = difícil</span></div></div></section>}

    <div className="footer">BIZU PREMIUM • PAINEL ADMINISTRATIVO • PC/AP 2026</div>
  </main>
}

function Pagination({ tab, page, total, q, subject }) {
  if (total <= 1) return null
  const url = (p) => `/admin?tab=${tab}&page=${p}${q?`&q=${encodeURIComponent(q)}`:''}${subject?`&subject=${encodeURIComponent(subject)}`:''}`
  return <div className="pagination"><Link className={`btn btn-ghost btn-small ${page<=1?'disabled':''}`} href={page<=1?'#':url(page-1)}>← Anterior</Link><span>Página <b>{page}</b> de {total}</span><Link className={`btn btn-ghost btn-small ${page>=total?'disabled':''}`} href={page>=total?'#':url(page+1)}>Próxima →</Link></div>
}
