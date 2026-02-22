<script>
  let { children } = $props()
</script>

<!-- Full screen center — all auth pages use this as their root wrapper -->
<div class="auth-shell">
  <div class="auth-card">
    {@render children()}
  </div>
</div>
