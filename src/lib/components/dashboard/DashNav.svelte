<script>
  import { enhance }   from '$app/forms'
  import { getContext } from 'svelte'
  import { goto }      from '$app/navigation'

  let { user } = $props()
  const theme  = getContext('theme')

  let menuOpen = $state(false)

  // Get initials from email — "john@example.com" → "J"
  // If email has a dot before @ — "john.doe@..." → "JD"
  let initials = $derived(() => {
    if (!user?.email) return '?'
    const local = user.email.split('@')[0]
    const parts = local.split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return local[0].toUpperCase()
  })

  // Close menu when clicking outside
  function handleOutsideClick(e) {
    if (!e.target.closest('.nav-avatar-wrap')) {
      menuOpen = false
    }
  }
</script>

<svelte:window
  onclick={handleOutsideClick}
  onkeydown={(e) => { if (e.key === 'Escape') menuOpen = false }}
/>

<nav class="dash-nav">
  <a href="/" class="dash-nav-logo">
    <div class="logo-dot"></div>
    echologs
  </a>

  <div style="display:flex;align-items:center;gap:10px">

    <!-- Theme toggle -->
    <button
      class="dash-theme-btn"
      onclick={theme.toggleTheme}
      aria-label="Toggle theme"
    >
      {theme.isDark ? '☀️' : '🌙'}
    </button>

    <!-- Avatar dropdown -->
    <div class="nav-avatar-wrap" style="position:relative">
      <button
        onclick={() => menuOpen = !menuOpen}
        aria-label="Account menu"
        aria-expanded={menuOpen}
        style="
          width:34px;height:34px;border-radius:50%;
          background:var(--green-dim);border:1.5px solid var(--green-mid);
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          font-family:var(--font-mono);font-size:12px;font-weight:700;
          color:var(--green);transition:border-color .15s;
          flex-shrink:0;
        "
      >
        {initials()}
      </button>

      {#if menuOpen}
        <div style="
          position:absolute;top:calc(100% + 8px);right:0;
          background:var(--surface);border:1px solid var(--border);
          border-radius:12px;padding:6px;min-width:220px;
          box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:200;
        ">
          <!-- Email header -->
          <div style="
            padding:10px 12px 12px;
            border-bottom:1px solid var(--border);
            margin-bottom:6px;
          ">
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:4px">Signed in as</div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{user?.email}</div>
          </div>

          <!-- Menu items -->
          <button
            onclick={() => { menuOpen = false; goto('/account') }}
            style="
              display:flex;align-items:center;gap:10px;width:100%;
              padding:8px 12px;border-radius:8px;border:none;
              background:transparent;cursor:pointer;text-align:left;
              font-family:var(--font-mono);font-size:12px;color:var(--muted);
              transition:background .1s,color .1s;
            "
            onmouseenter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
            onmouseleave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <span style="font-size:13px">⚙</span>
            Account settings
          </button>

          <button
            onclick={() => { menuOpen = false; goto('/api-keys') }}
            style="
              display:flex;align-items:center;gap:10px;width:100%;
              padding:8px 12px;border-radius:8px;border:none;
              background:transparent;cursor:pointer;text-align:left;
              font-family:var(--font-mono);font-size:12px;color:var(--muted);
              transition:background .1s,color .1s;
            "
            onmouseenter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
            onmouseleave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <span style="font-size:13px">⚿</span>
            API Keys
          </button>

          <button
            onclick={() => { menuOpen = false; goto('/docs') }}
            style="
              display:flex;align-items:center;gap:10px;width:100%;
              padding:8px 12px;border-radius:8px;border:none;
              background:transparent;cursor:pointer;text-align:left;
              font-family:var(--font-mono);font-size:12px;color:var(--muted);
              transition:background .1s,color .1s;
            "
            onmouseenter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
            onmouseleave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <span style="font-size:13px">⊡</span>
            SDK Docs
          </button>

          <div style="height:1px;background:var(--border);margin:6px 0"></div>

          <!-- Sign out -->
          <form method="POST" action="/auth?/signout" use:enhance>
            <button
              type="submit"
              style="
                display:flex;align-items:center;gap:10px;width:100%;
                padding:8px 12px;border-radius:8px;border:none;
                background:transparent;cursor:pointer;text-align:left;
                font-family:var(--font-mono);font-size:12px;color:var(--muted);
                transition:background .1s,color .1s;
              "
              onmouseenter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
              onmouseleave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
            >
              <span style="font-size:13px">↪</span>
              Sign out
            </button>
          </form>

        </div>
      {/if}
    </div>

  </div>
</nav>