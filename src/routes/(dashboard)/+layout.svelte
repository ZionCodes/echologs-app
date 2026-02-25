<script>
  import DashNav     from '$lib/components/dashboard/DashNav.svelte'
  import DashSidebar from '$lib/components/dashboard/DashSidebar.svelte'

  let { data, children } = $props()
</script>

<DashNav user={data.user} />
<div class="dash-app">
  <DashSidebar />
  <main class="dash-main">
    {@render children()}
  </main>
</div>