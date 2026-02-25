<script>
  import { onMount, onDestroy } from 'svelte'
  import { goto }               from '$app/navigation'
  import { page }               from '$app/stores'
  import PageHeader      from '$lib/components/dashboard/PageHeader.svelte'
  import LiveBadge       from '$lib/components/dashboard/LiveBadge.svelte'
  import ExecutionsTable from '$lib/components/dashboard/ExecutionsTable.svelte'

  let { data } = $props()
  let { executions, total } = $derived(data)

  let liveRows        = $state([])
  let connected       = $state(false)
  let activeFilter    = $state('all')
  let channel

  // Keep activeFilter in sync with URL param
  let urlFilter = $derived($page.url.searchParams.get('status') ?? 'all')
  $effect(() => { activeFilter = urlFilter })

  let totalPages = $derived(Math.ceil(total / 20))
  let curPage    = $derived(parseInt($page.url.searchParams.get('page') ?? '1'))

  function setFilter(f) {
    activeFilter = f
    const u = new URL($page.url)
    f === 'all' ? u.searchParams.delete('status') : u.searchParams.set('status', f)
    u.searchParams.delete('page')
    goto(u.toString(), { replaceState: true })
  }

  function goToPage(p) {
    const u = new URL($page.url)
    u.searchParams.set('page', String(p))
    if (activeFilter !== 'all') u.searchParams.set('status', activeFilter)
    goto(u.toString())
  }

  onMount(() => {
    channel = data.supabase
      .channel('executions-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'executions' },
        ({ new: row }) => {
          if (activeFilter === 'all' || activeFilter === row.status) {
            liveRows = [row, ...liveRows]
          }
        }
      )
      .subscribe(s => { connected = s === 'SUBSCRIBED' })
  })

  onDestroy(() => channel?.unsubscribe())
</script>
  
  <svelte:head><title>Executions — EchoLogs</title></svelte:head>
  
  <PageHeader title="Executions" sub="{total.toLocaleString()} total executions">
    {#snippet children()}
      <LiveBadge {connected} />
    {/snippet}
  </PageHeader>
  
  <div class="dash-card">
  
    <div class="dash-card-inner-header">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div class="dash-card-title">All executions</div>
          <div class="dash-card-sub">click any row to see full logs</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          {#each ['all', 'pass', 'fail'] as f}
            <button class="dash-filter" class:active={activeFilter === f} onclick={() => setFilter(f)}>
              {f}
            </button>
          {/each}
        </div>
      </div>
    </div>
  
    <ExecutionsTable rows={executions} {liveRows} />
  
    {#if totalPages > 1}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border)">
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">
          Page {curPage} of {totalPages} · {total} total
        </span>
        <div style="display:flex;gap:6px">
          <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" disabled={curPage <= 1} onclick={() => goToPage(curPage - 1)}>Prev</button>
          <button class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 12px" disabled={curPage >= totalPages} onclick={() => goToPage(curPage + 1)}>Next</button>
        </div>
      </div>
    {/if}
  
  </div>