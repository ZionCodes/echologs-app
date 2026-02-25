<script>
    let { type = 'error', message } = $props()
  </script>
  
  {#if message}
    <div class="dash-alert {type === 'error' ? 'dash-alert-error' : 'dash-alert-success'}" style="margin-bottom:16px">
      {message}
    </div>
  {/if}