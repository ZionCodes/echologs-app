<script>
    import StatCard        from '$lib/components/dashboard/StatCard.svelte'
    import BarChart        from '$lib/components/dashboard/BarChart.svelte'
    import DonutChart      from '$lib/components/dashboard/DonutChart.svelte'
    import ExecutionsTable from '$lib/components/dashboard/ExecutionsTable.svelte'
    import ScriptCard      from '$lib/components/dashboard/ScriptCard.svelte'
    import PageHeader      from '$lib/components/dashboard/PageHeader.svelte'
    import SectionHeader   from '$lib/components/dashboard/SectionHeader.svelte'
    import { passRate, passRateColor, formatDuration, formatRelative } from '$lib/utils/format.js'
  
    let { data } = $props()
    let { stats, chartDays, recent, scripts, keys } = $derived(data)
    let passRatePct = $derived(passRate(stats.passed, stats.total))
  </script>
  
  <svelte:head><title>Dashboard — EchoLogs</title></svelte:head>
  
  <PageHeader
    title="Dashboard"
    sub="{stats.total.toLocaleString()} total executions · {scripts.length} scripts monitored"
  />
  
  <div class="grid grid-cols-4 gap-3 mb-5 fade-up">
    <StatCard label="Total Executions" value={stats.total.toLocaleString()} chip="all time" chipType="green" />
    <StatCard label="Pass Rate" value={passRatePct} valueColor={passRateColor(passRatePct)} chip="{stats.passed.toLocaleString()} passed" chipType="green" />
    <StatCard label="Failures" value={stats.failed.toLocaleString()} valueColor="var(--red)" chip={stats.failed > 0 ? 'needs attention' : 'all clear'} chipType={stats.failed > 0 ? 'red' : 'green'} />
    <StatCard label="Avg Duration" value={formatDuration(stats.avgDuration)} chip="per execution" chipType="amber" />
  </div>
  
  <div class="grid gap-3 mb-5 fade-up" style="grid-template-columns:1.8fr 1fr">
    <BarChart days={chartDays} />
    <DonutChart passed={stats.passed} failed={stats.failed} />
  </div>
  
  <div class="dash-card mb-5 fade-up">
    <div class="flex items-center justify-between p-5 pb-4">
      <div class="dash-card-title">Recent Executions</div>
      <a href="/executions" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:6px 14px">View all →</a>
    </div>
    <ExecutionsTable rows={recent} />
  </div>
  
  <SectionHeader title="Scripts" sub="Auto-created on first SDK execution">
    {#snippet children()}
      <a href="/scripts" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:6px 14px">View all →</a>
    {/snippet}
  </SectionHeader>
  
  <div class="grid grid-cols-3 gap-3 mb-5 fade-up">
    {#each scripts as s}
      <ScriptCard script={s} variant="avg" />
    {:else}
      <div class="dash-empty col-span-3">No scripts yet. Run a script with the SDK to get started.</div>
    {/each}
  </div>
  
  <SectionHeader title="API Keys" sub="Shown once — store them securely">
    {#snippet children()}
      <a href="/api-keys" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:6px 14px">Manage →</a>
    {/snippet}
  </SectionHeader>
  
  <div class="grid grid-cols-2 gap-3 fade-up">
    {#each keys as key}
      <div class="dash-key-card">
        <div class="flex items-center justify-between mb-3">
          <div class="dash-key-name">{key.name}</div>
        </div>
        <div class="dash-key-value">el_••••••••••••••••••••••••••••••••••••••••••••••••</div>
        <div class="dash-key-meta">Created {formatRelative(key.created_at)}</div>
      </div>
    {/each}
    <a href="/api-keys" class="dash-key-new" style="min-height:96px">
      <div style="font-size:22px">+</div>
      <div>Generate new API key</div>
    </a>
  </div>