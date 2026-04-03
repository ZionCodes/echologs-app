<script>
  import { enhance }               from '$app/forms'
  import PageHeader                from '$lib/components/dashboard/PageHeader.svelte'
  import DashAlert                 from '$lib/components/dashboard/DashAlert.svelte'
  import { limitLabel, getLimits } from '$lib/plans.js'
  import { POLAR_CHECKOUT_LINKS }  from '$lib/polar.js'

  let { data, form } = $props()
  let { user, plan, subscription, usage } = $derived(data)

  let limits   = $derived(getLimits(plan))
  let loading  = $state(false)
  let pass     = $state('')
  let confirm  = $state('')
  let matches  = $derived(confirm.length > 0 && pass === confirm)
  let mismatch = $derived(confirm.length > 0 && pass !== confirm)

  $effect(() => {
    if (form?.success) { pass = ''; confirm = '' }
  })

  function usagePct(used, max) {
    if (!max || max === Infinity) return 0
    return Math.min(100, Math.round((used / max) * 100))
  }

  function barColor(pct) {
    if (pct >= 90) return 'var(--red)'
    if (pct >= 70) return '#d97706'
    return 'var(--green)'
  }

  function formatPeriodEnd(sub) {
    if (!sub?.current_period_end) return null
    return new Date(sub.current_period_end).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  const PLAN_PRICE  = { free: '$0/month', pro: '$8/month', team: '$29/month' }

  const USAGE_ITEMS = [
    { key: 'executions', label: 'Executions this month' },
    { key: 'scripts',    label: 'Scripts'               },
    { key: 'api_keys',   label: 'API Keys'              },
  ]

  const PRICING_PLANS = [
  {
    key:      'free',
    name:     'Free',
    price:    '$0',
    period:   '/month',
    features: [
      '1,000 executions/mo',
      '3 scripts',
      '2 API keys',
      '14 day retention',
      'Email alerts on failure',
    ],
    links: null,
  },
  {
    key:      'pro',
    name:     'Pro',
    price:    '$8',
    period:   '/month',
    features: [
      '10,000 executions/mo',
      '25 scripts',
      '10 API keys',
      '90 day retention',
      'Email + Slack alerts',
      'Realtime streaming',
      'Public status pages',
    ],
    links: {
      monthly:  { label: 'Monthly — $8/mo',            href: POLAR_CHECKOUT_LINKS.pro_monthly  },
      yearly:   { label: 'Yearly — $64/yr · 4mo free', href: POLAR_CHECKOUT_LINKS.pro_yearly   },
      lifetime: { label: 'Lifetime — $149 one-time',   href: POLAR_CHECKOUT_LINKS.pro_lifetime  },
    },
  },
  {
    key:      'team',
    name:     'Team',
    price:    '$29',
    period:   '/month',
    features: [
      'Unlimited executions',
      'Unlimited scripts',
      'Unlimited API keys',
      '1 year retention',
      'Email + Slack alerts',
      'Realtime streaming',
      'Public status pages',
      '10 team members',
    ],
    links: {
      monthly:  { label: 'Monthly — $29/mo',             href: POLAR_CHECKOUT_LINKS.team_monthly  },
      yearly:   { label: 'Yearly — $232/yr · 4mo free',  href: POLAR_CHECKOUT_LINKS.team_yearly   },
      lifetime: { label: 'Lifetime — $499 one-time',     href: POLAR_CHECKOUT_LINKS.team_lifetime  },
    },
  },
]

  // Plan rank for comparison
  const PLAN_RANK = { free: 0, pro: 1, team: 2 }
</script>

<svelte:head><title>Account — EchoLogs</title></svelte:head>

<PageHeader title="Account" sub="Manage your EchoLogs account and subscription" />

<div style="display:flex;flex-direction:column;gap:14px">

  <!-- ── Usage ─────────────────────────────────────────────────────── -->
  <div class="dash-card" style="padding:24px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div>
        <div class="dash-card-title" style="margin-bottom:4px">Usage this month</div>
        <div class="dash-card-sub">Your current plan limits</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-family:var(--font-mono);font-size:13px;font-weight:800;text-transform:capitalize">{plan}</div>
        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;background:{plan === 'free' ? 'var(--surface2)' : 'var(--green-dim)'};color:{plan === 'free' ? 'var(--muted)' : 'var(--green)'};border:1px solid {plan === 'free' ? 'var(--border)' : 'var(--green-mid)'}">
          {PLAN_PRICE[plan]}
          {#if plan !== 'free' && !subscription?.current_period_end} · Lifetime{/if}
          {#if subscription?.current_period_end} · Renews {formatPeriodEnd(subscription)}{/if}
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      {#each USAGE_ITEMS as item (item.key)}
        {@const used = usage[item.key] ?? 0}
        {@const max  = limits[item.key]}
        {@const pct  = usagePct(used, max)}
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
          <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:8px">{item.label}</div>
          <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;margin-bottom:4px">
            {used.toLocaleString()}
            <span style="font-size:11px;color:var(--muted);font-weight:400"> / {limitLabel(plan, item.key)}</span>
          </div>
          <div style="height:4px;background:var(--surface);border-radius:2px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:{max === Infinity ? 100 : pct}%;background:{max === Infinity ? 'var(--green)' : barColor(pct)};border-radius:2px;transition:width .4s ease"></div>
          </div>
          {#if max !== Infinity && pct >= 90}
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--red)">{pct === 100 ? 'Limit reached' : `${100 - pct}% remaining`}</div>
          {:else}
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted2)">{max === Infinity ? 'Unlimited' : `${100 - pct}% remaining`}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- ── Plans ─────────────────────────────────────────────────────── -->
  <div class="dash-card" style="padding:24px">
    <div class="dash-card-title" style="margin-bottom:4px">Plans</div>
    <div class="dash-card-sub" style="margin-bottom:20px">Upgrade or manage your subscription</div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      {#each PRICING_PLANS as p (p.key)}
        {@const isCurrent  = plan === p.key}
        {@const isUpgrade  = PLAN_RANK[p.key] > PLAN_RANK[plan]}
        {@const isDowngrade = PLAN_RANK[p.key] < PLAN_RANK[plan]}
        <div style="
          position:relative;
          background:var(--surface2);
          border:1px solid {isCurrent ? 'var(--green)' : 'var(--border)'};
          border-radius:14px;
          padding:20px;
          display:flex;
          flex-direction:column;
          opacity:{isDowngrade ? '0.5' : '1'};
        ">
          {#if isCurrent}
            <div style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--green);color:#080b0f;font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 12px;border-radius:0 0 8px 8px;white-space:nowrap">Current plan</div>
          {/if}

          <div style="margin-top:{isCurrent ? '14px' : '0'}">
            <div style="font-family:var(--font-sans);font-size:15px;font-weight:800;margin-bottom:2px">{p.name}</div>
            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:{isCurrent ? 'var(--green)' : 'var(--text)'};margin-bottom:16px">
              {p.price}<span style="font-size:11px;color:var(--muted);font-weight:400">{p.period}</span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:20px;flex:1">
            {#each p.features as f (f)}
              <div style="display:flex;align-items:flex-start;gap:7px;font-family:var(--font-mono);font-size:10px;color:var(--muted)">
                <span style="color:var(--green);flex-shrink:0;margin-top:1px">✓</span>{f}
              </div>
            {/each}
          </div>

          {#if isCurrent}
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--green);text-align:center;padding:8px;background:var(--green-dim);border-radius:8px;border:1px solid var(--green-mid)">✓ Active</div>
          {:else if isDowngrade}
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);text-align:center;padding:8px">Lower than current plan</div>
            {:else if isUpgrade && p.links}
            <div style="display:flex;flex-direction:column;gap:6px">
              <a href={p.links.monthly.href} target="_blank" rel="external noopener noreferrer" data-sveltekit-reload class="dash-btn dash-btn-primary" style="justify-content:center;text-decoration:none;font-size:11px">{p.links.monthly.label}</a>
              <a href={p.links.yearly.href} target="_blank" rel="external noopener noreferrer" data-sveltekit-reload class="dash-btn dash-btn-ghost" style="justify-content:center;text-decoration:none;font-size:11px">{p.links.yearly.label}</a>
              <a href={p.links.lifetime.href} target="_blank" rel="external noopener noreferrer" data-sveltekit-reload class="dash-btn dash-btn-ghost" style="justify-content:center;text-decoration:none;font-size:10px">{p.links.lifetime.label}</a>
            </div>
          {/if}

        </div>
      {/each}
    </div>
  </div>

  <!-- ── Account info + password ───────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

    <div class="dash-card" style="padding:24px">
      <div class="dash-card-title" style="margin-bottom:4px">Account info</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Your account details</div>
      <label class="dash-form-label" for="email-display">Email</label>
      <div id="email-display" class="dash-input" role="textbox" aria-readonly="true" tabindex="0" style="color:var(--muted);cursor:default;user-select:all">{user?.email}</div>
      <div class="dash-input-hint">Email cannot be changed. Contact support@echologs.com if needed.</div>
    </div>

    <div class="dash-card" style="padding:24px">
      <div class="dash-card-title" style="margin-bottom:4px">Change password</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Choose a strong password</div>

      <DashAlert type="error"   message={form?.error} />
      <DashAlert type="success" message={form?.success ? form.message : null} />

      <form method="POST" action="?/changePassword" use:enhance={() => { loading = true; return async ({ update }) => { await update({ reset: false }); loading = false } }}>
        <div style="margin-bottom:14px">
          <label class="dash-form-label" for="password">New password</label>
          <input id="password" class="dash-input" name="password" type="password" placeholder="Min. 8 characters" minlength="8" required bind:value={pass} />
        </div>
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <label class="dash-form-label" style="margin-bottom:0" for="confirm_password">Confirm password</label>
            {#if matches}
              <span style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--green)">✓ matches</span>
            {:else if mismatch}
              <span style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--red)">✗ no match</span>
            {/if}
          </div>
          <input id="confirm_password" class="dash-input" name="confirm_password" type="password" placeholder="Repeat password" required bind:value={confirm} style={mismatch ? 'border-color:var(--red)' : matches ? 'border-color:var(--green)' : ''} />
        </div>
        <button type="submit" class="dash-btn dash-btn-primary" style="width:100%" disabled={loading || mismatch || pass.length < 8}>{loading ? 'Updating...' : 'Update password'}</button>
      </form>
    </div>

  </div>

  <!-- ── Danger zone ───────────────────────────────────────────────── -->
  <div class="dash-card" style="padding:24px;border-color:#dc262630">
    <div class="dash-card-title" style="margin-bottom:4px;color:var(--red)">Danger zone</div>
    <div class="dash-card-sub" style="margin-bottom:20px">Permanent and irreversible actions</div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--red-dim);border:1px solid #dc262630;border-radius:10px">
      <div>
        <div style="font-family:var(--font-sans);font-size:13px;font-weight:700">Delete account</div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px">Permanently deletes your account and all data</div>
      </div>
      <button class="dash-btn dash-btn-danger" onclick={() => alert('To delete your account email support@echologs.com — we will process within 24 hours.')}>Delete</button>
    </div>
  </div>

</div>