import Link from 'next/link'
import FlashcardPlayer from '@/components/flashcard-player'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default async function StudyPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  let cards = []
  let title = 'Revisão do dia'

  if (slug === 'revisao') {
    const now = new Date().toISOString()
    const { data: reviews } = await supabase.from('reviews').select('flashcard_id,flashcards(id,front,back,reference)').lte('next_review_at',now).order('next_review_at').limit(50)
    cards = (reviews||[]).map(r=>r.flashcards).filter(Boolean)
  } else if (slug === 'erros') {
    title = 'Revisar erros'
    const { data: reviews } = await supabase.from('reviews').select('flashcard_id,flashcards(id,front,back,reference)').eq('rating','again').order('last_reviewed_at', { ascending: false }).limit(100)
    cards = (reviews||[]).map(r=>r.flashcards).filter(Boolean)
  } else if (slug === 'favoritos') {
    title = 'Meus favoritos'
    const { data: favorites } = await supabase.from('favorites').select('flashcard_id,flashcards(id,front,back,reference)').limit(100)
    cards = (favorites||[]).map(r=>r.flashcards).filter(Boolean)
  } else if (slug.startsWith('reta-final-')) {
    const requested = Math.min(100, Math.max(10, Number(slug.split('-').pop()) || 20))
    title = `Reta final • ${requested} cards`
    const { data } = await supabase.from('flashcards').select('id,front,back,reference').eq('active',true).limit(300)
    cards = shuffle(data || []).slice(0, requested)
  } else {
    const { data: topic } = await supabase.from('topics').select('id,name').eq('slug',slug).maybeSingle()
    if (topic) {
      title = topic.name
      const { data } = await supabase.from('flashcards').select('id,front,back,reference').eq('topic_id',topic.id).eq('active',true).limit(100)
      cards = data || []
    }
  }

  const cardIds = cards.map(c=>c.id).filter(Boolean)
  let initialFavorites = []
  if (cardIds.length) {
    const { data: favs } = await supabase.from('favorites').select('flashcard_id').in('flashcard_id',cardIds)
    initialFavorites = (favs || []).map(f=>f.flashcard_id)
  }

  return <main className="flash-wrap"><div className="topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>{title}</h1><small>BIZU FLASHCARDS</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Dashboard</Link></div>{slug.startsWith('reta-final-') && <div className="reta-options"><span>Quantidade:</span>{[10,20,50,100].map(n=><Link className={`tag ${slug===`reta-final-${n}`?'selected':''}`} href={`/estudar/reta-final-${n}`} key={n}>{n} cards</Link>)}</div>}<FlashcardPlayer cards={cards} initialFavorites={initialFavorites}/></main>
}
