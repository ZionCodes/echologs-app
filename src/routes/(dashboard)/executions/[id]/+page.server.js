import { error, redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase }, params }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: ex, error: err } = await supabase
    .from('executions')
    .select('*, scripts(name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (err || !ex) error(404, 'Execution not found')

  return { ex }
}