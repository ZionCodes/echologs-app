<script>
  let { loading = false, label, loadingLabel = 'Please wait...',  disabled = false } = $props()
</script>

<button
  type="submit"
  class="auth-btn"
  disabled={loading || disabled}
  onmouseenter={(e) => {
    if (!loading && !disabled) {
      e.currentTarget.style.background = '#00ff88'
      e.currentTarget.style.transform = 'translateY(-1px)'
      e.currentTarget.style.boxShadow = '0 8px 24px #00e57a33'
    }
  }}
  onmouseleave={(e) => {
    e.currentTarget.style.background = 'var(--green)'
    e.currentTarget.style.transform = ''
    e.currentTarget.style.boxShadow = ''
  }}
>
  {loading ? loadingLabel : label}
</button>
