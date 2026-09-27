'use client'
import { useState } from 'react'

export default function FlashcardPlayer({ cards, demo = false }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
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

  if (!cards?.length) return <div className="empty">Nenhum flashcard cadastrado neste assunto ainda.</div>
  if (done) return <div className="empty"><h3>Revisão concluída 🎯</h3><p>Os resultados ficam prontos para alimentar a próxima revisão.</p><button className="btn btn-primary" onClick={()=>{setIndex(0);setRevealed(false);setDone(false)}}>RECOMEÇAR</button></div>

  return <div>
    <div className="flash-top"><span>{demo ? 'DEMONSTRAÇÃO' : 'SESSÃO DE ESTUDO'}</span><span>Card {index + 1} de {cards.length}</span></div>
    <div className="flash" onClick={() => setRevealed(true)}>
      <div className="eyebrow">{revealed ? 'RESPOSTA' : 'PERGUNTA'}</div>
      {revealed ? <><div className="answer">{card.back}</div><div className="reference">{card.reference}</div></> : <><h2>{card.front}</h2><button className="btn btn-primary" onClick={(e)=>{e.stopPropagation();setRevealed(true)}}>MOSTRAR RESPOSTA</button></>}
    </div>
    {revealed && <div className="rating-row">
      <button className="rate again" onClick={()=>rate('again')}>❌ ERREI</button>
      <button className="rate hard" onClick={()=>rate('hard')}>😐 DIFÍCIL</button>
      <button className="rate know" onClick={()=>rate('know')}>✅ SEI</button>
    </div>}
  </div>
}
