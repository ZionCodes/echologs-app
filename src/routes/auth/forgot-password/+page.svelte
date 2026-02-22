<script>
  import { enhance } from '$app/forms'
  import AuthShell   from '$lib/components/auth/AuthShell.svelte'
  import AuthHeader  from '$lib/components/auth/AuthHeader.svelte'
  import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
  import AuthAlert   from '$lib/components/auth/AuthAlert.svelte'
  import AuthField   from '$lib/components/auth/AuthField.svelte'
  import AuthButton  from '$lib/components/auth/AuthButton.svelte'
  import AuthSwitch  from '$lib/components/auth/AuthSwitch.svelte'

  let { form } = $props()
  let loading  = $state(false)
</script>

<svelte:head>
  <title>Reset password — EchoLogs</title>
</svelte:head>

<AuthShell>
  <AuthHeader href="/auth" />

  <AuthHeading
    title="Reset your password"
    subtitle="Enter your email and we'll send you a reset link."
  />

  <AuthAlert type="error"   message={form?.error} />
  <AuthAlert type="success" message={form?.success ? form.message : null} />

  {#if form?.success}
    <AuthSwitch text="" linkText="← Back to log in" href="/auth" />
  {:else}
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
        id="email"
        name="email"
        type="email"
        label="Email address"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <AuthButton {loading} label="Send reset link" loadingLabel="Sending..." />
    </form>

    <AuthSwitch text="Remember your password?" linkText="Log in" href="/auth" />
  {/if}
</AuthShell>
