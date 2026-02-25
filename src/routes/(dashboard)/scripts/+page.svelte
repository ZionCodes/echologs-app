<script>
  import { page }       from '$app/stores'
  import PageHeader from '$lib/components/dashboard/PageHeader.svelte'
  import ScriptCard from '$lib/components/dashboard/ScriptCard.svelte'
  import DashAlert  from '$lib/components/dashboard/DashAlert.svelte'

  let { data }    = $props()
  let { scripts } = $derived(data)

  let deleted = $derived($page.url.searchParams.get('deleted') === '1')
</script>

<svelte:head><title>Scripts — EchoLogs</title></svelte:head>

<PageHeader
  title="Scripts"
  sub="Auto-created when you run a named script via the SDK"
/>

<DashAlert type="success" message={deleted ? 'Script deleted. Your plan slot is now free.' : null} />

{#if scripts.length === 0}
  <div class="dash-card">
    <div class="dash-empty">
      No scripts yet — they appear automatically when you run a script using the SDK.
    </div>
  </div>
{:else}
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
    {#each scripts as s}
      <ScriptCard script={s} variant="last" />
    {/each}
  </div>
{/if}