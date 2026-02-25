import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase } }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')
  const uid = user.id

  const [
    { count: total },
    { count: passed },
    { count: failed },
  ] = await Promise.all([
    supabase.from('executions').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    supabase.from('executions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'pass'),
    supabase.from('executions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'fail'),
  ])

  const { data: avgData } = await supabase.rpc('avg_duration', { uid })

  const since = new Date(Date.now() - 14 * 86400_000).toISOString()
  const { data: chartRaw } = await supabase
    .from('executions').select('status, started_at')
    .eq('user_id', uid).gte('started_at', since)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400_000)
    return { label: d.getDate(), pass: 0, fail: 0 }
  })
  chartRaw?.forEach(r => {
    const idx = 13 - Math.floor((Date.now() - new Date(r.started_at)) / 86400_000)
    if (idx >= 0 && idx < 14) {
      if (r.status === 'pass') days[idx].pass++
      else days[idx].fail++
    }
  })

  const { data: recent } = await supabase
    .from('executions')
    .select('id, status, duration_ms, error, started_at, scripts(name)')
    .eq('user_id', uid).order('started_at', { ascending: false }).limit(8)

  const { data: scripts } = await supabase
    .from('scripts').select('id, name, slack_webhook')
    .eq('user_id', uid).order('created_at', { ascending: false }).limit(3)

  const scriptStats = await Promise.all((scripts ?? []).map(async s => {
    const [{ count: sTotal }, { count: sPass }, { data: avg }] = await Promise.all([
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).eq('status', 'pass'),
      supabase.rpc('avg_duration_script', { sid: s.id }),
    ])
    return { ...s, total: sTotal ?? 0, pass: sPass ?? 0, avgMs: Math.round(avg ?? 0) }
  }))

  const { data: keys } = await supabase
    .from('api_keys').select('id, name, created_at')
    .eq('user_id', uid).order('created_at', { ascending: false })

  return {
    stats: { total: total ?? 0, passed: passed ?? 0, failed: failed ?? 0, avgDuration: Math.round(avgData ?? 0) },
    chartDays: days,
    recent:    recent      ?? [],
    scripts:   scriptStats,
    keys:      keys        ?? [],
  }
}