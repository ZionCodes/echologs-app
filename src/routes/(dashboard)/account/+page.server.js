import { redirect, fail } from '@sveltejs/kit'
import { getLimits }      from '$lib/plans.js'

export async function load({ locals: { safeGetSession, supabase } }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const plan = (
    subscription?.status === 'active' ||
    subscription?.status === 'trialing'
  ) ? (subscription.plan ?? 'free') : 'free'

  const limits = getLimits(plan)

  // Get current usage
  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [
    { count: executionsUsed },
    { count: scriptsUsed },
    { count: apiKeysUsed },
  ] = await Promise.all([
    supabase
      .from('executions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', since.toISOString()),
    supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  return {
    user,
    plan,
    subscription: subscription ?? null,
    limits,
    usage: {
      executions: executionsUsed ?? 0,
      scripts:    scriptsUsed   ?? 0,
      api_keys:   apiKeysUsed   ?? 0,
    },
  }
}

export const actions = {
  changePassword: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form    = await request.formData()
    const pass    = form.get('password')?.toString()
    const confirm = form.get('confirm_password')?.toString()

    if (!pass || pass.length < 8)
      return fail(400, { error: 'Password must be at least 8 characters' })
    if (pass !== confirm)
      return fail(400, { error: 'Passwords do not match' })

    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) return fail(500, { error: error.message })

    return { success: true, message: 'Password updated successfully.' }
  }
}