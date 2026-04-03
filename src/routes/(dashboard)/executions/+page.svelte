<script>
  import { onMount, onDestroy } from 'svelte'
  import { goto }               from '$app/navigation'
  import { page }               from '$app/stores'
  import PageHeader      from '$lib/components/dashboard/PageHeader.svelte'
  import LiveBadge       from '$lib/components/dashboard/LiveBadge.svelte'
  import ExecutionsTable from '$lib/components/dashboard/ExecutionsTable.svelte'
  import { POLAR_CHECKOUT_LINKS } from '$lib/polar.js'

  let { data } = $props()
  let { executions, total, scriptStats, plan } = $derived(data)

  let liveRows     = $state([])
  let connected    = $state(false)
  let channel
  let searchTimer

  let canRealtime  = $derived(plan === 'pro' || plan === 'team')
  let upgradeHref  = POLAR_CHECKOUT_LINKS.pro_monthly

  let activeFilter = $state($page.url.searchParams.get('status') ?? 'all')
  let searchInput  = $state($page.url.searchParams.get('search') ?? '')
  let fromInput    = $state($page.url.searchParams.get('from')   ?? '')
  let toInput      = $state($page.url.searchParams.get('to')     ?? '')
  let activeScript = $state('')

  let totalPages = $derived(Math.ceil(total / 20))
  let curPage    = $derived(parseInt($page.url.searchParams.get('page') ?? '1'))
  let hasFilters = $derived(searchInput !== '' || fromInput !== '' || toInput !== '' || activeFilter !== 'all')

  function buildUrl(overrides = {}) {
    const u = new URL($page.url)
    const params = { status: activeFilter, search: searchInput, from: fromInput, to: toInput, ...overrides }
    u.searchParams.delete('page')
    Object.entries(params).forEach(([k, v]) => {
      v && v !== 'all' ? u.searchParams.set(k, v) : u.searchParams.delete(k)
    })
    return u.toString()
  }

  function setFilter(f)   { activeFilter = f; liveRows = []; goto(buildUrl({ status: f }), { replaceState: true }) }
  function onDateChange() { goto(buildUrl(), { replaceState: true }) }
  function goToPage(p)    { const u = new URL($page.url); u.searchParams.set('page', String(p)); goto(u.toString()) }

  function onSearchInput() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => goto(buildUrl({ search: searchInput }), { replaceState: true }), 400)
  }

  function filterByScript(name) {
    if (activeScript === name) { activeScript = ''; searchInput = '' }
    else { activeScript = name; searchInput = name }
    goto(buildUrl({ search: searchInput }), { replaceState: true })
  }

  function clearFilters() {
    activeFilter = 'all'; searchInput = ''; fromInput = ''; toInput = ''; activeScript = ''; liveRows = []
    goto('/executions', { replaceState: true })
  }

  onMount(() => {
    if (!canRealtime) return
    channel = data.supabase
      .channel('executions-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'executions' }, ({ new: row }) => {
        if (activeFilter === 'all' || activeFilter === row.status) liveRows = [row, ...liveRows]
      })
      .subscribe(s => { connected = s === 'SUBSCRIBED' })
  })

  onDestroy(() => channel?.unsubscribe())
</script>

<svelte:head><title>Executions — EchoLogs</title></svelte:head>

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <div>
    <h1 style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;margin:0 0 4px">Executions</h1>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">{total.toLocaleString()} total executions</div>
  </div>
  {#if canRealtime}
    <LiveBadge {connected} />
  {:else}
    <a href={upgradeHref} rel="external noopener noreferrer" target="_blank" style="font-family:var(--font-mono);font-size:10px;color:var(--muted);text-decoration:none;background:var(--surface2);border:1px solid var(--border);padding:4px 12px;border-radius:20px;display:flex;align-items:center;gap:6px">
      <span style="width:6px;height:6px;border-radius:50%;background:var(--border);display:inline-block"></span>
      Realtime — Pro+
    </a>
  {/if}
</div>

{#if scriptStats?.length > 0}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-bottom:16px">
    {#each scriptStats as s (s.id)}
      <button onclick={() => filterByScript(s.name)} style="background:{activeScript === s.name ? 'var(--green-dim)' : 'var(--surface)'};border:1px solid {activeScript === s.name ? 'var(--green)' : 'var(--border)'};border-radius:12px;padding:14px 16px;text-align:left;cursor:pointer;transition:border-color .15s,background .15s;width:100%">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-family:var(--font-sans);font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px">{s.name}</div>
          <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:{s.passRate == null ? 'var(--muted)' : s.passRate >= 95 ? 'var(--green)' : s.passRate >= 80 ? '#d97706' : 'var(--red)'}">
            {s.passRate !== null ? `${s.passRate}%` : '—'}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">{s.thisWeek} this week</div>
          {#if s.weekTrend !== 0}
            <div style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:{s.weekTrend > 0 ? 'var(--green)' : 'var(--red)'}">
              {s.weekTrend > 0 ? '+' : ''}{s.weekTrend}
            </div>
          {/if}
        </div>
        {#if s.latestRun}
          <div style="margin-top:6px;display:flex;align-items:center;gap:5px">
            <div style="width:5px;height:5px;border-radius:50%;flex-shrink:0;background:{s.latestRun.status === 'pass' ? 'var(--green)' : 'var(--red)'}"></div>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--muted2)">last run {s.latestRun.status}</span>
          </div>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<div class="dash-card">
  <div class="dash-card-inner-header">
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
      <div style="flex:1;min-width:160px">
        <div class="dash-form-label" style="margin-bottom:5px">Search</div>
        <input class="dash-input" style="height:36px;padding:0 12px" type="text" placeholder="Script name..." bind:value={searchInput} oninput={onSearchInput} />
      </div>
      <div>
        <div class="dash-form-label" style="margin-bottom:5px">From</div>
        <input class="dash-input" style="height:36px;padding:0 12px;width:148px" type="date" bind:value={fromInput} onchange={onDateChange} />
      </div>
      <div>
        <div class="dash-form-label" style="margin-bottom:5px">To</div>
        <input class="dash-input" style="height:36px;padding:0 12px;width:148px" type="date" bind:value={toInput} onchange={onDateChange} />
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        {#each ['all', 'pass', 'fail'] as f (f)}
          <button class="dash-filter" class:active={activeFilter === f} onclick={() => setFilter(f)}>{f}</button>
        {/each}
      </div>
      {#if hasFilters}
        <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px;height:36px" onclick={clearFilters}>Clear</button>
      {/if}
    </div>
  </div>

  {#if hasFilters}
    <div style="padding:10px 20px;font-family:var(--font-mono);font-size:11px;color:var(--muted);border-bottom:1px solid var(--border)">
      {total.toLocaleString()} result{total !== 1 ? 's' : ''}
      {#if searchInput}· matching "<strong style="color:var(--text)">{searchInput}</strong>"{/if}
    </div>
  {/if}

  <ExecutionsTable rows={executions} {liveRows} />

  {#if totalPages > 1}
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border)">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Page {curPage} of {totalPages} · {total} total</span>
      <div style="display:flex;gap:6px">
        <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" disabled={curPage <= 1} onclick={() => goToPage(curPage - 1)}>Prev</button>
        <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" disabled={curPage >= totalPages} onclick={() => goToPage(curPage + 1)}>Next</button>
      </div>
    </div>
  {/if}
</div>