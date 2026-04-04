<script>
  import { navigating, page } from '$app/stores'
  import DashNav              from '$lib/components/dashboard/DashNav.svelte'
  import DashSidebar          from '$lib/components/dashboard/DashSidebar.svelte'

  let { data, children } = $props()
  let sidebarOpen = $state(false)

  $effect(() => {
    $page.url.pathname
    sidebarOpen = false
  })
</script>

{#if $navigating}
  <div style="position:fixed;top:0;left:0;right:0;z-index:9999;height:2px;background:var(--green);animation:nav-progress 1.2s ease-in-out infinite alternate;pointer-events:none"></div>
{/if}

<DashNav user={data.user} onMenuToggle={() => sidebarOpen = !sidebarOpen} />

<div class="dash-app">
  <!-- Overlay sits at z-index 98, sidebar at 99 — overlay always behind sidebar -->
  {#if sidebarOpen}
    <div
      class="sidebar-overlay"
      onclick={() => sidebarOpen = false}
      aria-hidden="true"
    ></div>
  {/if}

  <DashSidebar open={sidebarOpen} onClose={() => sidebarOpen = false} />

  <main class="dash-main">
    {@render children()}
  </main>
</div>