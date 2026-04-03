import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase } }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, name, slack_webhook, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const scriptStats = await Promise.all((scripts ?? []).map(async s => {
    const [
      { count: total },
      { count: pass },
      { data: latest },
      { data: sparkline },
    ] = await Promise.all([
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).eq('status', 'pass'),
      supabase.from('executions').select('started_at, status, duration_ms').eq('script_id', s.id).order('started_at', { ascending: false }).limit(1),
      // Last 14 runs for sparkline dots
      supabase.from('executions').select('status, started_at').eq('script_id', s.id).order('started_at', { ascending: false }).limit(14),
    ])

    const passRate = total ? Math.round(((pass ?? 0) / total) * 100) : null

    // Check for failure streak
    let streak = 0
    for (const run of sparkline ?? []) {
      if (run.status === 'fail') streak++
      else break
    }

    return {
      ...s,
      total:     total    ?? 0,
      pass:      pass     ?? 0,
      passRate,
      latestRun: latest?.[0]    ?? null,
      sparkline: (sparkline ?? []).reverse(),
      streak,
    }
  }))

  return { scripts: scriptStats }
}