import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard-shell'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/login')

  const { data: access } = await supabase.from('access_grants').select('active,expires_at').eq('user_id', claims.sub).eq('product_code','pcap_oficial_investigador_2026').maybeSingle()
  const valid = access?.active && (!access.expires_at || new Date(access.expires_at) > new Date())

  if (!valid) return <main className="login-wrap"><section className="login-card"><div className="brand"><div className="bolt">⚡</div><div><h1 style={{margin:0}}>BIZU FLASHCARDS</h1><small>PC/AP • OFICIAL INVESTIGADOR</small></div></div><h1>Acesso não liberado</h1><p className="muted">Seu login está correto, mas este usuário ainda não possui acesso ativo ao produto PC/AP Oficial Investigador.</p></section></main>

  const { data: rows } = await supabase.from('subjects').select('id,slug,name,order_index,question_count,flashcards:topics(flashcards(id))').order('order_index')
  const subjects = (rows || []).map(s => ({...s,count:(s.flashcards||[]).reduce((n,t)=>n+(t.flashcards?.length||0),0),progress:0}))

  return <DashboardShell subjects={subjects} email={claims.email || ''} />
}
