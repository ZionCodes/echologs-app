import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase }, url }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const plan = (
    subscription?.status === 'active' ||
    subscription?.status === 'trialing'
  ) ? (subscription.plan ?? 'free') : 'free'

  const filter   = url.searchParams.get('status') ?? 'all'
  const search   = url.searchParams.get('search') ?? ''
  const dateFrom = url.searchParams.get('from')   ?? ''
  const dateTo   = url.searchParams.get('to')     ?? ''
  const page     = parseInt(url.searchParams.get('page') ?? '1')
  const limit    = 20
  const offset   = (page - 1) * limit

  // Script stats
  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const scriptStats = await Promise.all((scripts ?? []).map(async s => {
    const since7  = new Date(Date.now() - 7  * 86_400_000).toISOString()
    const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString()

    const [
      { count: total },
      { count: pass },
      { count: thisWeek },
      { count: lastWeek },
      { data: latest },
    ] = await Promise.all([
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).eq('status', 'pass'),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).gte('started_at', since7),
      supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', s.id).gte('started_at', since14).lt('started_at', since7),
      supabase.from('executions').select('started_at, status').eq('script_id', s.id).order('started_at', { ascending: false }).limit(1),
    ])

    return {
      ...s,
      total:     total    ?? 0,
      pass:      pass     ?? 0,
      passRate:  total    ? Math.round(((pass ?? 0) / total) * 100) : null,
      thisWeek:  thisWeek ?? 0,
      weekTrend: (thisWeek ?? 0) - (lastWeek ?? 0),
      latestRun: latest?.[0] ?? null,
    }
  }))

  // Executions query
  let query = supabase
    .from('executions')
    .select('id, status, duration_ms, error, started_at, scripts(name)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter !== 'all') query = query.eq('status', filter)
  if (dateFrom)         query = query.gte('started_at', new Date(dateFrom).toISOString())
  if (dateTo)           query = query.lte('started_at', new Date(dateTo + 'T23:59:59').toISOString())

  if (search) {
    const { data: matched } = await supabase
      .from('scripts')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', `%${search}%`)

    const ids = (matched ?? []).map(s => s.id)
    if (ids.length === 0) {
      return { executions: [], total: 0, page, filter, search, dateFrom, dateTo, scriptStats, plan }
    }
    query = query.in('script_id', ids)
  }

  const { data: executions, count } = await query

  return {
    executions:  executions ?? [],
    total:       count      ?? 0,
    page,
    filter,
    search,
    dateFrom,
    dateTo,
    scriptStats,
    plan,
  }
}