<script>
  import { enhance } from '$app/forms'
  import AuthShell   from '$lib/components/auth/AuthShell.svelte'
  import AuthHeader  from '$lib/components/auth/AuthHeader.svelte'
  import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
  import AuthAlert   from '$lib/components/auth/AuthAlert.svelte'
  import AuthField   from '$lib/components/auth/AuthField.svelte'
  import AuthButton  from '$lib/components/auth/AuthButton.svelte'
  import AuthSwitch  from '$lib/components/auth/AuthSwitch.svelte'

  let { form }   = $props()
  let loading    = $state(false)
  let submitting = $state(false)

  let visibleError   = $derived(submitting ? null : form?.error   ?? null)
  let visibleSuccess = $derived(submitting ? null : (form?.success ? form.message : null))
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

  <AuthAlert type="error"   message={visibleError} />
  <AuthAlert type="success" message={visibleSuccess} />

  {#if form?.success}
    <AuthSwitch text="" linkText="← Back to log in" href="/auth" />
  {:else}
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
        id="email"
        name="email"
        type="email"
        label="Email address"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      {#if loading}
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
          <div class="auth-spinner"></div>
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">Sending reset link...</span>
        </div>
      {/if}

      <AuthButton {loading} label="Send reset link" loadingLabel="Sending..." />
    </form>

    <AuthSwitch text="Remember your password?" linkText="Log in" href="/auth" />
  {/if}
</AuthShell>