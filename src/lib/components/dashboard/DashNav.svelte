<script>
  import { enhance }    from '$app/forms'
  import { getContext } from 'svelte'
  import { goto }       from '$app/navigation'

  let { user = null, onMenuToggle = null } = $props()
  const theme = getContext('theme')

  let menuOpen = $state(false)

  let initials = $derived(() => {
    if (!user?.email) return '?'
    const local = user.email.split('@')[0]
    const parts = local.split('.')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return local[0].toUpperCase()
  })

  function handleOutsideClick(e) {
    if (!e.target.closest('.nav-avatar-wrap')) menuOpen = false
  }
</script>

<svelte:window
  onclick={handleOutsideClick}
  onkeydown={(e) => { if (e.key === 'Escape') menuOpen = false }}
/>

<nav class="dash-nav">
  <div style="display:flex;align-items:center;gap:12px">
    {#if onMenuToggle}
      <button class="dash-hamburger" onclick={onMenuToggle} aria-label="Toggle sidebar">
        <span></span><span></span><span></span>
      </button>
    {/if}
    <a href={user ? '/' : 'https://echologs.com'} class="dash-nav-logo">
      <div class="logo-dot"></div>
      <span class="nav-logo-text">echologs</span>
    </a>
  </div>

  <div style="display:flex;align-items:center;gap:10px">
    <!-- Theme toggle -->
    <button
      class="dash-theme-btn"
      onclick={theme?.toggleTheme}
      aria-label="Toggle theme"
    >
      {theme?.isDark ? '☀️' : '🌙'}
    </button>

    {#if user}
      <!-- Logged in — avatar dropdown -->
      <div class="nav-avatar-wrap" style="position:relative">
        <button
          onclick={() => menuOpen = !menuOpen}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          style="width:34px;height:34px;border-radius:50%;background:var(--green-dim);border:1.5px solid var(--green-mid);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--green);transition:border-color .15s;flex-shrink:0"
        >
          {initials()}
        </button>

        {#if menuOpen}
          <div style="position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:6px;min-width:220px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:200">
            <div style="padding:10px 12px 12px;border-bottom:1px solid var(--border);margin-bottom:6px">
              <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:4px">Signed in as</div>
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{user.email}</div>
            </div>

            {#each [
              { icon: '⚙', label: 'Account settings', href: '/account'  },
              { icon: '⚿', label: 'API Keys',          href: '/api-keys' },
              { icon: '⊡', label: 'SDK Docs',          href: '/docs'     },
            ] as item (item.href)}
              <button
                onclick={() => { menuOpen = false; goto(item.href) }}
                style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border-radius:8px;border:none;background:transparent;cursor:pointer;text-align:left;font-family:var(--font-mono);font-size:12px;color:var(--muted);transition:background .1s,color .1s"
                onmouseenter={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text)' }}
                onmouseleave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted)' }}
              >
                <span style="font-size:13px">{item.icon}</span>{item.label}
              </button>
            {/each}

            <div style="height:1px;background:var(--border);margin:6px 0"></div>

            <form method="POST" action="/auth?/signout" use:enhance>
              <button
                type="submit"
                style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border-radius:8px;border:none;background:transparent;cursor:pointer;text-align:left;font-family:var(--font-mono);font-size:12px;color:var(--muted);transition:background .1s,color .1s"
                onmouseenter={e => { e.currentTarget.style.background='var(--red-dim)'; e.currentTarget.style.color='var(--red)' }}
                onmouseleave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted)' }}
              >
                <span style="font-size:13px">↪</span>Sign out
              </button>
            </form>
          </div>
        {/if}
      </div>

    {:else}
      <!-- Not logged in — Get started button -->
      <a
        href="https://app.echologs.com"
        style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#080b0f;background:var(--green);padding:7px 16px;border-radius:8px;text-decoration:none;transition:opacity .15s"
        onmouseenter={e => e.currentTarget.style.opacity = '.85'}
        onmouseleave={e => e.currentTarget.style.opacity = '1'}
      >
        Get started →
      </a>
    {/if}
  </div>
</nav>