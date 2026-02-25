import { error, redirect, fail } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession, supabase }, params }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

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

  return { script, recent: recent ?? [], total: total ?? 0, pass: pass ?? 0 }
}

export const actions = {
  saveSettings: async ({ request, locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form    = await request.formData()
    const webhook = form.get('slack_webhook')?.toString().trim() ?? ''
    const enabled = form.get('slack_alerts_enabled') === 'true'

    const { error: err } = await supabase
      .from('scripts')
      .update({ slack_webhook: webhook || null, slack_alerts_enabled: enabled })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (err) return fail(500, { error: 'Failed to save settings' })
    return { success: true, message: 'Settings saved.' }
  },

  deleteScript: async ({ locals: { safeGetSession, supabase }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    // Delete executions first (foreign key), then the script
    const { error: execErr } = await supabase
      .from('executions')
      .delete()
      .eq('script_id', params.id)

    if (execErr) return fail(500, { error: 'Failed to delete executions' })

    const { error: scriptErr } = await supabase
      .from('scripts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (scriptErr) return fail(500, { error: 'Failed to delete script' })

    // Redirect back to scripts list after deletion
    redirect(303, '/scripts?deleted=1')
  }
}