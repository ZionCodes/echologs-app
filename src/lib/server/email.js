const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function sendFailureEmail({
  to,
  scriptName,
  error,
  durationMs,
  execId,
  appUrl,
  failureStreak = 1,
}) {
  if (!RESEND_API_KEY || !to) return

  const duration = durationMs
    ? durationMs < 1000
      ? `${durationMs}ms`
      : `${(durationMs / 1000).toFixed(1)}s`
    : null

  const execUrl  = `${appUrl}/executions/${execId}`
  const isStreak = failureStreak >= 3
  const subject  = isStreak
    ? `[EchoLogs] ⚠️ ${scriptName} has failed ${failureStreak} times in a row`
    : `[EchoLogs] Script failed: ${scriptName}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'EchoLogs <alerts@send.echologs.com>',
        to:      [to],
        subject,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f8; margin: 0; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; max-width: 520px; margin: 0 auto; border: 1px solid #dce2ea; }
    .logo { font-family: monospace; font-size: 15px; font-weight: 700; color: #00a854; margin-bottom: 28px; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #00a854; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
    .title { font-size: 20px; font-weight: 800; color: #0f1923; margin-bottom: 6px; }
    .sub { font-size: 13px; color: #5a7080; margin-bottom: 24px; line-height: 1.5; }
    .badge { display: inline-block; background: #dc262618; color: #dc2626; border: 1px solid #dc262630; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; font-family: monospace; margin-bottom: 24px; }
    .streak-banner { background: #ff000012; border: 1px solid #ff000030; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-family: monospace; font-size: 12px; color: #dc2626; font-weight: 600; }
    .meta-table { width: 100%; background: #f4f6f8; border-radius: 8px; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table td { padding: 10px 16px; font-family: monospace; font-size: 12px; }
    .meta-table tr + tr td { border-top: 1px solid #dce2ea; }
    .meta-label { color: #5a7080; width: 90px; }
    .meta-value { color: #0f1923; font-weight: 600; }
    .error-label { font-family: monospace; font-size: 11px; color: #5a7080; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .error-block { background: #1a1f26; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-family: monospace; font-size: 12px; color: #7a9eae; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
    .btn { display: inline-block; background: #00a854; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; }
    .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #dce2ea; font-size: 11px; color: #8fa3b0; font-family: monospace; text-align: center; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="card">

    <div class="logo"><span class="dot"></span>echologs</div>

    <div class="title">Script failed</div>
    <div class="sub">Your script encountered an error and did not complete successfully.</div>

    <div class="badge">❌ FAILED</div>

    ${isStreak ? `<div class="streak-banner">⚠️ This script has failed ${failureStreak} times in a row. Check it as soon as possible.</div>` : ''}

    <table class="meta-table">
      <tr>
        <td class="meta-label">Script</td>
        <td class="meta-value">${scriptName}</td>
      </tr>
      ${duration ? `
      <tr>
        <td class="meta-label">Duration</td>
        <td class="meta-value">${duration}</td>
      </tr>` : ''}
      <tr>
        <td class="meta-label">Time</td>
        <td class="meta-value">${new Date().toUTCString()}</td>
      </tr>
    </table>

    ${error ? `
    <div class="error-label">Error</div>
    <div class="error-block">${error.slice(0, 800).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ` : ''}

    <a href="${execUrl}" class="btn">View full logs →</a>

    <div class="footer">
      You're receiving this because email alerts are enabled for <strong>${scriptName}</strong>.<br>
      Manage alerts at <a href="${appUrl}/scripts" style="color:#00a854">echologs.com/scripts</a>
    </div>

  </div>
</body>
</html>`,
      }),
    })

    if (!res.ok) {
      console.error('[EchoLogs] Email send failed:', await res.text())
    }
  } catch (err) {
    console.error('[EchoLogs] Email send error:', err)
  }
}