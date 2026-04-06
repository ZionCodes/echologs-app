const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function sendFailureEmail({
  to,
  scriptName,
  error,
  durationMs,
  execId,
  appUrl,
}) {
  if (!RESEND_API_KEY || !to) return

  const duration = durationMs
    ? durationMs < 1000
      ? `${durationMs}ms`
      : `${(durationMs / 1000).toFixed(1)}s`
    : null

  const execUrl = `${appUrl}/executions/${execId}`

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
        subject: `[EchoLogs] Script failed: ${scriptName}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body{font-family:-apple-system,sans-serif;background:#f4f6f8;margin:0;padding:40px 20px}
    .card{background:#fff;border-radius:12px;padding:32px;max-width:520px;margin:0 auto;border:1px solid #dce2ea}
    .logo{font-family:monospace;font-size:16px;font-weight:700;color:#00a854;margin-bottom:24px}
    .dot{display:inline-block;width:8px;height:8px;background:#00a854;border-radius:50%;margin-right:6px}
    .title{font-size:20px;font-weight:800;color:#0f1923;margin-bottom:6px}
    .sub{font-size:13px;color:#5a7080;margin-bottom:24px}
    .badge{display:inline-block;background:#dc262618;color:#dc2626;border:1px solid #dc262630;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;font-family:monospace;margin-bottom:20px}
    .meta{background:#f4f6f8;border-radius:8px;padding:16px;margin-bottom:20px;font-family:monospace;font-size:12px}
    .meta-row{display:flex;justify-content:space-between;padding:4px 0;color:#5a7080}
    .meta-val{color:#0f1923;font-weight:600}
    .error-block{background:#1a1f26;border-radius:8px;padding:16px;margin-bottom:24px;font-family:monospace;font-size:12px;color:#7a9eae;line-height:1.7;white-space:pre-wrap;word-break:break-all}
    .btn{display:inline-block;background:#00a854;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px}
    .footer{margin-top:24px;font-size:11px;color:#8fa3b0;font-family:monospace;text-align:center}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><span class="dot"></span>echologs</div>
    <div class="title">Script failed</div>
    <div class="sub">Your script encountered an error and did not complete successfully.</div>
    <div class="badge">❌ FAILED</div>
    <div class="meta">
      <div class="meta-row"><span>Script</span><span class="meta-val">${scriptName}</span></div>
      ${duration ? `<div class="meta-row"><span>Duration</span><span class="meta-val">${duration}</span></div>` : ''}
      <div class="meta-row"><span>Time</span><span class="meta-val">${new Date().toUTCString()}</span></div>
    </div>
    ${error ? `
    <div style="font-family:monospace;font-size:11px;color:#5a7080;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Error</div>
    <div class="error-block">${error.slice(0, 800).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ` : ''}
    <a href="${execUrl}" class="btn">View full logs</a>
    <div class="footer">
      You are receiving this because you enabled email alerts for ${scriptName}.<br>
      Manage alerts at echologs.com/scripts
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