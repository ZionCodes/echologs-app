<script>
  import { onMount }                        from 'svelte'
  import { formatRelative, formatDuration } from '$lib/utils/format.js'

  let { data }                        = $props()
  let { script, stats, days, recent } = $derived(data)

  let theme = $state('dark')

  // Track which execution rows are expanded
  let expanded = $state(new Set())

  function toggleExpand(id) {
    const next = new Set(expanded)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    expanded = next
  }

  onMount(() => {
    const saved = localStorage.getItem('theme') ?? 'dark'
    theme = saved
    document.documentElement.classList.toggle('dark', saved === 'dark')
  })

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }

  function dayColor(day) {
    if (day.total === 0)                return 'var(--border)'
    if (day.fail > 0 && day.pass === 0) return 'var(--red)'
    if (day.fail > 0 && day.pass > 0)   return '#d97706'
    return 'var(--green)'
  }

  function dayOpacity(day) {
    if (day.total === 0) return '1'
    return String(Math.min(1, 0.5 + (day.total / 8) * 0.5))
  }

  function hasLogs(run) {
    return !!(run.stdout || run.stderr || run.error)
  }

  let uptimeColor = $derived(
    stats.uptime === null ? 'var(--text)' :
    stats.uptime >= 95   ? 'var(--green)' :
    stats.uptime >= 80   ? '#d97706' :
    'var(--red)'
  )
</script>

<svelte:head>
  <title>{script.name} — Status — EchoLogs</title>
  <meta name="description" content="Public status page for {script.name} on EchoLogs" />
</svelte:head>

<style>
  .log-block {
    background: #060a0d;
    border-radius: 8px;
    padding: 14px 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    line-height: 1.8;
    color: #7a9eae;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
    margin-top: 8px;
  }
  .log-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted2);
    margin-bottom: 4px;
    margin-top: 12px;
  }
  .log-label:first-child { margin-top: 0; }
  .err-text { color: #ff4757; }
  .expand-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    transition: color .15s;
  }
  .expand-btn:hover { color: var(--green); }
</style>

<div style="min-height:100vh;background:var(--bg);color:var(--text);padding:48px 24px">
  <div style="max-width:800px;margin:0 auto">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40px">
      <div style="display:flex;align-items:center;gap:10px">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#080b0f"/>
          <circle cx="9" cy="16" r="3" fill="#00e57a"/>
          <rect x="15" y="14" width="10" height="2" rx="1" fill="#00e57a" opacity="0.6"/>
          <rect x="15" y="18" width="7" height="2" rx="1" fill="#00e57a" opacity="0.3"/>
        </svg>
        <a href="https://echologs.com" style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:var(--green);text-decoration:none">echologs</a>
        <span style="color:var(--border);font-size:14px">/</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:var(--muted)">status</span>
      </div>
      <button
        onclick={toggleTheme}
        style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:border-color .2s"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>

    <!-- Script name + overall status -->
    <div style="margin-bottom:40px">
      <h1 style="font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px">{script.name}</h1>
      <div style="display:flex;align-items:center;gap:10px">
        {#if stats.uptime === null}
          <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted)">No data yet</span>
        {:else if stats.uptime >= 95}
          <div style="display:flex;align-items:center;gap:6px;background:var(--green-dim);border:1px solid var(--green-mid);border-radius:20px;padding:4px 14px">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block"></span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;color:var(--green)">Operational</span>
          </div>
        {:else if stats.uptime >= 80}
          <div style="display:flex;align-items:center;gap:6px;background:#d9770618;border:1px solid #d9770640;border-radius:20px;padding:4px 14px">
            <span style="width:6px;height:6px;border-radius:50%;background:#d97706;display:inline-block"></span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;color:#d97706">Degraded</span>
          </div>
        {:else}
          <div style="display:flex;align-items:center;gap:6px;background:var(--red-dim);border:1px solid #dc262640;border-radius:20px;padding:4px 14px">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--red);display:inline-block"></span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;color:var(--red)">Disrupted</span>
          </div>
        {/if}
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted)">last 60 days</span>
      </div>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">
      {#each [
        { label: 'Uptime',       value: stats.uptime !== null ? `${stats.uptime}%` : '—',       color: uptimeColor },
        { label: 'Total runs',   value: stats.total.toLocaleString(),                            color: 'var(--text)' },
        { label: 'Failures',     value: stats.failed.toLocaleString(),                           color: stats.failed > 0 ? 'var(--red)' : 'var(--green)' },
        { label: 'Avg duration', value: stats.avgMs != null ? formatDuration(stats.avgMs) : '—', color: 'var(--text)' },
      ] as stat (stat.label)}
        <div class="dash-card" style="padding:16px 20px">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">{stat.label}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:700;color:{stat.color}">{stat.value}</div>
        </div>
      {/each}
    </div>

    <!-- 60-day grid -->
    <div class="dash-card" style="padding:24px;margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700">Last 60 days</div>
        <div style="display:flex;align-items:center;gap:12px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted)">
          <span style="display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;border-radius:2px;background:var(--green);display:inline-block"></span>All passed
          </span>
          <span style="display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;border-radius:2px;background:#d97706;display:inline-block"></span>Some failed
          </span>
          <span style="display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;border-radius:2px;background:var(--red);display:inline-block"></span>All failed
          </span>
          <span style="display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;border-radius:2px;background:var(--border);display:inline-block"></span>No runs
          </span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(60,1fr);gap:2px">
        {#each days as day (day.date)}
          <div
            style="aspect-ratio:1;border-radius:2px;background:{dayColor(day)};opacity:{dayOpacity(day)}"
            title="{day.date}: {day.total} run{day.total !== 1 ? 's' : ''} · {day.pass} passed · {day.fail} failed"
          ></div>
        {/each}
      </div>
    </div>

    <!-- Recent runs with collapsible logs -->
    {#if recent.length > 0}
      <div class="dash-card" style="overflow:hidden;margin-bottom:32px">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700">Recent runs</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted)">
            Click a row to view logs
          </div>
        </div>

        {#each recent as run, i (run.id)}
          {@const isExpanded = expanded.has(run.id)}
          {@const hasLog     = hasLogs(run)}

          <div style="border-bottom:1px solid {i < recent.length - 1 ? 'var(--border)' : 'transparent'}">

            <!-- Run summary row -->
            <div
              style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;{hasLog ? 'cursor:pointer' : ''};transition:background .1s"
              role={hasLog ? 'button' : undefined}
              tabindex={hasLog ? 0 : undefined}
              onclick={() => hasLog && toggleExpand(run.id)}
              onkeydown={(e) => { if (hasLog && (e.key === 'Enter' || e.key === ' ')) toggleExpand(run.id) }}
              onmouseenter={(e) => { if (hasLog) e.currentTarget.style.background = 'var(--surface2)' }}
              onmouseleave={(e) => { if (hasLog) e.currentTarget.style.background = 'transparent' }}
            >
              <!-- Status -->
              <div style="display:flex;align-items:center;gap:10px;min-width:80px">
                <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:{run.status === 'pass' ? 'var(--green)' : 'var(--red)'}"></div>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:{run.status === 'pass' ? 'var(--green)' : 'var(--red)'}">{run.status}</span>
              </div>

              <!-- Duration -->
              <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted)">
                {run.duration_ms != null ? formatDuration(run.duration_ms) : '—'}
              </div>

              <!-- Time -->
              <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted)">
                {formatRelative(run.started_at)}
              </div>

              <!-- Expand toggle -->
              <div style="min-width:80px;text-align:right">
                {#if hasLog}
                  <button class="expand-btn">
                    <span style="transform:{isExpanded ? 'rotate(180deg)' : 'rotate(0)'};display:inline-block;transition:transform .2s">▾</span>
                    {isExpanded ? 'Hide logs' : 'View logs'}
                  </button>
                {:else}
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted2)">no logs</span>
                {/if}
              </div>
            </div>

            <!-- Collapsible logs -->
            {#if isExpanded && hasLog}
              <div style="padding:0 20px 16px;border-top:1px solid var(--border);background:var(--surface2)">

                {#if run.error}
                  <div class="log-label">Error</div>
                  <div class="log-block err-text">{run.error}</div>
                {/if}

                {#if run.stdout}
                  <div class="log-label">stdout</div>
                  <div class="log-block">{run.stdout}</div>
                {/if}

                {#if run.stderr}
                  <div class="log-label">stderr</div>
                  <div class="log-block err-text">{run.stderr}</div>
                {/if}

              </div>
            {/if}

          </div>
        {/each}
      </div>
    {/if}

    <!-- Footer -->
    <div style="text-align:center;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted)">
      Powered by <a href="https://echologs.com" style="color:var(--green);text-decoration:none">EchoLogs</a>
    </div>

  </div>
</div>