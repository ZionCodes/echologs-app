import { json }          from '@sveltejs/kit'
import crypto            from 'crypto'
import { supabaseAdmin } from '$lib/server/supabase-admin.js'

const SLACK_FAIL_COLOR = '#ff4757'
const APP_URL          = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'

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

  // ── 2. Parse body ────────────────────────────────────────────────────
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

  // ── 3. Upsert script ─────────────────────────────────────────────────
  const { data: script, error: scriptErr } = await supabaseAdmin
    .from('scripts')
    .upsert(
      { user_id: userId, name: script_name },
      { onConflict: 'user_id, name', ignoreDuplicates: false }
    )
    .select('id, name, slack_webhook, slack_alerts_enabled')
    .single()

  if (scriptErr || !script) {
    console.error('Script upsert error:', scriptErr)
    return json({ error: 'Failed to resolve script' }, { status: 500 })
  }

  // ── 4. Write execution ───────────────────────────────────────────────
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

  // ── 5. Slack alert on failure ────────────────────────────────────────
  if (status === 'fail' && script.slack_alerts_enabled !== false && script.slack_webhook) {
    await sendSlackAlert({
      webhook:    script.slack_webhook,
      scriptName: script.name,
      error:      error ?? stderr ?? 'No error details captured',
      durationMs: duration_ms,
      execId:     execution.id,
      appUrl:     APP_URL,
    })
  }

  // ── 6. Respond ───────────────────────────────────────────────────────
  return json({
    ok:           true,
    execution_id: execution.id,
    script_id:    script.id,
  }, { status: 201 })
}

async function sendSlackAlert({ webhook, scriptName, error, durationMs, execId, appUrl }) {
  try {
    const duration = durationMs
      ? durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`
      : null

    await fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: SLACK_FAIL_COLOR,
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*EchoLogs — Script failed*\n*Script:* \`${scriptName}\`` },
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
                type: 'button',
                text: { type: 'plain_text', text: 'View full logs' },
                url:  `${appUrl}/executions/${execId}`,
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