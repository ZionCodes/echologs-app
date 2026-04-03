import { error, redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase }, params }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: ex, error: err } = await supabase
    .from('executions')
    .select('*, scripts(name, id)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (err || !ex) error(404, 'Execution not found')

  // Get surrounding executions for prev/next navigation
  const [{ data: prevEx }, { data: nextEx }] = await Promise.all([
    supabase
      .from('executions')
      .select('id')
      .eq('script_id', ex.script_id)
      .lt('started_at', ex.started_at)
      .order('started_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('executions')
      .select('id')
      .eq('script_id', ex.script_id)
      .gt('started_at', ex.started_at)
      .order('started_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  // Get last 20 executions for duration sparkline
  const { data: history } = await supabase
    .from('executions')
    .select('duration_ms, status, started_at')
    .eq('script_id', ex.script_id)
    .order('started_at', { ascending: false })
    .limit(20)

  return {
    ex,
    prevId:  prevEx?.id ?? null,
    nextId:  nextEx?.id ?? null,
    history: (history ?? []).reverse(),
  }
}