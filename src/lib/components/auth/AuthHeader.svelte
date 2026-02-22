<script>
  import { getContext } from 'svelte'

  // href — where the logo links to
  // linked — false on reset-password where there's no valid back destination
  let { href = '/auth', linked = true } = $props()

  const theme = getContext('theme')
</script>

<div class="auth-top">
  {#if linked}
    <a {href} class="auth-logo">
      <div class="logo-dot"></div>
      echologs
    </a>
  {:else}
    <div class="auth-logo">
      <div class="logo-dot"></div>
      echologs
    </div>
  {/if}

  <button class="auth-theme-btn" onclick={theme.toggleTheme} aria-label="Toggle theme">
    {theme.isDark ? '☀️' : '🌙'}
  </button>
</div>
