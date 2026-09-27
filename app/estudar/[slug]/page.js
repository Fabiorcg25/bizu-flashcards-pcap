import Link from 'next/link'
import FlashcardPlayer from '@/components/flashcard-player'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StudyPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  let cards = []
  let title = 'Revisão do dia'

  if (slug === 'revisao') {
    const now = new Date().toISOString()
    const { data: reviews } = await supabase.from('reviews').select('flashcard_id,flashcards(id,front,back,reference)').lte('next_review_at',now).limit(50)
    cards = (reviews||[]).map(r=>r.flashcards).filter(Boolean)
  } else {
    const { data: topic } = await supabase.from('topics').select('id,name').eq('slug',slug).maybeSingle()
    if (topic) {
      title = topic.name
      const { data } = await supabase.from('flashcards').select('id,front,back,reference').eq('topic_id',topic.id).eq('active',true).limit(100)
      cards = data || []
    }
  }

  return <main className="flash-wrap"><div className="topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>{title}</h1><small>BIZU FLASHCARDS</small></div></div><Link className="btn btn-ghost" href="/dashboard">← Sair</Link></div><FlashcardPlayer cards={cards}/></main>
}
