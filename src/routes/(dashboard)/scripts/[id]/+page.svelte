<script>
  import { enhance }  from '$app/forms'
  import { goto }     from '$app/navigation'
  import StatusBadge  from '$lib/components/dashboard/StatusBadge.svelte'
  import DashAlert    from '$lib/components/dashboard/DashAlert.svelte'
  import { POLAR_CHECKOUT_LINKS } from '$lib/polar.js'
  import { passRate, formatDuration, formatRelative } from '$lib/utils/format.js'

  let { data, form } = $props()
  let { script, recent, total, pass, plan, limits } = $derived(data)

  let savingSettings  = $state(false)
  let renaming        = $state(false)
  let deleting        = $state(false)
  let testingWebhook  = $state(false)
  let generatingShare = $state(false)
  let showDeleteModal = $state(false)
  let enabledOverride = $state(null)
  let nameOverride    = $state(null)
  let copiedShare     = $state(false)

  let displayName = $derived(nameOverride !== null ? nameOverride : script.name)
  let enabled     = $derived(enabledOverride !== null ? enabledOverride : (script.slack_alerts_enabled ?? true))
  let pr          = $derived(passRate(pass, total))
  let canSlack    = $derived(limits?.slack_alerts === true)
  let upgradeHref = POLAR_CHECKOUT_LINKS.pro_monthly

  let shareToken  = $derived(form?.shareToken ?? script.share_token)
  let shareUrl    = $derived(
    shareToken && typeof window !== 'undefined'
      ? `${window.location.origin}/s/${shareToken}`
      : shareToken ? `/s/${shareToken}` : null
  )

  // ── Toggle controls all alerts (email + slack) for all plans ──────────
  function toggleEnabled() { enabledOverride = !enabled }
  function navigateToExecution(id) { goto(`/executions/${id}`) }

  function copyShareUrl() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    copiedShare = true
    setTimeout(() => { copiedShare = false }, 2000)
  }

  $effect(() => {
    if (form?.settingsSuccess) enabledOverride = null
    if (form?.renameSuccess)   nameOverride = form.newName
  })
</script>

<svelte:head><title>{displayName} — EchoLogs</title></svelte:head>

{#if showDeleteModal}
  <div style="position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);padding:24px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:440px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.5)">
      <div style="font-size:28px;margin-bottom:16px">⚠️</div>
      <div style="font-family:var(--font-sans);font-size:1.1rem;font-weight:800;margin-bottom:12px">Delete "{displayName}"?</div>
      <div style="background:var(--red-dim);border:1px solid #dc262630;border-radius:10px;padding:14px 16px;margin-bottom:16px">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--red);line-height:1.9">
          · The script <strong>{displayName}</strong><br>
          · All <strong>{total.toLocaleString()} executions</strong> and their logs<br>
          · All alert settings and the public status page
        </div>
      </div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:24px">This cannot be undone.</div>
      <div style="display:flex;gap:10px">
        <button class="dash-btn dash-btn-ghost" style="flex:1" disabled={deleting} onclick={() => showDeleteModal = false}>Cancel</button>
        <form method="POST" action="?/deleteScript" style="flex:1" use:enhance={() => { deleting = true; return async ({ result }) => { if (result.type === 'redirect') goto(result.location); else { deleting = false; showDeleteModal = false } } }}>
          <button type="submit" class="dash-btn dash-btn-danger" style="width:100%;justify-content:center" disabled={deleting}>{deleting ? 'Deleting...' : 'Yes, delete it'}</button>
        </form>
      </div>
    </div>
  </div>
{/if}

<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:16px">
  <div>
    <h1 style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;margin:0 0 4px">{displayName}</h1>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">{total.toLocaleString()} total runs · {pr} pass rate</div>
  </div>
  <div style="display:flex;gap:8px;flex-shrink:0">
    <button class="dash-btn dash-btn-danger" onclick={() => showDeleteModal = true}>Delete</button>
    <a href="/scripts" class="dash-btn dash-btn-ghost">Back</a>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:14px;align-items:start">
  <div style="display:flex;flex-direction:column;gap:14px">

    <!-- Rename -->
    <div class="dash-card" style="padding:24px">
      <div class="dash-card-title" style="margin-bottom:4px">Display name</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Change how this script appears in your dashboard</div>
      <DashAlert type="error"   message={form?.renameError} />
      <DashAlert type="success" message={form?.renameSuccess ? 'Script renamed.' : null} />
      <form method="POST" action="?/renameScript" use:enhance={() => { renaming = true; return async ({ update }) => { await update({ reset: false }); renaming = false } }}>
        <div style="margin-bottom:14px">
          <label class="dash-form-label" for="script-name">Name</label>
          <input id="script-name" class="dash-input" name="name" type="text" required maxlength="80" value={displayName} oninput={(e) => nameOverride = e.currentTarget.value} />
          <div class="dash-input-hint">Only changes the dashboard name — your code stays the same</div>
        </div>
        <button type="submit" class="dash-btn dash-btn-primary" style="width:100%" disabled={renaming}>{renaming ? 'Saving...' : 'Rename'}</button>
      </form>
    </div>

    <!-- Alerts -->
    <div class="dash-card" style="padding:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div class="dash-card-title">Alerts</div>
        {#if canSlack && script.slack_webhook}
          <form method="POST" action="?/testWebhook" use:enhance={() => { testingWebhook = true; return async ({ update }) => { await update({ reset: false }); testingWebhook = false } }}>
            <button type="submit" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" disabled={testingWebhook}>{testingWebhook ? 'Sending...' : 'Test Slack'}</button>
          </form>
        {/if}
      </div>
      <div class="dash-card-sub" style="margin-bottom:20px">Get notified when this script fails</div>

      <DashAlert type="error"   message={form?.settingsError ?? form?.testError} />
      <DashAlert type="success" message={form?.settingsSuccess ? 'Settings saved.' : form?.testSuccess ? form.testMessage : null} />

      <form method="POST" action="?/saveSettings" use:enhance={() => { savingSettings = true; return async ({ update }) => { await update({ reset: false }); savingSettings = false } }}>

        <!-- Master toggle — works for ALL plans -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
          <div>
            <div style="font-family:var(--font-sans);font-size:13px;font-weight:700">
              Alerts {enabled ? 'enabled' : 'disabled'}
            </div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px">
              {enabled ? 'You will be notified on failure' : 'All notifications paused'}
            </div>
          </div>
          <input type="hidden" name="slack_alerts_enabled" value={String(enabled)} />
          <button
            type="button"
            onclick={toggleEnabled}
            style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;background:{enabled ? 'var(--green)' : 'var(--border)'}"
            aria-label="Toggle alerts"
          >
            <span style="position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;left:{enabled ? '23px' : '3px'}"></span>
          </button>
        </div>

        <!-- Slack — Pro+ only -->
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <label class="dash-form-label" style="margin-bottom:0" for="slack_webhook">Slack webhook</label>
            {#if !canSlack}
              <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--muted);background:var(--surface2);border:1px solid var(--border);padding:2px 8px;border-radius:20px">Pro+</span>
            {/if}
          </div>
          {#if !canSlack}
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Slack alerts require Pro or Team.</div>
              <a href={upgradeHref} rel="external noopener noreferrer" target="_blank" style="font-family:var(--font-mono);font-size:11px;color:var(--green);font-weight:700;text-decoration:none;white-space:nowrap">Upgrade →</a>
            </div>
            <input type="hidden" name="slack_webhook" value={script.slack_webhook ?? ''} />
          {:else}
            <input id="slack_webhook" class="dash-input" name="slack_webhook" type="url" placeholder="https://hooks.slack.com/services/..." value={script.slack_webhook ?? ''} style={!enabled ? 'opacity:0.5' : ''} />
            <div class="dash-input-hint">Paste your Slack incoming webhook URL</div>
          {/if}
        </div>

        <!-- Email — all plans -->
        <div style="margin-bottom:20px">
          <label class="dash-form-label" for="alert_email">Alert email</label>
          <input id="alert_email" class="dash-input" name="alert_email" type="email" placeholder="you@example.com" value={script.alert_email ?? ''} style={!enabled ? 'opacity:0.5' : ''} />
          <div class="dash-input-hint">
            {plan === 'free' ? 'Email alerts included on all plans' : 'Available on all plans'}
          </div>
        </div>

        <button type="submit" class="dash-btn dash-btn-primary" style="width:100%" disabled={savingSettings}>
          {savingSettings ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>

    <!-- Public status page -->
    <div class="dash-card" style="padding:24px">
      <div class="dash-card-title" style="margin-bottom:4px">Public status page</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Share a read-only view of this script's uptime with anyone</div>

      <DashAlert type="error"   message={form?.shareError} />
      <DashAlert type="success" message={form?.revokeSuccess ? 'Share link revoked.' : null} />

      {#if shareToken}
        <div style="background:var(--surface2);border:1px solid var(--green-mid);border-radius:10px;padding:14px 16px;margin-bottom:14px">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--green);margin-bottom:8px;font-weight:700">✓ Status page active</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text);word-break:break-all;margin-bottom:10px">{shareUrl}</div>
          <div style="display:flex;gap:8px">
            <button class="dash-btn dash-btn-primary" style="font-size:11px;padding:6px 14px" onclick={copyShareUrl}>{copiedShare ? '✓ Copied' : 'Copy link'}</button>
            <a href="/s/{shareToken}" target="_blank" rel="noopener noreferrer" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:6px 14px;text-decoration:none">Preview →</a>
          </div>
        </div>
        <form method="POST" action="?/revokeShareLink" use:enhance>
          <button type="submit" class="dash-btn dash-btn-ghost" style="font-size:11px;color:var(--muted)">Revoke link</button>
        </form>
      {:else}
        <p style="font-family:var(--font-mono);font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:16px">
          Generate a public link to share this script's uptime history. Anyone with the link can view it — no login required.
        </p>
        <form method="POST" action="?/generateShareLink" use:enhance={() => { generatingShare = true; return async ({ update }) => { await update({ reset: false }); generatingShare = false } }}>
          <button type="submit" class="dash-btn dash-btn-primary" style="width:100%" disabled={generatingShare}>
            {generatingShare ? 'Generating...' : 'Generate status page'}
          </button>
        </form>
      {/if}
    </div>

  </div>

  <!-- Recent runs -->
  <div class="dash-card">
    <div class="dash-card-inner-header">
      <div>
        <div class="dash-card-title">Recent runs</div>
        <div class="dash-card-sub">last 10 executions for this script</div>
      </div>
      <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:{pr === '—' ? 'var(--muted)' : parseInt(pr) >= 95 ? 'var(--green)' : parseInt(pr) >= 80 ? '#d97706' : 'var(--red)'}">
        {pr} pass rate
      </div>
    </div>
    <table class="dash-table">
      <thead>
        <tr><th>Status</th><th>Duration</th><th>Error</th><th>When</th><th></th></tr>
      </thead>
      <tbody>
        {#each recent as ex (ex.id)}
          <tr onclick={() => navigateToExecution(ex.id)} style="cursor:pointer">
            <td><StatusBadge status={ex.status} /></td>
            <td class="dash-table-muted">{formatDuration(ex.duration_ms)}</td>
            <td>
              {#if ex.error}
                <div class="dash-table-err">{ex.error}</div>
              {:else}
                <span class="dash-table-muted">—</span>
              {/if}
            </td>
            <td class="dash-table-muted">{formatRelative(ex.started_at)}</td>
            <td><span class="dash-table-arrow">View</span></td>
          </tr>
        {:else}
          <tr><td colspan="5"><div class="dash-empty">No runs yet</div></td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>