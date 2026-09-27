import Link from 'next/link'
import FlashcardPlayer from '@/components/flashcard-player'
import AppNav from '@/components/app-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TITLES = {
  revisao:'Revisão do dia',
  erros:'Revisar erros',
  favoritos:'Meus favoritos',
  novos:'Novos cards',
  'pontos-fracos':'Pontos fracos'
}

function normalizeCard(c) {
  if (!c) return null
  if (c.flashcards) {
    const f = c.flashcards
    return {
      id:f.id, front:f.front, back:f.back, reference:f.reference,
      difficulty:f.difficulty,
      topic_name:f.topics?.name || '',
      subject_name:f.topics?.subjects?.name || '',
      priority_weight:Number(f.topics?.priority_weight || 3)
    }
  }
  return {...c, priority_weight:Number(c.priority_weight || 3)}
}

export default async function StudyPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  let cards = []
  let title = TITLES[slug] || 'Sessão de estudo'
  let subtitle = 'Fila personalizada para o seu momento de estudo.'
  let mode = slug

  if (slug === 'favoritos') {
    const { data } = await supabase.from('favorites')
      .select('flashcard_id,flashcards(id,front,back,reference,difficulty,topics(name,priority_weight,subjects(name)))')
      .limit(150)
    cards = (data || []).map(normalizeCard).filter(Boolean)
    subtitle = 'Cards que você marcou para voltar quando quiser.'
  } else {
    let requested = 50
    let topicSlug = null

    if (slug.startsWith('reta-final-')) {
      requested = Math.min(100, Math.max(10, Number(slug.split('-').pop()) || 50))
      mode = 'reta-final'
      title = `Reta final • ${requested} cards`
      subtitle = 'Alta incidência, erros e conteúdo ainda não visto aparecem primeiro.'
    } else if (!Object.hasOwn(TITLES,slug)) {
      mode = 'topic'
      topicSlug = slug
      requested = 100
    } else if (slug === 'erros' || slug === 'pontos-fracos') {
      requested = 100
    }

    const { data } = await supabase.rpc('get_study_cards', {
      p_mode:mode,
      p_limit:requested,
      p_topic_slug:topicSlug
    })
    cards = (data || []).map(normalizeCard).filter(Boolean)

    if (mode === 'topic' && cards[0]) {
      title = cards[0].topic_name || 'Assunto'
      subtitle = cards[0].subject_name || 'Estudo livre'
    }
    if (slug === 'revisao') subtitle = 'Cards vencidos, ordenados por prioridade e tempo de revisão.'
    if (slug === 'novos') subtitle = 'Conteúdo ainda não estudado, começando pelos tópicos mais importantes.'
    if (slug === 'erros') subtitle = 'Cards em que sua última resposta foi “Errei”.'
    if (slug === 'pontos-fracos') subtitle = 'O sistema combina erros, dificuldade e incidência em prova.'
  }

  const cardIds = cards.map(c=>c.id).filter(Boolean)
  let initialFavorites = []
  if (cardIds.length) {
    const { data: favs } = await supabase.from('favorites').select('flashcard_id').in('flashcard_id',cardIds)
    initialFavorites = (favs || []).map(f=>f.flashcard_id)
  }

  return <main className="flash-wrap smart-flash-wrap">
    <header className="topbar study-topbar"><div className="brand"><div className="bolt">⚡</div><div><h1>{title}</h1><small>{subtitle}</small></div></div><Link className="btn btn-ghost" href="/estudar">← Modos</Link></header>
    <AppNav />
    {slug.startsWith('reta-final-') && <div className="reta-options"><span>Quantidade:</span>{[10,20,50,100].map(n=><Link className={`tag ${slug===`reta-final-${n}`?'selected':''}`} href={`/estudar/reta-final-${n}`} key={n}>{n} cards</Link>)}</div>}
    <FlashcardPlayer cards={cards} initialFavorites={initialFavorites}/>
  </main>
}
