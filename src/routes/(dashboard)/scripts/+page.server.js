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
    ] = await Promise.all([
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).eq('status', 'pass'),
      supabase.from('executions').select('started_at').eq('script_id', s.id).order('started_at', { ascending: false }).limit(1),
    ])
    return {
      ...s,
      total:     total  ?? 0,
      pass:      pass   ?? 0,
      latestRun: latest?.[0] ?? null,
    }
  }))

  return { scripts: scriptStats }
}