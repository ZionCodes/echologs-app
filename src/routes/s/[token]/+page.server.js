import { error } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/server/supabase-admin.js'

export async function load({ params }) {
  const { token } = params

  if (!token || token.length !== 32) {
    error(404, 'Status page not found')
  }

  const { data: script } = await supabaseAdmin
    .from('scripts')
    .select('id, name, created_at')
    .eq('share_token', token)
    .single()

  if (!script) error(404, 'Status page not found')

  const since60 = new Date(Date.now() - 60 * 86_400_000).toISOString()

  // Now also fetch stdout, stderr, error for collapsible logs
  const { data: executions } = await supabaseAdmin
    .from('executions')
    .select('id, status, started_at, duration_ms, stdout, stderr, error')
    .eq('script_id', script.id)
    .gte('started_at', since60)
    .order('started_at', { ascending: false })
    .limit(500)

  const rows = executions ?? []

  const total  = rows.length
  const passed = rows.filter(e => e.status === 'pass').length
  const failed = rows.filter(e => e.status === 'fail').length
  const uptime = total ? Math.round((passed / total) * 100) : null
  const avgMs  = total ? Math.round(rows.reduce((a, e) => a + (e.duration_ms ?? 0), 0) / total) : null

  const days = []
  for (let i = 59; i >= 0; i--) {
    const d    = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dEnd = new Date(d)
    dEnd.setHours(23, 59, 59, 999)

    const dayRuns = rows.filter(e => {
      const t = new Date(e.started_at)
      return t >= d && t <= dEnd
    })

    days.push({
      date:  d.toISOString().split('T')[0],
      pass:  dayRuns.filter(e => e.status === 'pass').length,
      fail:  dayRuns.filter(e => e.status === 'fail').length,
      total: dayRuns.length,
    })
  }

  // Last 20 runs with logs — truncate stdout/stderr for performance
  const recent = rows.slice(0, 20).map(r => ({
    id:          r.id,
    status:      r.status,
    started_at:  r.started_at,
    duration_ms: r.duration_ms,
    stdout:      r.stdout ? r.stdout.slice(0, 4000) : null,
    stderr:      r.stderr ? r.stderr.slice(0, 2000) : null,
    error:       r.error  ? r.error.slice(0, 2000)  : null,
  }))

  return {
    script: { name: script.name, created_at: script.created_at },
    stats:  { total, passed, failed, uptime, avgMs },
    days,
    recent,
  }
}