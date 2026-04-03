<script>
  import { goto }    from '$app/navigation'
  import StatusBadge from '$lib/components/dashboard/StatusBadge.svelte'
  import { formatDuration, formatAbsolute } from '$lib/utils/format.js'

  let { data }                        = $props()
  let { ex, prevId, nextId, history } = $derived(data)

  let searchQuery = $state('')
  let copied      = $state(false)

  // Merge all streams into one unified log like a real console
  let unifiedLog = $derived(() => {
    const lines = []

    if (ex.stdout) {
      ex.stdout.split('\n').forEach((text, i) => {
        if (text || i < ex.stdout.split('\n').length - 1) {
          lines.push({ stream: 'stdout', text })
        }
      })
    }

    if (ex.stderr) {
      ex.stderr.split('\n').forEach((text, i) => {
        if (text || i < ex.stderr.split('\n').length - 1) {
          lines.push({ stream: 'stderr', text })
        }
      })
    }

    if (ex.error) {
      ex.error.split('\n').forEach((text, i) => {
        if (text || i < ex.error.split('\n').length - 1) {
          lines.push({ stream: 'error', text })
        }
      })
    }

    return lines
  })

  let filteredLines = $derived(() => {
    const all = unifiedLog()
    if (!searchQuery.trim()) return all.map((l, i) => ({ ...l, n: i + 1, match: false }))
    const q = searchQuery.toLowerCase()
    return all.map((l, i) => ({ ...l, n: i + 1, match: l.text.toLowerCase().includes(q) }))
  })

  let matchCount = $derived(filteredLines().filter(l => l.match).length)

  function lineColor(line) {
    if (line.stream === 'error') return '#ff6b6b'
    if (line.stream === 'stderr') return '#d97706'
    const t = line.text.toLowerCase()
    if (t.includes('error') || t.includes('exception') || t.includes('traceback') || t.includes('fail')) return '#ff8585'
    if (t.includes('warning') || t.includes('warn')) return '#d97706'
    if (t.includes('success') || t.includes('done') || t.includes('complete') || t.includes(' ok') || t.startsWith('ok')) return '#69db7c'
    return '#e6edf3'
  }

  function streamLabel(stream) {
    if (stream === 'stderr') return 'ERR'
    if (stream === 'error')  return 'EXC'
    return null
  }

  let maxDuration = $derived(Math.max(...(history?.map(h => h.duration_ms ?? 0) ?? [1])))

  function barHeight(ms) {
    if (!ms || maxDuration === 0) return 4
    return Math.max(4, Math.round((ms / maxDuration) * 40))
  }

  function copyAll() {
    const text = unifiedLog().map(l => l.text).join('\n')
    navigator.clipboard.writeText(text)
    copied = true
    setTimeout(() => { copied = false }, 2000)
  }
</script>

<svelte:head><title>{ex.scripts?.name ?? 'Execution'} — EchoLogs</title></svelte:head>

<!-- Header -->
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:16px">
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <h1 style="font-family:var(--font-sans);font-size:1.5rem;font-weight:800;margin:0">{ex.scripts?.name ?? 'Execution'}</h1>
      <StatusBadge status={ex.status} />
    </div>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">{formatAbsolute(ex.started_at)} · {formatDuration(ex.duration_ms)}</div>
  </div>
  <div style="display:flex;gap:8px;flex-shrink:0;align-items:center">
    {#if prevId}
      <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" onclick={() => goto(`/executions/${prevId}`)}>← Prev</button>
    {/if}
    {#if nextId}
      <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" onclick={() => goto(`/executions/${nextId}`)}>Next →</button>
    {/if}
    <a href="/executions" class="dash-btn dash-btn-ghost">Back</a>
  </div>
</div>

<!-- Meta cards -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
  {#each [
    { label: 'Script',   value: ex.scripts?.name ?? '—',       special: false },
    { label: 'Status',   value: ex.status,                      special: true  },
    { label: 'Duration', value: formatDuration(ex.duration_ms), special: false },
    { label: 'Run at',   value: formatAbsolute(ex.started_at),  special: false },
  ] as m (m.label)}
    <div class="dash-card" style="padding:16px 20px">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">{m.label}</div>
      {#if m.special}
        <StatusBadge status={ex.status} />
      {:else}
        <div style="font-family:var(--font-sans);font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{m.value}</div>
      {/if}
    </div>
  {/each}
</div>

<!-- Duration sparkline -->
{#if history && history.length > 1}
  <div class="dash-card" style="padding:16px 20px;margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted)">Duration — last {history.length} runs</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">
        avg {formatDuration(Math.round(history.reduce((a, h) => a + (h.duration_ms ?? 0), 0) / history.length))}
        · max {formatDuration(maxDuration)}
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:3px;height:48px">
      {#each history as h, i (i)}
        {@const isCurrent = h.started_at === ex.started_at}
        <div
          style="flex:1;height:{barHeight(h.duration_ms)}px;background:{isCurrent ? 'var(--green)' : h.status === 'fail' ? 'var(--red)' : 'var(--surface2)'};border:1px solid {isCurrent ? 'var(--green)' : h.status === 'fail' ? 'var(--red)' : 'var(--border)'};border-radius:3px;transition:opacity .15s"
          title="{formatDuration(h.duration_ms)} — {h.status}"
        ></div>
      {/each}
    </div>
  </div>
{/if}

<!-- Unified console output -->
{#if unifiedLog().length > 0}
  <div class="dash-card" style="overflow:hidden">

    <!-- Toolbar -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:#161b22;gap:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="display:flex;gap:5px">
          <div style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#febc2e"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#28c840"></div>
        </div>
        <span style="font-family:var(--font-mono);font-size:11px;color:#8b949e;margin-left:4px">
          {ex.scripts?.name ?? 'output'} · {unifiedLog().length} lines
        </span>
        {#if ex.stderr || ex.error}
          <div style="display:flex;gap:6px;margin-left:8px">
            {#if ex.stdout}
              <span style="font-family:var(--font-mono);font-size:9px;color:#e6edf3;background:#ffffff10;padding:2px 7px;border-radius:4px">stdout</span>
            {/if}
            {#if ex.stderr}
              <span style="font-family:var(--font-mono);font-size:9px;color:#d97706;background:#d9770615;padding:2px 7px;border-radius:4px">stderr</span>
            {/if}
            {#if ex.error}
              <span style="font-family:var(--font-mono);font-size:9px;color:#ff6b6b;background:#ff6b6b15;padding:2px 7px;border-radius:4px">exception</span>
            {/if}
          </div>
        {/if}
      </div>

      <div style="display:flex;align-items:center;gap:8px">
        <input
          class="dash-input"
          style="height:28px;padding:0 10px;font-size:11px;width:200px;background:#0d1117;border-color:#30363d"
          type="text"
          placeholder="Search output..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <span style="font-family:var(--font-mono);font-size:10px;color:{matchCount > 0 ? 'var(--green)' : 'var(--muted)'};white-space:nowrap">
            {matchCount} match{matchCount !== 1 ? 'es' : ''}
          </span>
        {/if}
        <button
          onclick={copyAll}
          style="font-family:var(--font-mono);font-size:10px;color:#8b949e;background:transparent;border:1px solid #30363d;border-radius:5px;padding:3px 10px;cursor:pointer;transition:all .15s;white-space:nowrap"
        >
          {copied ? '✓ Copied' : 'Copy all'}
        </button>
      </div>
    </div>

    <!-- Log lines -->
    <div style="background:#0d1117;overflow-x:auto;max-height:600px;overflow-y:auto">
      <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:12px;line-height:1.7">
        <tbody>
          {#each filteredLines() as line (line.n)}
            {@const hide = searchQuery.trim() && !line.match}
            {#if !hide}
              <tr style="background:{line.match && searchQuery ? 'rgba(255,220,0,.05)' : 'transparent'}">
                <!-- Line number -->
                <td style="padding:0 10px;color:#3d4e5e;user-select:none;text-align:right;min-width:42px;border-right:1px solid #1e2733;vertical-align:top;padding-top:1px;font-size:11px">{line.n}</td>
                <!-- Stream label -->
                <td style="padding:0 8px;vertical-align:top;padding-top:2px;user-select:none;min-width:36px">
                  {#if streamLabel(line.stream)}
                    <span style="font-size:9px;font-weight:700;color:{line.stream === 'error' ? '#ff6b6b' : '#d97706'};opacity:0.7">{streamLabel(line.stream)}</span>
                  {/if}
                </td>
                <!-- Content -->
                <td style="padding:1px 16px;color:{lineColor(line)};white-space:pre-wrap;word-break:break-all">{line.text}</td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

  </div>
{:else}
  <div class="dash-card">
    <div class="dash-empty">No log output captured for this execution.</div>
  </div>
{/if}