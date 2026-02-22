<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import AuthShell   from '$lib/components/auth/AuthShell.svelte'
  import AuthHeader  from '$lib/components/auth/AuthHeader.svelte'
  import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
  import AuthAlert   from '$lib/components/auth/AuthAlert.svelte'
  import AuthField   from '$lib/components/auth/AuthField.svelte'
  import AuthButton  from '$lib/components/auth/AuthButton.svelte'
  import AuthSwitch  from '$lib/components/auth/AuthSwitch.svelte'

  let { form } = $props()

  let mode            = $state('login')
  let loading         = $state(false)
  let password        = $state('')
  let confirmPassword = $state('')

  let urlError = $derived($page.url.searchParams.get('error'))

  let passwordMismatch = $derived(
    mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword
  )
  let passwordMatch = $derived(
    mode === 'signup' && confirmPassword.length > 0 && password === confirmPassword
  )

  let confirmBorderColor = $derived(
    passwordMatch ? 'var(--green)' : passwordMismatch ? 'var(--red)' : undefined
  )

  function switchMode() {
    mode = mode === 'login' ? 'signup' : 'login'
    password = ''
    confirmPassword = ''
  }
</script>

<svelte:head>
  <title>{mode === 'login' ? 'Log in' : 'Create account'} — EchoLogs</title>
</svelte:head>

<AuthShell>
  <AuthHeader href="https://echologs.com" />

  <AuthHeading
    title={mode === 'login' ? 'Welcome back' : 'Create your account'}
    subtitle={mode === 'login' ? 'Log in to your dashboard.' : 'Start monitoring your AI scripts.'}
  />

  <AuthAlert type="error" message={urlError === 'missing_code'
    ? 'Something went wrong. Please try again.'
    : urlError} />
  <AuthAlert type="error"   message={form?.error} />
  <AuthAlert type="success" message={form?.success ? form.message : null} />

  {#if !form?.success}
    <form
      class="auth-form"
      method="POST"
      action="?/{mode}"
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
        label="Email"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label="Password"
        required
        minlength={8}
        autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
        placeholder={mode === 'login' ? '••••••••' : 'Min. 8 characters'}
        bind:value={password}
      >
        {#if mode === 'login'}
          <a href="/auth/forgot-password" class="auth-forgot">Forgot password?</a>
        {/if}
      </AuthField>

      {#if mode === 'signup'}
        <AuthField
          id="confirm_password"
          name="confirm_password"
          type="password"
          label="Confirm password"
          required
          minlength={8}
          autocomplete="new-password"
          placeholder="Repeat your password"
          bind:value={confirmPassword}
          borderColor={confirmBorderColor}
        >
          {#if passwordMatch}
            <span class="auth-match-ok">✓ Passwords match</span>
          {:else if passwordMismatch}
            <span class="auth-match-fail">✗ Don't match</span>
          {/if}
        </AuthField>
      {/if}

      <AuthButton
        {loading}
        label={mode === 'login' ? 'Log in' : 'Create account'}
        disabled={mode === 'signup' && passwordMismatch}
      />
    </form>
  {/if}

  <AuthSwitch
    text={mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
    linkText={mode === 'login' ? 'Sign up' : 'Log in'}
    onclick={switchMode}
  />
</AuthShell>
