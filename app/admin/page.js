import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createTopic, createFlashcard, importFlashcards } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/login')
  if (claims?.app_metadata?.role !== 'admin') redirect('/dashboard')

  const [{ data: subjects }, { data: topics }, { count: flashcardCount }] = await Promise.all([
    supabase.from('subjects').select('id,slug,name,order_index,question_count').order('order_index'),
    supabase.from('topics').select('id,name,subject_id,subjects(name)').order('name'),
    supabase.from('flashcards').select('*', { count: 'exact', head: true })
  ])

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="bolt">⚡</div><div><h1>BIZU ADMIN</h1><small>PC/AP 2026 • OFICIAL INVESTIGADOR</small></div></div>
      <Link className="btn btn-ghost" href="/dashboard">← Área do aluno</Link>
    </header>

    <section className="stats admin-stats">
      <div className="stat"><span className="muted">Disciplinas</span><b>{subjects?.length || 0}</b></div>
      <div className="stat"><span className="muted">Assuntos</span><b>{topics?.length || 0}</b></div>
      <div className="stat"><span className="muted">Flashcards</span><b>{flashcardCount || 0}</b></div>
      <div className="stat"><span className="muted">Produto</span><b style={{fontSize:16}}>OFICIAL INVESTIGADOR</b></div>
    </section>

    <section className="admin-grid">
      <div className="card">
        <div className="eyebrow">CONTEÚDO</div><h2>Novo assunto</h2>
        <form action={createTopic}>
          <div className="field"><label>Disciplina</label><select name="subject_id" required>{(subjects||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label>Nome do assunto</label><input name="name" required placeholder="Ex.: Aplicação da Lei Penal" /></div>
          <div className="field"><label>Ordem</label><input name="order_index" type="number" defaultValue="0" /></div>
          <button className="btn btn-primary" type="submit">Adicionar assunto</button>
        </form>
      </div>

      <div className="card">
        <div className="eyebrow">FLASHCARD</div><h2>Novo card</h2>
        <form action={createFlashcard}>
          <div className="field"><label>Assunto</label><select name="topic_id" required>{(topics||[]).map(t=><option key={t.id} value={t.id}>{t.subjects?.name} • {t.name}</option>)}</select></div>
          <div className="field"><label>Frente</label><textarea name="front" required rows="3" /></div>
          <div className="field"><label>Verso</label><textarea name="back" required rows="3" /></div>
          <div className="field"><label>Referência</label><input name="reference" placeholder="Ex.: CP, art. 121" /></div>
          <div className="field"><label>Dificuldade</label><select name="difficulty" defaultValue="2"><option value="1">1 — Fácil</option><option value="2">2 — Média</option><option value="3">3 — Difícil</option></select></div>
          <button className="btn btn-primary" type="submit">Salvar flashcard</button>
        </form>
      </div>
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="eyebrow">IMPORTAÇÃO EM MASSA</div><h2>Importar CSV</h2>
      <p className="muted">Cabeçalhos aceitos: <b>disciplina, assunto, frente, verso, referencia, dificuldade</b>. Se o assunto ainda não existir, ele será criado automaticamente.</p>
      <form action={importFlashcards}>
        <div className="field"><label>Arquivo CSV</label><input name="file" type="file" accept=".csv,text/csv" required /></div>
        <button className="btn btn-primary" type="submit">Importar flashcards</button>
      </form>
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="eyebrow">ESTRUTURA ATUAL</div><h2>Assuntos cadastrados</h2>
      {!topics?.length ? <div className="empty">Nenhum assunto cadastrado ainda.</div> : <div className="admin-list">{topics.map(t=><div key={t.id}><strong>{t.subjects?.name}</strong><span>{t.name}</span></div>)}</div>}
    </section>
  </main>
}
