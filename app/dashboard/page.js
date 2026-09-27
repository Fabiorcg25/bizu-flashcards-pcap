import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard-shell'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TZ = 'America/Belem'
function dateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date(date))
  const get = (t) => parts.find(p=>p.type===t)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
function addDays(key, delta) {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate()+delta)
  return d.toISOString().slice(0,10)
}
function streakFromEvents(events) {
  const dates = new Set((events||[]).map(e=>dateKey(e.reviewed_at)))
  if (!dates.size) return 0
  const today = dateKey(new Date())
  let cursor = dates.has(today) ? today : addDays(today,-1)
  if (!dates.has(cursor)) return 0
  let streak = 0
  while (dates.has(cursor)) { streak++; cursor = addDays(cursor,-1) }
  return streak
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/login')

  const { data: access } = await supabase.from('access_grants').select('active,expires_at').eq('user_id', claims.sub).eq('product_code','pcap_oficial_investigador_2026').maybeSingle()
  const valid = access?.active && (!access.expires_at || new Date(access.expires_at) > new Date())
  if (!valid) return <main className="login-wrap"><section className="login-card"><div className="brand"><div className="bolt">⚡</div><div><h1 style={{margin:0}}>BIZU FLASHCARDS</h1><small>PC/AP • OFICIAL INVESTIGADOR</small></div></div><h1>Acesso não liberado</h1><p className="muted">Seu login está correto, mas este usuário ainda não possui acesso ativo ao produto PC/AP Oficial Investigador.</p></section></main>

  const since = new Date(Date.now() - 1000*60*60*24*45).toISOString()
  const [subjectsRes,reviewsRes,eventsRes,profileRes,favoritesRes] = await Promise.all([
    supabase.from('subjects').select('id,slug,name,order_index,question_count,topics(id,flashcards(id,active))').order('order_index'),
    supabase.from('reviews').select('flashcard_id,rating,next_review_at,last_reviewed_at'),
    supabase.from('review_events').select('reviewed_at,rating,flashcard_id').gte('reviewed_at',since).order('reviewed_at',{ascending:false}),
    supabase.from('profiles').select('daily_goal').eq('id',claims.sub).maybeSingle(),
    supabase.from('favorites').select('flashcard_id', { count:'exact', head:true })
  ])

  const reviews = reviewsRes.data || []
  const reviewMap = new Map(reviews.map(r=>[r.flashcard_id,r]))
  const subjects = (subjectsRes.data || []).map(s => {
    const cards = (s.topics||[]).flatMap(t=>t.flashcards||[]).filter(c=>c.active)
    const mastered = cards.filter(c=>reviewMap.get(c.id)?.rating==='know').length
    return { ...s, count:cards.length, progress:cards.length ? Math.round((mastered/cards.length)*100) : 0 }
  })

  const now = new Date()
  const today = dateKey(now)
  const events = eventsRes.data || []
  const metrics = {
    dailyGoal: profileRes.data?.daily_goal || 50,
    studiedToday: events.filter(e=>dateKey(e.reviewed_at)===today).length,
    due: reviews.filter(r=>new Date(r.next_review_at)<=now).length,
    mastered: reviews.filter(r=>r.rating==='know').length,
    errors: reviews.filter(r=>r.rating==='again').length,
    streak: streakFromEvents(events),
    favorites: favoritesRes.count || 0
  }

  return <DashboardShell subjects={subjects} email={claims.email || ''} metrics={metrics} />
}
