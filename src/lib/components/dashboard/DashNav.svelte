<script>
    import { enhance } from '$app/forms'
    import { getContext } from 'svelte'
  
    let { user } = $props()
    const theme  = getContext('theme')
  </script>
  
  <nav class="dash-nav">
    <a href="/" class="dash-nav-logo">
      <div class="logo-dot"></div>
      echologs
    </a>
    <div class="flex items-center gap-3">
      {#if user?.email}
        <span class="dash-nav-email">{user.email}</span>
      {/if}
      <button class="dash-theme-btn" onclick={theme.toggleTheme} aria-label="Toggle theme">
        {theme.isDark ? '☀️' : '🌙'}
      </button>
      <form method="POST" action="/auth?/signout" use:enhance>
        <button type="submit" class="dash-signout-btn">Sign out</button>
      </form>
    </div>
  </nav>