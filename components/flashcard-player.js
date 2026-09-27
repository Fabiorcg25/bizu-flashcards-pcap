'use client'
import { useState } from 'react'

export default function FlashcardPlayer({ cards, demo = false, initialFavorites = [] }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [favorites, setFavorites] = useState(() => new Set(initialFavorites))
  const [savingFavorite, setSavingFavorite] = useState(false)
  const card = cards[index]

  async function rate(rating) {
    if (!demo && card?.id) {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: card.id, rating })
      })
    }
    if (index >= cards.length - 1) { setDone(true); return }
    setIndex(index + 1); setRevealed(false)
  }

  async function toggleFavorite() {
    if (demo || !card?.id || savingFavorite) return
    const next = !favorites.has(card.id)
    setSavingFavorite(true)
    const copy = new Set(favorites)
    if (next) copy.add(card.id); else copy.delete(card.id)
    setFavorites(copy)
    const res = await fetch('/api/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcardId: card.id, favorite: next })
    })
    if (!res.ok) {
      const rollback = new Set(copy)
      if (next) rollback.delete(card.id); else rollback.add(card.id)
      setFavorites(rollback)
    }
    setSavingFavorite(false)
  }

  if (!cards?.length) return <div className="empty"><h3>Nada pendente por aqui 🎯</h3><p>Quando houver cards para este modo de estudo, eles aparecerão nesta fila.</p></div>
  if (done) return <div className="empty"><h3>Sessão concluída 🎯</h3><p>Seu desempenho já foi salvo e alimentará as próximas revisões.</p><button className="btn btn-primary" onClick={()=>{setIndex(0);setRevealed(false);setDone(false)}}>RECOMEÇAR</button></div>

  const isFavorite = favorites.has(card.id)

  return <div>
    <div className="flash-top"><span>{demo ? 'DEMONSTRAÇÃO' : 'SESSÃO DE ESTUDO'}</span><span>Card {index + 1} de {cards.length}</span></div>
    {!demo && <div className="flash-actions-top"><button className={`favorite-btn ${isFavorite?'on':''}`} onClick={toggleFavorite} disabled={savingFavorite}>{isFavorite?'★ FAVORITO':'☆ FAVORITAR'}</button></div>}
    <div className="flash" onClick={() => setRevealed(true)}>
      <div className="eyebrow">{revealed ? 'RESPOSTA' : 'PERGUNTA'}</div>
      {revealed ? <><div className="answer">{card.back}</div><div className="reference">{card.reference || 'BIZU Premium'}</div></> : <><h2>{card.front}</h2><button className="btn btn-primary" onClick={(e)=>{e.stopPropagation();setRevealed(true)}}>MOSTRAR RESPOSTA</button></>}
    </div>
    {revealed && <div className="rating-row">
      <button className="rate again" onClick={()=>rate('again')}>❌ ERREI</button>
      <button className="rate hard" onClick={()=>rate('hard')}>😐 DIFÍCIL</button>
      <button className="rate know" onClick={()=>rate('know')}>✅ SEI</button>
    </div>}
  </div>
}
