'use client'

import { useEffect, useMemo, useState } from 'react'

function priorityInfo(weight) {
  const w = Number(weight || 3)
  if (w >= 4) return { label:'ALTA INCIDÊNCIA', cls:'high' }
  if (w === 3) return { label:'MÉDIA INCIDÊNCIA', cls:'medium' }
  return { label:'BASE DO EDITAL', cls:'base' }
}

export default function FlashcardPlayer({ cards, demo = false, initialFavorites = [] }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [favorites, setFavorites] = useState(() => new Set(initialFavorites))
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [rating, setRating] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('conteudo')
  const [reportDetails, setReportDetails] = useState('')
  const [reportState, setReportState] = useState('')
  const card = cards[index]
  const priority = useMemo(()=>priorityInfo(card?.priority_weight),[card?.priority_weight])
  const pct = cards?.length ? Math.round(((index + (done?1:0))/cards.length)*100) : 0

  async function rate(nextRating) {
    if (rating) return
    setRating(true)
    if (!demo && card?.id) {
      await fetch('/api/review', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({flashcardId:card.id,rating:nextRating})
      })
    }
    if (index >= cards.length - 1) {
      setDone(true)
      setRating(false)
      return
    }
    setIndex(v=>v+1)
    setRevealed(false)
    setReporting(false)
    setReportState('')
    setRating(false)
  }

  async function toggleFavorite() {
    if (demo || !card?.id || savingFavorite) return
    const next = !favorites.has(card.id)
    setSavingFavorite(true)
    const copy = new Set(favorites)
    if (next) copy.add(card.id); else copy.delete(card.id)
    setFavorites(copy)
    const res = await fetch('/api/favorite', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({flashcardId:card.id,favorite:next})
    })
    if (!res.ok) {
      const rollback = new Set(copy)
      if (next) rollback.delete(card.id); else rollback.add(card.id)
      setFavorites(rollback)
    }
    setSavingFavorite(false)
  }

  async function sendReport(e) {
    e.preventDefault()
    if (!card?.id || demo) return
    setReportState('sending')
    const res = await fetch('/api/report', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({flashcardId:card.id,reason:reportReason,details:reportDetails})
    })
    if (res.ok) {
      setReportState('sent')
      setReportDetails('')
      setTimeout(()=>setReporting(false),900)
    } else setReportState('error')
  }

  useEffect(()=>{
    const handler = (e) => {
      if (reporting || done || !card) return
      if (e.code === 'Space') { e.preventDefault(); setRevealed(true) }
      if (!revealed) return
      if (e.key === '1') rate('again')
      if (e.key === '2') rate('hard')
      if (e.key === '3') rate('know')
    }
    window.addEventListener('keydown',handler)
    return ()=>window.removeEventListener('keydown',handler)
  },[revealed,reporting,done,card,rating])

  if (!cards?.length) return <div className="empty smart-empty"><h3>Nada pendente por aqui 🎯</h3><p>Escolha outro modo de estudo ou volte mais tarde para novas revisões.</p></div>
  if (done) return <div className="empty smart-empty session-done"><div className="done-icon">✓</div><h3>Sessão concluída</h3><p>Suas respostas foram salvas e já influenciam as próximas revisões.</p><div className="cta-row"><button className="btn btn-primary" onClick={()=>{setIndex(0);setRevealed(false);setDone(false)}}>RECOMEÇAR</button><a className="btn btn-ghost" href="/dashboard">VER DESEMPENHO</a></div></div>

  const isFavorite = favorites.has(card.id)

  return <div className="smart-player">
    <div className="session-progress"><div><span>Card {index+1} de {cards.length}</span><b>{Math.round((index/cards.length)*100)}%</b></div><div className="progress"><span style={{width:`${Math.round((index/cards.length)*100)}%`}} /></div></div>

    <div className="flash-top smart-flash-top">
      <div className="card-context"><span>{card.subject_name || 'BIZU FLASHCARDS'}</span>{card.topic_name && <><i>›</i><span>{card.topic_name}</span></>}</div>
      <span className={`priority-badge ${priority.cls}`}>{priority.label}</span>
    </div>

    {!demo && <div className="flash-actions-top">
      <button className={`favorite-btn ${isFavorite?'on':''}`} onClick={toggleFavorite} disabled={savingFavorite}>{isFavorite?'★ FAVORITO':'☆ FAVORITAR'}</button>
      <button className="report-btn" onClick={()=>setReporting(v=>!v)}>⚑ REPORTAR</button>
    </div>}

    {reporting && <form className="report-box" onSubmit={sendReport}>
      <div><strong>Reportar este card</strong><button type="button" onClick={()=>setReporting(false)}>×</button></div>
      <select value={reportReason} onChange={e=>setReportReason(e.target.value)}>
        <option value="conteudo">Conteúdo possivelmente incorreto</option>
        <option value="desatualizado">Informação desatualizada</option>
        <option value="duplicado">Possível duplicidade</option>
        <option value="texto">Erro de texto ou clareza</option>
        <option value="outro">Outro</option>
      </select>
      <textarea rows="3" value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="Explique rapidamente o problema (opcional)." />
      <button className="btn btn-ghost btn-small" type="submit" disabled={reportState==='sending'}>{reportState==='sending'?'ENVIANDO...':reportState==='sent'?'✓ ENVIADO':'ENVIAR RELATO'}</button>
      {reportState==='error' && <small className="error-inline">Não foi possível enviar agora.</small>}
    </form>}

    <div className={`flash smart-flash ${revealed?'revealed':''}`} onClick={() => setRevealed(true)}>
      <div className="eyebrow">{revealed ? 'RESPOSTA' : 'PERGUNTA'}</div>
      {!revealed ? <>
        <h2>{card.front}</h2>
        <button className="btn btn-primary reveal-btn" onClick={(e)=>{e.stopPropagation();setRevealed(true)}}>MOSTRAR RESPOSTA</button>
        <small className="keyboard-hint">Espaço para revelar</small>
      </> : <>
        <div className="answer">{card.back}</div>
        <div className="reference">{card.reference || 'BIZU Premium'}</div>
      </>}
    </div>

    {revealed && <>
      <div className="rating-help"><span>Como foi?</span><small>1 = Errei • 2 = Difícil • 3 = Sei</small></div>
      <div className="rating-row">
        <button className="rate again" disabled={rating} onClick={()=>rate('again')}><b>❌ ERREI</b><small>volta em breve</small></button>
        <button className="rate hard" disabled={rating} onClick={()=>rate('hard')}><b>😐 DIFÍCIL</b><small>rever mais cedo</small></button>
        <button className="rate know" disabled={rating} onClick={()=>rate('know')}><b>✅ SEI</b><small>aumentar intervalo</small></button>
      </div>
    </>}
  </div>
}
