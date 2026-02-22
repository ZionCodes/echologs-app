<script>
  // type — 'error' | 'success'
  // message — string or null/undefined (renders nothing if falsy)
  let { type = 'error', message } = $props()
</script>

{#if message}
  <div class="auth-alert {type === 'error' ? 'auth-alert-error' : 'auth-alert-success'}">
    {message}
  </div>
{/if}
