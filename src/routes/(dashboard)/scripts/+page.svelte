<script>
  import { page }   from '$app/stores'
  import { goto }   from '$app/navigation'
  import DashAlert  from '$lib/components/dashboard/DashAlert.svelte'
  import { passRate, formatDuration, formatRelative } from '$lib/utils/format.js'

  let { data }    = $props()
  let { scripts } = $derived(data)

  let deleted = $derived($page.url.searchParams.get('deleted') === '1')

  function passRateColor(rate) {
    if (rate === null) return 'var(--muted)'
    if (rate >= 95) return 'var(--green)'
    if (rate >= 80) return '#d97706'
    return 'var(--red)'
  }
</script>

<svelte:head><title>Scripts — EchoLogs</title></svelte:head>

<style>
  .scripts-row {
    display: grid;
    grid-template-columns: 2fr 80px 100px 140px 160px 40px;
    align-items: center;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    text-align: left;
    cursor: pointer;
    transition: border-color .15s, background .15s;
    width: 100%;
    border: none;
  }
  .scripts-row:hover { border-color: var(--green); }

  /* Tablet — hide sparkline label col */
  @media (max-width: 1024px) {
    .scripts-row {
      grid-template-columns: 2fr 80px 110px 130px 40px;
    }
  }

  /* Mobile — full card layout, no grid */
  @media (max-width: 768px) {
    .scripts-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--border) !important;
      border-radius: 12px;
    }
    .scripts-row:hover { background: var(--surface2); }

    .col-name    { width: 100%; }
    .col-stats   { 
      display: grid; 
      grid-template-columns: 1fr 1fr 1fr; 
      width: 100%; 
      gap: 8px;
    }
    .col-arrow   { display: none; }
    .col-sparkline { width: 100%; }
  }
</style>

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <div>
    <h1 style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;margin:0 0 4px">Scripts</h1>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">Auto-created when you run a script via the SDK</div>
  </div>
</div>

<DashAlert type="success" message={deleted ? 'Script deleted. Your plan slot is now free.' : null} />

{#if scripts.length === 0}
  <div class="dash-card">
    <div class="dash-empty">No scripts yet — they appear automatically when you run a script using the SDK.</div>
  </div>
{:else}
  <div style="display:flex;flex-direction:column;gap:10px">
    {#each scripts as s (s.id)}
      <button
        onclick={() => goto(`/scripts/${s.id}`)}
        class="scripts-row"
        style="border:1px solid {s.streak >= 3 ? '#ff000044' : 'var(--border)'}"
      >
        <!-- Name + streak -->
        <div class="col-name">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
            <div style="font-family:var(--font-sans);font-size:14px;font-weight:700">{s.name}</div>
            {#if s.streak >= 3}
              <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#ff0000;background:#ff000018;border:1px solid #ff000040;padding:2px 7px;border-radius:20px">⚠ {s.streak}x failing</span>
            {:else if s.streak >= 1}
              <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--red);background:var(--red-dim);border:1px solid #dc262630;padding:2px 7px;border-radius:20px">failing</span>
            {/if}
          </div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">
            {s.total.toLocaleString()} run{s.total !== 1 ? 's' : ''}
            {#if s.latestRun}· last {formatRelative(s.latestRun.started_at)}{/if}
          </div>
        </div>

        <!-- Stats — inline on desktop, grid on mobile -->
        <div class="col-stats" style="display:contents">
          <!-- Pass rate -->
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:4px">Pass rate</div>
            <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:{passRateColor(s.passRate)}">
              {s.passRate !== null ? `${s.passRate}%` : '—'}
            </div>
          </div>

          <!-- Last duration -->
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:4px">Last duration</div>
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:600">
              {s.latestRun?.duration_ms != null ? formatDuration(s.latestRun.duration_ms) : '—'}
            </div>
          </div>

          <!-- Last status -->
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:6px">Last run</div>
            {#if s.latestRun}
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:7px;height:7px;border-radius:50%;background:{s.latestRun.status === 'pass' ? 'var(--green)' : 'var(--red)'}"></div>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:{s.latestRun.status === 'pass' ? 'var(--green)' : 'var(--red)'}">
                  {s.latestRun.status}
                </span>
              </div>
            {:else}
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">never</span>
            {/if}
          </div>

          <!-- Sparkline -->
          <div class="col-sparkline" style="grid-column:span 2">
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:6px">
              Last {s.sparkline.length} runs
            </div>
            <div style="display:flex;align-items:center;gap:3px">
              {#each s.sparkline as run, i (i)}
                <div style="width:8px;height:8px;border-radius:2px;background:{run.status === 'pass' ? 'var(--green)' : 'var(--red)'};opacity:0.85"
                  title="{run.status} — {formatRelative(run.started_at)}"></div>
              {/each}
              {#if s.sparkline.length === 0}
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">no runs</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="col-arrow" style="font-family:var(--font-mono);font-size:14px;color:var(--muted);text-align:right">→</div>

      </button>
    {/each}
  </div>
{/if}