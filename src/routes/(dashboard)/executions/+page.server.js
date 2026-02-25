import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase }, url }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const filter = url.searchParams.get('status') ?? 'all'
  const page   = parseInt(url.searchParams.get('page') ?? '1')
  const limit  = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('executions')
    .select('id, status, duration_ms, error, started_at, scripts(name)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: executions, count } = await query

  return {
    executions: executions ?? [],
    total:      count ?? 0,
    page,
    filter,
  }
}