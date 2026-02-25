<script>
    let { connected = false } = $props()
  </script>
  
  {#if connected}
    <div class="live-badge">
      <div class="live-dot"></div>
      Live
    </div>
  {/if}