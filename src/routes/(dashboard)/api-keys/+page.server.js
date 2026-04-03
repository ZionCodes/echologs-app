import { redirect, fail } from '@sveltejs/kit'
import crypto             from 'crypto'
import { getLimits }      from '$lib/plans.js'

export async function load({ locals: { safeGetSession, supabase } }) {
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

  const limits = getLimits(plan)

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const keyList    = keys ?? []
  const atLimit    = limits.api_keys !== Infinity && keyList.length >= limits.api_keys

  return { keys: keyList, plan, limits, atLimit }
}

export const actions = {
  generate: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    // Re-check limit server-side — never trust the client
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const plan   = (subscription?.status === 'active' || subscription?.status === 'trialing')
      ? (subscription.plan ?? 'free') : 'free'
    const limits = getLimits(plan)

    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (limits.api_keys !== Infinity && (count ?? 0) >= limits.api_keys) {
      return fail(403, {
        error: `Your ${plan} plan allows ${limits.api_keys} API key${limits.api_keys === 1 ? '' : 's'}. Upgrade to create more.`,
        limitReached: true,
      })
    }

    const form = await request.formData()
    const name = form.get('name')?.toString().trim()
    if (!name) return fail(400, { error: 'Key name is required' })

    const plainKey = `el_${crypto.randomBytes(32).toString('hex')}`
    const keyHash  = crypto.createHash('sha256').update(plainKey).digest('hex')

    const { error: err } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, name, key_hash: keyHash })

    if (err) return fail(500, { error: 'Failed to create key. Please try again.' })

    return { success: true, newKey: plainKey, newKeyName: name }
  },

  revoke: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form = await request.formData()
    const id   = form.get('id')?.toString()
    if (!id) return fail(400, { error: 'Missing key ID' })

    const { error: err } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return fail(500, { error: 'Failed to revoke key' })
    return { revoked: true }
  }
}