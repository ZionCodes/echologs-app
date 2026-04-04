<script>
  import { enhance } from '$app/forms'
  import { goto }    from '$app/navigation'
  import AuthShell   from '$lib/components/auth/AuthShell.svelte'
  import AuthHeader  from '$lib/components/auth/AuthHeader.svelte'
  import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
  import AuthAlert   from '$lib/components/auth/AuthAlert.svelte'
  import AuthField   from '$lib/components/auth/AuthField.svelte'
  import AuthButton  from '$lib/components/auth/AuthButton.svelte'

  let { form }   = $props()
  let loading    = $state(false)
  let submitting = $state(false)

  let visibleError   = $derived(submitting ? null : form?.error   ?? null)
  let visibleSuccess = $derived(submitting ? null : (form?.success ? `${form.message} Taking you to your dashboard...` : null))

  $effect(() => {
    if (form?.success) setTimeout(() => goto('/'), 2000)
  })
</script>

<svelte:head>
  <title>Set new password — EchoLogs</title>
</svelte:head>

<AuthShell>
  <AuthHeader linked={false} />

  <AuthHeading
    title="Set new password"
    subtitle="Choose a strong password for your account."
  />

  <AuthAlert type="error"   message={visibleError} />
  <AuthAlert type="success" message={visibleSuccess} />

  {#if !form?.success}
    <form
      class="auth-form"
      method="POST"
      use:enhance={() => {
        loading    = true
        submitting = true
        return async ({ update }) => {
          await update({ reset: false })
          loading    = false
          submitting = false
        }
      }}
    >
      <AuthField
        id="password"
        name="password"
        type="password"
        label="New password"
        required
        minlength={8}
        autocomplete="new-password"
        placeholder="Min. 8 characters"
      />
      <AuthField
        id="confirm_password"
        name="confirm_password"
        type="password"
        label="Confirm new password"
        required
        minlength={8}
        autocomplete="new-password"
        placeholder="Repeat your password"
      />

      {#if loading}
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
          <div class="auth-spinner"></div>
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">Updating password...</span>
        </div>
      {/if}

      <AuthButton {loading} label="Update password" loadingLabel="Updating..." />
    </form>
  {/if}
</AuthShell>