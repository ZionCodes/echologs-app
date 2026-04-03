<script>
    import { page } from '$app/stores'
  </script>
  
  <svelte:head><title>Error — EchoLogs</title></svelte:head>
  
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:24px">
    <div style="text-align:center;max-width:480px">
      <div style="font-family:var(--font-mono);font-size:48px;font-weight:800;color:var(--green);margin-bottom:8px">
        {$page.status}
      </div>
      <div style="font-family:var(--font-sans);font-size:1.4rem;font-weight:800;margin-bottom:12px">
        {#if $page.status === 404}
          Page not found
        {:else if $page.status === 403}
          Access denied
        {:else if $page.status === 500}
          Something went wrong
        {:else}
          An error occurred
        {/if}
      </div>
      <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-bottom:32px;line-height:1.7">
        {$page.error?.message ?? 'An unexpected error occurred.'}
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <a href="/" style="font-family:var(--font-mono);font-size:12px;color:var(--green);text-decoration:none;background:var(--green-dim);border:1px solid var(--green-mid);padding:8px 20px;border-radius:8px;font-weight:700">
          Go to dashboard
        </a>
        <button onclick={() => history.back()} style="font-family:var(--font-mono);font-size:12px;color:var(--muted);background:transparent;border:1px solid var(--border);padding:8px 20px;border-radius:8px;cursor:pointer">
          Go back
        </button>
      </div>
    </div>
  </div>