<script>
    let { title, sub, children } = $props()
  </script>
  
  <div class="flex items-start justify-between mt-6 mb-4">
    <div>
      <h2 class="dash-section-title">{title}</h2>
      {#if sub}<p class="dash-section-sub">{sub}</p>{/if}
    </div>
    {#if children}
      <div class="shrink-0">{@render children()}</div>
    {/if}
  </div>