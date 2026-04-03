<script>
    import { page } from '$app/stores'
    let theme = $state(
      typeof window !== 'undefined'
        ? (localStorage.getItem('theme') ?? 'dark')
        : 'dark'
    )
    function toggleTheme() {
      theme = theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('theme', theme)
    }
  </script>
  
  <svelte:head><title>Status page not found — EchoLogs</title></svelte:head>
  
  <div style="min-height:100vh;background:var(--bg);color:var(--text);padding:48px 24px">
    <div style="max-width:800px;margin:0 auto">
  
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:60px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block"></span>
          <a href="/" style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--green);text-decoration:none">echologs</a>
          <span style="color:var(--border);font-size:14px">/</span>
          <span style="font-family:var(--font-mono);font-size:14px;color:var(--muted)">status</span>
        </div>
        <button onclick={toggleTheme} style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center" aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
  
      <div style="text-align:center;padding:60px 0">
        <div style="font-family:var(--font-mono);font-size:64px;font-weight:800;color:var(--border);margin-bottom:16px">404</div>
        <div style="font-family:var(--font-sans);font-size:1.4rem;font-weight:800;margin-bottom:12px">Status page not found</div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-bottom:32px;line-height:1.7;max-width:400px;margin-left:auto;margin-right:auto">
          This status page may have been revoked or the link is incorrect.
          If you think this is a mistake, contact the script owner.
        </div>
        <a href="/" style="font-family:var(--font-mono);font-size:12px;color:var(--green);text-decoration:none;background:var(--green-dim);border:1px solid var(--green-mid);padding:10px 24px;border-radius:8px;font-weight:700;display:inline-block">
          Go to EchoLogs →
        </a>
      </div>
  
      <div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--muted)">
        Powered by <a href="/" style="color:var(--green);text-decoration:none">EchoLogs</a>
      </div>
    </div>
  </div>