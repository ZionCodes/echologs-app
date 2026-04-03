import { error, redirect, fail } from '@sveltejs/kit'
import { getLimits }             from '$lib/plans.js'
import { randomBytes }           from 'crypto'

export async function load({ locals: { safeGetSession, supabase }, params }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const plan   = (subscription?.status === 'active' || subscription?.status === 'trialing')
    ? (subscription.plan ?? 'free') : 'free'
  const limits = getLimits(plan)

  const { data: script, error: err } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (err || !script) error(404, 'Script not found')

  const [
    { data: recent },
    { count: total },
    { count: pass },
  ] = await Promise.all([
    supabase
      .from('executions')
      .select('id, status, duration_ms, error, started_at')
      .eq('script_id', params.id)
      .order('started_at', { ascending: false })
      .limit(10),
    supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', params.id),
    supabase.from('executions').select('*', { count: 'exact', head: true }).eq('script_id', params.id).eq('status', 'pass'),
  ])

  return { script, recent: recent ?? [], total: total ?? 0, pass: pass ?? 0, plan, limits }
}

export const actions = {

  saveSettings: async ({ request, locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form       = await request.formData()
    const webhook    = form.get('slack_webhook')?.toString().trim()  ?? ''
    const enabled    = form.get('slack_alerts_enabled') === 'true'
    const alertEmail = form.get('alert_email')?.toString().trim()    ?? ''

    const { error: err } = await supabase
      .from('scripts')
      .update({ slack_webhook: webhook || null, slack_alerts_enabled: enabled, alert_email: alertEmail || null })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (err) return fail(500, { settingsError: 'Failed to save settings' })
    return { settingsSuccess: true }
  },

  renameScript: async ({ request, locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form    = await request.formData()
    const newName = form.get('name')?.toString().trim()
    if (!newName)             return fail(400, { renameError: 'Name cannot be empty' })
    if (newName.length > 80) return fail(400, { renameError: 'Name must be under 80 characters' })

    const { data: existing } = await supabase
      .from('scripts')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', newName)
      .neq('id', params.id)
      .single()

    if (existing) return fail(400, { renameError: 'A script with that name already exists' })

    const { error: err } = await supabase
      .from('scripts')
      .update({ name: newName })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (err) return fail(500, { renameError: 'Failed to rename script' })
    return { renameSuccess: true, newName }
  },

  generateShareLink: async ({ locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    // Verify ownership before generating token
    const { data: script } = await supabase
      .from('scripts')
      .select('id, share_token')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!script) return fail(404, { shareError: 'Script not found' })

    const token = randomBytes(16).toString('hex')

    const { error: err } = await supabase
      .from('scripts')
      .update({ share_token: token })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (err) return fail(500, { shareError: 'Failed to generate link' })
    return { shareSuccess: true, shareToken: token }
  },

  revokeShareLink: async ({ locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const { error: err } = await supabase
      .from('scripts')
      .update({ share_token: null })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (err) return fail(500, { shareError: 'Failed to revoke link' })
    return { revokeSuccess: true }
  },

  testWebhook: async ({ locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const { data: script } = await supabase
      .from('scripts')
      .select('name, slack_webhook, slack_alerts_enabled')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!script) return fail(404, { testError: 'Script not found' })

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const plan   = (subscription?.status === 'active' || subscription?.status === 'trialing')
      ? (subscription.plan ?? 'free') : 'free'
    const limits = getLimits(plan)

    if (!limits.slack_alerts) return fail(403, { testError: 'Slack alerts are available on Pro and Team plans.' })
    if (!script.slack_webhook) return fail(400, { testError: 'Add a Slack webhook URL first, then test it.' })

    try {
      const res = await fetch(script.slack_webhook, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: '#00e57a',
            blocks: [{
              type: 'section',
              text: { type: 'mrkdwn', text: `*EchoLogs — Test alert ✅*\n*Script:* \`${script.name}\`\nYour Slack alerts are configured correctly.` },
            }],
          }],
        }),
      })
      if (!res.ok) return fail(500, { testError: 'Slack rejected the request — check your webhook URL.' })
    } catch {
      return fail(500, { testError: 'Could not reach Slack — check your webhook URL.' })
    }

    return { testSuccess: true, testMessage: 'Test alert sent to Slack.' }
  },

  deleteScript: async ({ locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const { error: execErr } = await supabase
      .from('executions').delete().eq('script_id', params.id)
    if (execErr) return fail(500, { deleteError: 'Failed to delete executions' })

    const { error: scriptErr } = await supabase
      .from('scripts').delete().eq('id', params.id).eq('user_id', user.id)
    if (scriptErr) return fail(500, { deleteError: 'Failed to delete script' })

    redirect(303, '/scripts?deleted=1')
  },
}