<script>
  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import AuthShell   from '$lib/components/auth/AuthShell.svelte'
  import AuthHeader  from '$lib/components/auth/AuthHeader.svelte'
  import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
  import AuthAlert   from '$lib/components/auth/AuthAlert.svelte'
  import AuthField   from '$lib/components/auth/AuthField.svelte'
  import AuthButton  from '$lib/components/auth/AuthButton.svelte'

  let { form } = $props()
  let loading  = $state(false)

  $effect(() => {
    if (form?.success) setTimeout(() => goto('/'), 2000)
  })
</script>

<svelte:head>
  <title>Set new password — EchoLogs</title>
</svelte:head>

<AuthShell>
  <!-- Not linked — reset link is one-time use, nowhere to go back to -->
  <AuthHeader linked={false} />

  <AuthHeading
    title="Set new password"
    subtitle="Choose a strong password for your account."
  />

  <AuthAlert type="error"   message={form?.error} />
  <AuthAlert type="success" message={form?.success ? `${form.message} Taking you to your dashboard...` : null} />

  {#if !form?.success}
    <form
      class="auth-form"
      method="POST"
      use:enhance={() => {
        loading = true
        return async ({ update }) => {
          await update({ reset: false })
          loading = false
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

      <AuthButton {loading} label="Update password" loadingLabel="Updating..." />
    </form>
  {/if}
</AuthShell>
