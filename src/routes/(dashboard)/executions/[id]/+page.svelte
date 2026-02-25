<script>
    import PageHeader    from '$lib/components/dashboard/PageHeader.svelte'
    import StatusBadge   from '$lib/components/dashboard/StatusBadge.svelte'
    import TerminalBlock from '$lib/components/dashboard/TerminalBlock.svelte'
    import { formatDuration, formatAbsolute } from '$lib/utils/format.js'
  
    let { data } = $props()
    let { ex }   = $derived(data)
  
    let meta = $derived([
      { label: 'Script',   value: ex.scripts?.name ?? '—' },
      { label: 'Status',   value: ex.status },
      { label: 'Duration', value: formatDuration(ex.duration_ms) },
      { label: 'Run at',   value: formatAbsolute(ex.started_at) },
    ])
  </script>
  
  <svelte:head><title>{ex.scripts?.name ?? 'Execution'} — EchoLogs</title></svelte:head>
  
  <PageHeader
    title={ex.scripts?.name ?? 'Execution'}
    sub="{formatAbsolute(ex.started_at)} · {formatDuration(ex.duration_ms)}"
  >
    {#snippet children()}
      <StatusBadge status={ex.status} />
      <a href="/executions" class="dash-btn dash-btn-ghost">Back</a>
    {/snippet}
  </PageHeader>
  
  <!-- Meta cards -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    {#each meta as m}
      <div class="dash-card" style="padding:16px 20px">
        <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">
          {m.label}
        </div>
        <div style="font-family:var(--font-sans);font-size:14px;font-weight:700">
          {m.value}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Log output -->
  {#if ex.stdout || ex.stderr || ex.error}
    <div class="dash-card" style="padding:24px">
      <TerminalBlock label="stdout" text={ex.stdout} smartColor />
      <TerminalBlock
        label="stderr"
        text={ex.stderr}
        color="var(--amber, #d97706)"
        labelColor="var(--amber, #d97706)"
      />
      <TerminalBlock
        label="error"
        text={ex.error}
        color="var(--red)"
        labelColor="var(--red)"
      />
    </div>
  {:else}
    <div class="dash-card">
      <div class="dash-empty">No log output captured for this execution.</div>
    </div>
  {/if}