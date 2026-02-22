<script>
    let { data } = $props()
  </script>
  
  <svelte:head>
    <title>Dashboard — EchoLogs</title>
  </svelte:head>
  
  <div class="auth-shell">
    <div class="auth-card" style="text-align:center;">
      <div class="auth-logo" style="justify-content:center; margin-bottom:24px;">
        <div class="logo-dot"></div>
        echologs
      </div>
      <h1 class="auth-heading">You're in 🎉</h1>
      <p class="auth-subheading" style="margin-top:8px;">
        Logged in as {data.user?.email}
      </p>
    </div>
  </div>