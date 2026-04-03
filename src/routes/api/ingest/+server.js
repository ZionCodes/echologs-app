import { json }             from '@sveltejs/kit'
import crypto               from 'crypto'
import { supabaseAdmin }    from '$lib/server/supabase-admin.js'
import { sendFailureEmail } from '$lib/server/email.js'
import { getLimits }        from '$lib/plans.js'

const APP_URL = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'

export const POST = async ({ request }) => {

  // ── 1. Auth ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const plainKey   = authHeader.replace('Bearer ', '').trim()

  if (!plainKey.startsWith('el_')) {
    return json({ error: 'Missing or invalid API key' }, { status: 401 })
  }

  const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex')

  const { data: apiKey } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (!apiKey) {
    return json({ error: 'Invalid API key' }, { status: 401 })
  }

  const userId = apiKey.user_id

  // ── 2. Get plan + limits ─────────────────────────────────────────────
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  const plan   = (subscription?.status === 'active' || subscription?.status === 'trialing')
    ? (subscription.plan ?? 'free') : 'free'
  const limits = getLimits(plan)

  // ── 3. Check execution limit ─────────────────────────────────────────
  if (limits.executions !== Infinity) {
    const since = new Date()
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    const { count } = await supabaseAdmin
      .from('executions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', since.toISOString())

    if ((count ?? 0) >= limits.executions) {
      return json({
        error:   `Monthly execution limit of ${limits.executions} reached. Upgrade your plan.`,
        upgrade: true,
      }, { status: 429 })
    }
  }

  // ── 4. Parse body ────────────────────────────────────────────────────
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    script_name,
    status,
    stdout      = null,
    stderr      = null,
    error       = null,
    duration_ms = null,
  } = body

  if (!script_name || typeof script_name !== 'string') {
    return json({ error: 'script_name is required' }, { status: 400 })
  }

  if (!['pass', 'fail'].includes(status)) {
    return json({ error: 'status must be "pass" or "fail"' }, { status: 400 })
  }

  // ── 5. Resolve script ────────────────────────────────────────────────
  const { data: existingScript } = await supabaseAdmin
    .from('scripts')
    .select('id, name, slack_webhook, slack_alerts_enabled, alert_email')
    .eq('user_id', userId)
    .eq('sdk_name', script_name)
    .single()

  let script = existingScript

  if (!script) {
    if (limits.scripts !== Infinity) {
      const { count: scriptCount } = await supabaseAdmin
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if ((scriptCount ?? 0) >= limits.scripts) {
        return json({
          error:   `Script limit of ${limits.scripts} reached. Upgrade your plan.`,
          upgrade: true,
        }, { status: 429 })
      }
    }

    const { data: newScript, error: createErr } = await supabaseAdmin
      .from('scripts')
      .insert({ user_id: userId, name: script_name, sdk_name: script_name })
      .select('id, name, slack_webhook, slack_alerts_enabled, alert_email')
      .single()

    if (createErr || !newScript) {
      console.error('Script create error:', createErr)
      return json({ error: 'Failed to resolve script' }, { status: 500 })
    }

    script = newScript
  }

  // ── 6. Write execution ───────────────────────────────────────────────
  const { data: execution, error: execErr } = await supabaseAdmin
    .from('executions')
    .insert({
      user_id:     userId,
      script_id:   script.id,
      status,
      stdout:      stdout      ? stdout.slice(0, 100_000)  : null,
      stderr:      stderr      ? stderr.slice(0, 100_000)  : null,
      error:       error       ? error.slice(0, 10_000)    : null,
      duration_ms: duration_ms ? Math.round(duration_ms)   : null,
      started_at:  new Date().toISOString(),
    })
    .select('id')
    .single()

  if (execErr) {
    console.error('Execution insert error:', execErr)
    return json({ error: 'Failed to save execution' }, { status: 500 })
  }

  // ── 7. Check failure streak ──────────────────────────────────────────
  let failureStreak = 0
  if (status === 'fail') {
    const { data: recentRuns } = await supabaseAdmin
      .from('executions')
      .select('status')
      .eq('script_id', script.id)
      .order('started_at', { ascending: false })
      .limit(5)

    for (const run of recentRuns ?? []) {
      if (run.status === 'fail') failureStreak++
      else break
    }
  }

  // ── 8. Alerts ────────────────────────────────────────────────────────
  if (status === 'fail' && script.slack_alerts_enabled !== false) {
    const streakNote = failureStreak >= 3
      ? `\n⚠️ *This script has failed ${failureStreak} times in a row.*`
      : ''

    if (script.slack_webhook && limits.slack_alerts) {
      await sendSlackAlert({
        webhook:       script.slack_webhook,
        scriptName:    script.name,
        error:         error ?? stderr ?? 'No error details captured',
        durationMs:    duration_ms,
        execId:        execution.id,
        appUrl:        APP_URL,
        streakNote,
        failureStreak,
      })
    }

    if (script.alert_email && limits.email_alerts) {
      await sendFailureEmail({
        to:           script.alert_email,
        scriptName:   script.name,
        error:        error ?? stderr ?? null,
        durationMs:   duration_ms,
        execId:       execution.id,
        appUrl:       APP_URL,
        failureStreak,
      })
    }
  }

  // ── 9. Respond ───────────────────────────────────────────────────────
  return json({
    ok:           true,
    execution_id: execution.id,
    script_id:    script.id,
    plan,
  }, { status: 201 })
}

async function sendSlackAlert({ webhook, scriptName, error, durationMs, execId, appUrl, streakNote = '', failureStreak = 1 }) {
  try {
    const duration = durationMs
      ? durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`
      : null

    const color = failureStreak >= 3 ? '#ff0000' : '#ff4757'
    const title = failureStreak >= 3
      ? `🚨 Script failing repeatedly (${failureStreak}x in a row)`
      : `EchoLogs — Script failed`

    await fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*${title}*\n*Script:* \`${scriptName}\`${streakNote}` },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Status*\n❌ Failed` },
                { type: 'mrkdwn', text: `*Duration*\n${duration ?? '—'}` },
              ],
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Error*\n\`\`\`${error.slice(0, 500)}\`\`\`` },
            },
            {
              type: 'actions',
              elements: [{
                type:  'button',
                style: failureStreak >= 3 ? 'danger' : 'primary',
                text:  { type: 'plain_text', text: 'View full logs' },
                url:   `${appUrl}/executions/${execId}`,
              }],
            },
          ],
        }],
      }),
    })
  } catch (err) {
    console.error('[EchoLogs] Slack webhook failed:', err)
  }
}