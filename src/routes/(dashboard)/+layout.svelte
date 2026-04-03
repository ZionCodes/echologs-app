<script>
  import { navigating } from '$app/stores'
  import DashNav        from '$lib/components/dashboard/DashNav.svelte'
  import DashSidebar    from '$lib/components/dashboard/DashSidebar.svelte'

  let { data, children } = $props()
</script>

{#if $navigating}
  <div style="position:fixed;top:0;left:0;right:0;z-index:9999;height:2px;background:var(--green);animation:nav-progress 1.2s ease-in-out infinite alternate;pointer-events:none"></div>
{/if}

<DashNav user={data.user} />
<div class="dash-app">
  <DashSidebar />
  <main class="dash-main">
    {@render children()}
  </main>
</div>