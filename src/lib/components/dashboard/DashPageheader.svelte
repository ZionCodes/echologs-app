<script>
    let { title, sub, children } = $props()
  </script>
  
  <div class="flex items-start justify-between gap-3 mb-6">
    <div>
      <h1 class="dash-page-title">{title}</h1>
      {#if sub}<p class="dash-page-sub">{sub}</p>{/if}
    </div>
    {#if children}
      <div class="flex items-center gap-2 shrink-0">
        {@render children()}
      </div>
    {/if}
  </div>