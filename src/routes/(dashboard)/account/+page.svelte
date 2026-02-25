<script>
    import { enhance } from '$app/forms'
    import PageHeader  from '$lib/components/dashboard/PageHeader.svelte'
    import DashAlert   from '$lib/components/dashboard/DashAlert.svelte'
  
    let { data, form } = $props()
    let { user }       = $derived(data)
  
    let loading  = $state(false)
    let pass     = $state('')
    let confirm  = $state('')
    let matches  = $derived(confirm.length > 0 && pass === confirm)
    let mismatch = $derived(confirm.length > 0 && pass !== confirm)
  
    // Clear fields after successful save
    $effect(() => {
      if (form?.success) {
        pass    = ''
        confirm = ''
      }
    })
  </script>
  
  <svelte:head><title>Account — EchoLogs</title></svelte:head>
  
  <PageHeader
    title="Account"
    sub="Manage your EchoLogs account settings"
  />
  
  <div style="display:flex;flex-direction:column;gap:14px;max-width:500px">
  
<!-- Account info -->
  <div class="dash-card" style="padding:24px">
    <div class="dash-card-title" style="margin-bottom:4px">Account info</div>
    <div class="dash-card-sub" style="margin-bottom:20px">Your account details</div>

    <div>
      <label class="dash-form-label" for="email-display">Email</label>
      <div
        id="email-display"
        class="dash-input"
        role="textbox"
        aria-readonly="true"
        aria-labelledby="email-display"
        tabindex="0"
        style="color:var(--muted);cursor:default;user-select:all"
      >
        {user?.email}
      </div>
      <div class="dash-input-hint">Email cannot be changed here. Contact support if needed.</div>
    </div>
  </div>
  
    <!-- Change password -->
    <div class="dash-card" style="padding:24px">
      <div class="dash-card-title" style="margin-bottom:4px">Change password</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Choose a strong password</div>
  
      <DashAlert type="error"   message={form?.error} />
      <DashAlert type="success" message={form?.success ? form.message : null} />
  
      <form
        method="POST"
        action="?/changePassword"
        use:enhance={() => {
          loading = true
          return async ({ update }) => { await update({ reset: false }); loading = false }
        }}
      >
        <div style="margin-bottom:14px">
          <label class="dash-form-label" for="password">New password</label>
          <input
            id="password"
            class="dash-input"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            minlength="8"
            required
            bind:value={pass}
          />
        </div>
  
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <label class="dash-form-label" style="margin-bottom:0" for="confirm_password">
              Confirm password
            </label>
            {#if matches}
              <span style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--green)">
                matches
              </span>
            {:else if mismatch}
              <span style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--red)">
                no match
              </span>
            {/if}
          </div>
          <input
            id="confirm_password"
            class="dash-input"
            name="confirm_password"
            type="password"
            placeholder="Repeat password"
            required
            bind:value={confirm}
            style={mismatch ? 'border-color:var(--red)' : matches ? 'border-color:var(--green)' : ''}
          />
        </div>
  
        <button
          type="submit"
          class="dash-btn dash-btn-primary"
          style="width:100%"
          disabled={loading || mismatch || pass.length < 8}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  
    <!-- Danger zone -->
    <div class="dash-card" style="padding:24px;border-color:var(--red-dim)">
      <div class="dash-card-title" style="margin-bottom:4px;color:var(--red)">Danger zone</div>
      <div class="dash-card-sub" style="margin-bottom:20px">
        Permanent and irreversible actions
      </div>
  
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--red-dim);border:1px solid var(--red-dim);border-radius:10px">
        <div>
          <div style="font-family:var(--font-sans);font-size:13px;font-weight:700">Delete account</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px">
            Permanently deletes your account and all data
          </div>
        </div>
        <button
          class="dash-btn dash-btn-danger"
          onclick={() => alert('To delete your account email support@echologs.com — we will process it within 24 hours.')}
        >
          Delete
        </button>
      </div>
    </div>
  
  </div>