import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard-shell'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TZ = 'America/Belem'
function dateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(new Date(date))
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

  const { data: access } = await supabase.from('access_grants')
    .select('active,expires_at')
    .eq('user_id', claims.sub)
    .eq('product_code','pcap_oficial_investigador_2026')
    .maybeSingle()

  const valid = access?.active && (!access.expires_at || new Date(access.expires_at) > new Date())
  if (!valid) return <main className="login-wrap"><section className="login-card"><div className="brand"><div className="bolt">⚡</div><div><h1 style={{margin:0}}>BIZU FLASHCARDS</h1><small>PC/AP • OFICIAL INVESTIGADOR</small></div></div><h1>Acesso não liberado</h1><p className="muted">Seu login está correto, mas este usuário ainda não possui acesso ativo ao produto PC/AP Oficial Investigador.</p></section></main>

  const since = new Date(Date.now() - 1000*60*60*24*60).toISOString()
  const [subjectsRes,metricsRes,eventsRes,profileRes,weakRes] = await Promise.all([
    supabase.rpc('get_dashboard_subject_stats'),
    supabase.rpc('get_dashboard_counts'),
    supabase.from('review_events').select('reviewed_at,rating').gte('reviewed_at',since).order('reviewed_at',{ascending:false}),
    supabase.from('profiles').select('full_name,daily_goal,exam_date').eq('id',claims.sub).maybeSingle(),
    supabase.rpc('get_weak_topics',{p_limit:5})
  ])

  const subjects = (subjectsRes.data || []).map(s=>({
    ...s,
    count:Number(s.card_count||0),
    seen:Number(s.seen_count||0),
    mastered:Number(s.mastered_count||0),
    due:Number(s.due_count||0),
    progress:Number(s.progress||0)
  }))

  const raw = metricsRes.data?.[0] || {}
  const metrics = {
    dailyGoal:Number(raw.daily_goal || profileRes.data?.daily_goal || 50),
    studiedToday:Number(raw.studied_today || 0),
    due:Number(raw.due || 0),
    mastered:Number(raw.mastered || 0),
    errors:Number(raw.errors || 0),
    favorites:Number(raw.favorites || 0),
    unseen:Number(raw.unseen || 0),
    accuracy:Number(raw.accuracy || 0),
    streak:streakFromEvents(eventsRes.data || [])
  }

  const prioritySubject = [...subjects]
    .sort((a,b)=>((100-b.progress)*(b.question_count||1))-((100-a.progress)*(a.question_count||1)))[0] || null

  return <DashboardShell
    subjects={subjects}
    email={claims.email || ''}
    isAdmin={claims?.app_metadata?.role === 'admin'}
    metrics={metrics}
    profile={profileRes.data || {}}
    weakTopics={weakRes.data || []}
    prioritySubject={prioritySubject}
  />
}
