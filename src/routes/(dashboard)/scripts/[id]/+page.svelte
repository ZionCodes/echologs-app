<script>
  import { enhance } from '$app/forms'
  import { goto }    from '$app/navigation'
  import PageHeader  from '$lib/components/dashboard/PageHeader.svelte'
  import StatusBadge from '$lib/components/dashboard/StatusBadge.svelte'
  import DashAlert   from '$lib/components/dashboard/DashAlert.svelte'
  import { passRate, formatDuration, formatRelative } from '$lib/utils/format.js'

  let { data, form } = $props()
  let { script, recent, total, pass } = $derived(data)

  let loading        = $state(false)
  let deleting       = $state(false)
  let showDeleteModal = $state(false)
  let enabledOverride = $state(null)
  let enabled = $derived(
    enabledOverride !== null
      ? enabledOverride
      : (script.slack_alerts_enabled ?? true)
  )
  let pr = $derived(passRate(pass, total))

  function toggleEnabled() { enabledOverride = !enabled }

  $effect(() => {
    if (form?.success) enabledOverride = null
  })
</script>

<svelte:head><title>{script.name} — EchoLogs</title></svelte:head>

<!-- Delete confirmation modal -->
{#if showDeleteModal}
  <div style="
    position:fixed;inset:0;z-index:999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.6);backdrop-filter:blur(4px);
    padding:24px;
  ">
    <div style="
      background:var(--surface);border:1px solid var(--border);
      border-radius:16px;padding:32px;max-width:440px;width:100%;
      box-shadow:0 32px 80px rgba(0,0,0,.4);
    ">
      <div style="font-size:28px;margin-bottom:16px">⚠️</div>

      <div style="font-family:var(--font-sans);font-size:1.1rem;font-weight:800;margin-bottom:8px">
        Delete "{script.name}"?
      </div>

      <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:8px">
        This will permanently delete:
      </div>

      <div style="background:var(--red-dim);border:1px solid #dc262630;border-radius:10px;padding:14px 16px;margin-bottom:20px">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--red);line-height:1.9">
          · The script <strong>{script.name}</strong><br>
          · All <strong>{total.toLocaleString()} executions</strong> and their logs<br>
          · All Slack alert settings for this script
        </div>
      </div>

      <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:24px">
        This cannot be undone. Your plan slot will be freed — you can create a new script.
      </div>

      <div style="display:flex;gap:10px">
        <!-- Cancel -->
        <button
          class="dash-btn dash-btn-ghost"
          style="flex:1"
          onclick={() => showDeleteModal = false}
          disabled={deleting}
        >
          Cancel
        </button>

        <!-- Confirm delete -->
        <form
          method="POST"
          action="?/deleteScript"
          style="flex:1"
          use:enhance={() => {
            deleting = true
            return async ({ update }) => { await update() }
          }}
        >
          <button
            type="submit"
            class="dash-btn dash-btn-danger"
            style="width:100%;justify-content:center"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Yes, delete it'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<PageHeader
  title={script.name}
  sub="{total.toLocaleString()} total runs · {pr} pass rate"
>
  {#snippet children()}
    <button
      class="dash-btn dash-btn-danger"
      onclick={() => showDeleteModal = true}
    >
      Delete script
    </button>
    <a href="/scripts" class="dash-btn dash-btn-ghost">Back</a>
  {/snippet}
</PageHeader>

<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:14px;align-items:start">

  <!-- Settings card -->
  <div class="dash-card" style="padding:24px">
    <div class="dash-card-title" style="margin-bottom:4px">Slack Alerts</div>
    <div class="dash-card-sub" style="margin-bottom:20px">Post to Slack when this script fails</div>

    <DashAlert type="error"   message={form?.error} />
    <DashAlert type="success" message={form?.success ? form.message : null} />

    <form
      method="POST"
      action="?/saveSettings"
      use:enhance={() => {
        loading = true
        return async ({ update }) => { await update(); loading = false }
      }}
    >
      <!-- Toggle row -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
        <div>
          <div style="font-family:var(--font-sans);font-size:13px;font-weight:700">
            Notifications {enabled ? 'enabled' : 'disabled'}
          </div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px">
            {enabled ? 'Will POST to Slack on failure' : 'Alerts paused — good for testing'}
          </div>
        </div>

        <input type="hidden" name="slack_alerts_enabled" value={String(enabled)} />

        <button
          type="button"
          onclick={toggleEnabled}
          style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;background:{enabled ? 'var(--green)' : 'var(--border)'}"
          aria-label="Toggle notifications"
        >
          <span style="position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;left:{enabled ? '23px' : '3px'}"></span>
        </button>
      </div>

      <!-- Webhook URL -->
      <div style="margin-bottom:16px">
        <label class="dash-form-label" for="slack_webhook">Webhook URL</label>
        <input
          id="slack_webhook"
          class="dash-input"
          name="slack_webhook"
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={script.slack_webhook ?? ''}
          style={!enabled ? 'opacity:0.5' : ''}
        />
        <div class="dash-input-hint">
          {#if !enabled}
            Alerts paused — URL saved but not used until re-enabled.
          {:else}
            Failures POST to this webhook. Clear to remove.
          {/if}
        </div>
      </div>

      <button type="submit" class="dash-btn dash-btn-primary" style="width:100%" disabled={loading}>
        {loading ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  </div>

  <!-- Recent runs -->
  <div class="dash-card">
    <div class="dash-card-inner-header">
      <div class="dash-card-title">Recent runs</div>
      <div class="dash-card-sub">last 10 executions for this script</div>
    </div>
    <table class="dash-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Duration</th>
          <th>Error</th>
          <th>When</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each recent as ex}
          <tr onclick={() => goto(`/executions/${ex.id}`)}>
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
          <tr>
            <td colspan="5">
              <div class="dash-empty">No runs yet</div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

</div>