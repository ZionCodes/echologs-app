import { error } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/server/supabase-admin.js'

export async function load({ params }) {
  const { token } = params

  if (!token || token.length !== 32) {
    error(404, 'Status page not found')
  }

  // Public endpoint — uses admin client but only reads public share data
  const { data: script } = await supabaseAdmin
    .from('scripts')
    .select('id, name, created_at')
    .eq('share_token', token)
    .single()

  if (!script) error(404, 'Status page not found')

  // Last 60 days of executions for uptime grid
  const since60 = new Date(Date.now() - 60 * 86_400_000).toISOString()

  const { data: executions } = await supabaseAdmin
    .from('executions')
    .select('status, started_at, duration_ms')
    .eq('script_id', script.id)
    .gte('started_at', since60)
    .order('started_at', { ascending: false })
    .limit(500)

  const rows = executions ?? []

  // Compute stats
  const total   = rows.length
  const passed  = rows.filter(e => e.status === 'pass').length
  const failed  = rows.filter(e => e.status === 'fail').length
  const uptime  = total ? Math.round((passed / total) * 100) : null
  const avgMs   = total ? Math.round(rows.reduce((a, e) => a + (e.duration_ms ?? 0), 0) / total) : null

  // Build daily buckets for the grid (last 60 days)
  const days = []
  for (let i = 59; i >= 0; i--) {
    const d     = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dEnd  = new Date(d)
    dEnd.setHours(23, 59, 59, 999)

    const dayRuns = rows.filter(e => {
      const t = new Date(e.started_at)
      return t >= d && t <= dEnd
    })

    const dayPass = dayRuns.filter(e => e.status === 'pass').length
    const dayFail = dayRuns.filter(e => e.status === 'fail').length

    days.push({
      date:  d.toISOString().split('T')[0],
      pass:  dayPass,
      fail:  dayFail,
      total: dayRuns.length,
    })
  }

  // Last 10 runs
  const recent = rows.slice(0, 10)

  return {
    script: { name: script.name, created_at: script.created_at },
    stats:  { total, passed, failed, uptime, avgMs },
    days,
    recent,
  }
}