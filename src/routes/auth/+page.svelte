<script>
  import { enhance } from '$app/forms'
  import { page }    from '$app/stores'
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
  let submitting      = $state(false)
  let password        = $state('')
  let confirmPassword = $state('')

  let urlError       = $derived($page.url.searchParams.get('error'))
  let visibleError   = $derived(submitting ? null : form?.error   ?? null)
  let visibleSuccess = $derived(submitting ? null : (form?.success ? form.message : null))

  let passwordMismatch = $derived(
    mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword
  )
  let passwordMatch = $derived(
    mode === 'signup' && confirmPassword.length > 0 && password === confirmPassword
  )
  let confirmBorderColor = $derived(
    passwordMatch ? 'var(--green)' : passwordMismatch ? 'var(--red)' : undefined
  )

  // ── Password strength ──────────────────────────────────────────────────
  let strength = $derived(() => {
    if (!password || mode !== 'signup') return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8)                          score++
    if (password.length >= 12)                         score++
    if (/[A-Z]/.test(password))                        score++
    if (/[0-9]/.test(password))                        score++
    if (/[^A-Za-z0-9]/.test(password))                score++

    const levels = [
      { label: '',          color: 'transparent'  },
      { label: 'Weak',      color: '#dc2626'       },
      { label: 'Fair',      color: '#d97706'       },
      { label: 'Good',      color: '#2563eb'       },
      { label: 'Strong',    color: '#16a34a'       },
      { label: 'Very strong', color: 'var(--green)' },
    ]
    return { score, ...levels[Math.min(score, 5)] }
  })

  function switchMode() {
    mode            = mode === 'login' ? 'signup' : 'login'
    password        = ''
    confirmPassword = ''
    submitting      = false
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

  {#if urlError && !submitting}
    <AuthAlert type="error" message={urlError === 'missing_code'
      ? 'Something went wrong. Please try again.'
      : urlError} />
  {/if}

  <AuthAlert type="error"   message={visibleError} />
  <AuthAlert type="success" message={visibleSuccess} />

  {#if !form?.success}
    <form
      class="auth-form"
      method="POST"
      action="?/{mode}"
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
      <!-- autofocus on email — users can type immediately -->
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Email"
        required
        autocomplete="email"
        placeholder="you@example.com"
        autofocus
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

      <!-- Password strength bar — signup only -->
      {#if mode === 'signup' && password.length > 0}
        {@const s = strength()}
        <div style="margin-top:-10px;margin-bottom:14px">
          <div style="display:flex;gap:4px;margin-bottom:5px">
            {#each [1, 2, 3, 4, 5] as i (i)}
              <div style="
                flex:1;height:3px;border-radius:2px;
                background:{i <= s.score ? s.color : 'var(--border)'};
                transition:background .2s;
              "></div>
            {/each}
          </div>
          {#if s.label}
            <div style="font-family:var(--font-mono);font-size:10px;color:{s.color};transition:color .2s">
              {s.label}
              {#if s.score < 3}
                — try adding numbers or symbols
              {/if}
            </div>
          {/if}
        </div>
      {/if}

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
        loadingLabel={mode === 'login' ? 'Logging in...' : 'Creating account...'}
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