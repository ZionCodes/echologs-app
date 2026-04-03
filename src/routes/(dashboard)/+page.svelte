<script>
  import BarChart        from '$lib/components/dashboard/BarChart.svelte'
  import DonutChart      from '$lib/components/dashboard/DonutChart.svelte'
  import ExecutionsTable from '$lib/components/dashboard/ExecutionsTable.svelte'
  import { passRate, passRateColor, formatDuration, formatRelative } from '$lib/utils/format.js'
  import { POLAR_CHECKOUT_LINKS } from '$lib/polar.js'

  let { data } = $props()
  let { stats, chartDays, recent, scripts, keys, plan, limits } = $derived(data)

  let passRatePct  = $derived(passRate(stats.passed, stats.total))
  let isEmpty      = $derived(stats.total === 0 && scripts.length === 0)
  let hasKey       = $derived(keys.length > 0)
  let showPopup    = $derived(scripts.length === 0)
  let dismissed    = $state(false)
  let activeStep   = $state(1)
  let copied       = $state('')

  // Usage meter
  let execPct     = $derived(limits.executions === Infinity ? 0 : Math.min(100, Math.round((stats.thisMonth / limits.executions) * 100)))
  let execWarning = $derived(execPct >= 90)
  let execColor   = $derived(execPct >= 90 ? 'var(--red)' : execPct >= 70 ? '#d97706' : 'var(--green)')

  function copy(text, id) {
    navigator.clipboard.writeText(text)
    copied = id
    setTimeout(() => { copied = '' }, 2000)
  }

  function passRateNum(pct) {
    if (pct === '—') return null
    return parseInt(pct)
  }
</script>

<svelte:head><title>Dashboard — EchoLogs</title></svelte:head>

<!-- Onboarding popup -->
{#if showPopup && !dismissed}
  <div style="position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);padding:24px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;max-width:560px;width:100%;box-shadow:0 40px 100px rgba(0,0,0,.5);overflow:hidden">
      <div style="padding:28px 32px 24px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div>
          <div style="font-family:var(--font-sans);font-size:1.2rem;font-weight:800;margin-bottom:6px">Get set up in 2 minutes</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Follow these steps to start monitoring your Python scripts</div>
        </div>
        <button onclick={() => dismissed = true} style="background:transparent;border:none;cursor:pointer;color:var(--muted);font-size:18px;padding:4px;flex-shrink:0;line-height:1" aria-label="Dismiss">✕</button>
      </div>
      <div style="display:flex;border-bottom:1px solid var(--border)">
        {#each [{ n: 1, label: 'API Key' }, { n: 2, label: 'Install SDK' }, { n: 3, label: 'Add to code' }, { n: 4, label: 'Run it' }] as step (step.n)}
          <button onclick={() => activeStep = step.n} style="flex:1;padding:14px 8px;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;background:transparent;transition:all .15s;border-bottom:2px solid {activeStep === step.n ? 'var(--green)' : 'transparent'};color:{activeStep === step.n ? 'var(--green)' : 'var(--muted)'};font-weight:{activeStep === step.n ? '700' : '400'}">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:{activeStep === step.n ? 'var(--green)' : 'var(--surface2)'};color:{activeStep === step.n ? '#080b0f' : 'var(--muted)'};font-size:9px;font-weight:700;margin-right:6px">{step.n}</span>
            {step.label}
          </button>
        {/each}
      </div>
      <div style="padding:28px 32px">
        {#if activeStep === 1}
          <div style="font-family:var(--font-sans);font-size:14px;font-weight:700;margin-bottom:6px">Create an API key</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.7">You need an API key to authenticate the SDK.</div>
          {#if hasKey}
            <div style="background:var(--green-dim);border:1px solid var(--green-mid);border-radius:10px;padding:14px 16px;margin-bottom:20px">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--green)">✓ You already have {keys.length} API key{keys.length > 1 ? 's' : ''} — you're good to go.</div>
            </div>
          {:else}
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:20px">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">No API keys yet. Create one on the API Keys page.</div>
            </div>
          {/if}
          <div style="display:flex;gap:10px">
            <a href="/api-keys" class="dash-btn dash-btn-primary">{hasKey ? 'Manage API Keys' : 'Create API Key →'}</a>
            <button class="dash-btn dash-btn-ghost" onclick={() => activeStep = 2}>Next step →</button>
          </div>
        {:else if activeStep === 2}
          <div style="font-family:var(--font-sans);font-size:14px;font-weight:700;margin-bottom:6px">Install the SDK</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.7">Install the EchoLogs Python package using pip.</div>
          <div class="docs-code-block" style="margin-bottom:20px">
            <div class="docs-code-header"><span class="docs-code-lang">terminal</span><button class="onboard-copy-btn" onclick={() => copy('pip install echologs', 'pip')}>{copied === 'pip' ? '✓ Copied' : 'Copy'}</button></div>
            <pre class="onboard-pre">pip install echologs</pre>
          </div>
          <div class="docs-code-block" style="margin-bottom:20px">
            <div class="docs-code-header"><span class="docs-code-lang">.env</span><button class="onboard-copy-btn" onclick={() => copy('ECHOLOGS_API_KEY=el_your_api_key_here', 'envk')}>{copied === 'envk' ? '✓ Copied' : 'Copy'}</button></div>
            <pre class="onboard-pre">ECHOLOGS_API_KEY=<span style="color:var(--green)">el_your_api_key_here</span></pre>
          </div>
          <div style="display:flex;gap:10px">
            <button class="dash-btn dash-btn-primary" onclick={() => activeStep = 3}>Next step →</button>
            <button class="dash-btn dash-btn-ghost" onclick={() => activeStep = 1}>Back</button>
          </div>
        {:else if activeStep === 3}
          <div style="font-family:var(--font-sans);font-size:14px;font-weight:700;margin-bottom:6px">Wrap your script</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.7">Add two lines to the top of your existing Python script.</div>
          <div class="docs-code-block" style="margin-bottom:20px">
            <div class="docs-code-header"><span class="docs-code-lang">your_script.py</span><button class="onboard-copy-btn" onclick={() => copy('from dotenv import load_dotenv; load_dotenv()\nimport echologs\n\nwith echologs.run():\n    # your existing code here\n    print("Hello from EchoLogs!")', 'wrap')}>{copied === 'wrap' ? '✓ Copied' : 'Copy'}</button></div>
            <pre class="onboard-pre"><span class="t-dim">from</span> dotenv <span class="t-dim">import</span> load_dotenv; load_dotenv()
<span class="t-dim">import</span> echologs

<span class="t-dim">with</span> echologs.run():
    <span class="t-dim"># your existing code here</span>
    print(<span style="color:var(--green)">"Hello from EchoLogs!"</span>)</pre>
          </div>
          <div style="display:flex;gap:10px">
            <button class="dash-btn dash-btn-primary" onclick={() => activeStep = 4}>Next step →</button>
            <button class="dash-btn dash-btn-ghost" onclick={() => activeStep = 2}>Back</button>
          </div>
        {:else if activeStep === 4}
          <div style="font-family:var(--font-sans);font-size:14px;font-weight:700;margin-bottom:6px">Run your script</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.7">Run your script normally. This dashboard updates automatically.</div>
          <div class="docs-code-block" style="margin-bottom:20px">
            <div class="docs-code-header"><span class="docs-code-lang">terminal</span></div>
            <pre class="onboard-pre">python your_script.py</pre>
          </div>
          <div style="display:flex;gap:10px">
            <a href="/docs" class="dash-btn dash-btn-ghost">View full docs →</a>
            <button class="dash-btn dash-btn-ghost" onclick={() => activeStep = 3}>Back</button>
          </div>
        {/if}
      </div>
      <div style="padding:16px 32px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;gap:6px">
          {#each [1,2,3,4] as n (n)}
            <div style="width:6px;height:6px;border-radius:50%;background:{activeStep === n ? 'var(--green)' : 'var(--border)'};transition:background .2s"></div>
          {/each}
        </div>
        <button onclick={() => dismissed = true} style="font-family:var(--font-mono);font-size:11px;color:var(--muted);background:transparent;border:none;cursor:pointer">Dismiss for now</button>
      </div>
    </div>
  </div>
{/if}

<!-- Page title -->
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
  <div>
    <h1 style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;margin:0 0 4px">Dashboard</h1>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">
      {isEmpty ? 'Get set up in 2 minutes' : `${stats.total.toLocaleString()} total executions · ${scripts.length} script${scripts.length !== 1 ? 's' : ''} monitored`}
    </div>
  </div>
  <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;text-transform:capitalize;background:{plan === 'free' ? 'var(--surface2)' : 'var(--green-dim)'};color:{plan === 'free' ? 'var(--muted)' : 'var(--green)'};border:1px solid {plan === 'free' ? 'var(--border)' : 'var(--green-mid)'}">
    {plan} plan
  </div>
</div>

{#if isEmpty}
  <div style="max-width:680px">
    <div class="onboard-step" class:done={hasKey}>
      <div class="onboard-step-num" class:done={hasKey}>{hasKey ? '✓' : '1'}</div>
      <div>
        <div class="onboard-step-title">{hasKey ? 'API key ready' : 'Create an API key'}</div>
        <div class="onboard-step-sub">{hasKey ? `${keys.length} key${keys.length > 1 ? 's' : ''} created` : 'Needed to authenticate the SDK'}</div>
        {#if !hasKey}<a href="/api-keys" class="dash-btn dash-btn-primary" style="margin-top:12px;display:inline-flex">Create API Key →</a>{/if}
      </div>
    </div>
    <div class="onboard-step">
      <div class="onboard-step-num">2</div>
      <div><div class="onboard-step-title">Install the SDK</div><div class="onboard-step-sub">pip install echologs</div></div>
    </div>
    <div class="onboard-step">
      <div class="onboard-step-num">3</div>
      <div><div class="onboard-step-title">Wrap your script</div><div class="onboard-step-sub">Two lines — your code stays the same</div></div>
    </div>
    <div class="onboard-step" style="border-bottom:none">
      <div class="onboard-step-num">4</div>
      <div>
        <div class="onboard-step-title">Run it — this page updates automatically</div>
        <div class="onboard-step-sub" style="margin-top:4px"><a href="/docs" style="color:var(--green);font-family:var(--font-mono);font-size:11px">View full SDK docs →</a></div>
      </div>
    </div>
  </div>

{:else}

  <!-- ── Usage meter ── -->
  <div class="dash-card" style="padding:16px 24px;margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:16px">
        <div>
          <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:3px">Executions this month</div>
          <div style="font-family:var(--font-mono);font-size:13px;font-weight:700">
            {stats.thisMonth.toLocaleString()}
            <span style="font-weight:400;color:var(--muted)"> / {limits.executions === Infinity ? 'Unlimited' : limits.executions.toLocaleString()}</span>
          </div>
        </div>
        {#if execWarning && plan !== 'team'}
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--red);background:var(--red-dim);border:1px solid #dc262630;padding:4px 12px;border-radius:20px">
            {execPct === 100 ? 'Limit reached' : `${execPct}% used — upgrade soon`}
          </div>
        {/if}
      </div>
      {#if plan === 'free'}
        <a href={POLAR_CHECKOUT_LINKS.pro_monthly} rel="external noopener noreferrer" target="_blank" style="font-family:var(--font-mono);font-size:11px;color:var(--green);font-weight:700;text-decoration:none;white-space:nowrap">Upgrade to Pro →</a>
      {:else if plan === 'pro'}
        <a href={POLAR_CHECKOUT_LINKS.team_monthly} rel="external noopener noreferrer" target="_blank" style="font-family:var(--font-mono);font-size:11px;color:var(--green);font-weight:700;text-decoration:none;white-space:nowrap">Upgrade to Team →</a>
      {/if}
    </div>
    {#if limits.executions !== Infinity}
      <div style="height:5px;background:var(--surface2);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:{execPct}%;background:{execColor};border-radius:3px;transition:width .4s ease"></div>
      </div>
    {:else}
      <div style="height:5px;background:var(--green-dim);border-radius:3px"></div>
    {/if}
  </div>

  <!-- ── Stat cards ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">

    <!-- Total -->
    <div class="dash-card" style="padding:18px 20px">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:10px">Total executions</div>
      <div style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;line-height:1;margin-bottom:8px">{stats.total.toLocaleString()}</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:2px 10px;display:inline-block">all time</div>
    </div>

    <!-- Pass rate -->
    <div class="dash-card" style="padding:18px 20px">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:10px">Pass rate</div>
      <div style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;line-height:1;margin-bottom:8px;color:{passRateColor(passRatePct)}">{passRatePct}</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);background:var(--green-dim);border:1px solid var(--green-mid);border-radius:20px;padding:2px 10px;display:inline-block;color:var(--green)">{stats.passed.toLocaleString()} passed</div>
    </div>

    <!-- Failures -->
    <div class="dash-card" style="padding:18px 20px">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:10px">Failures</div>
      <div style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;line-height:1;margin-bottom:8px;color:{stats.failed > 0 ? 'var(--red)' : 'var(--text)'}">{stats.failed.toLocaleString()}</div>
      <div style="font-family:var(--font-mono);font-size:10px;padding:2px 10px;border-radius:20px;display:inline-block;background:{stats.failed > 0 ? 'var(--red-dim)' : 'var(--green-dim)'};border:1px solid {stats.failed > 0 ? '#dc262630' : 'var(--green-mid)'};color:{stats.failed > 0 ? 'var(--red)' : 'var(--green)'}">
        {stats.failed > 0 ? 'needs attention' : 'all clear'}
      </div>
    </div>

    <!-- Avg duration -->
    <div class="dash-card" style="padding:18px 20px">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:10px">Avg duration</div>
      <div style="font-family:var(--font-sans);font-size:1.6rem;font-weight:800;line-height:1;margin-bottom:8px">{formatDuration(stats.avgDuration)}</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:2px 10px;display:inline-block">per execution</div>
    </div>

  </div>

  <!-- ── Charts ── -->
  <div style="display:grid;grid-template-columns:1.8fr 1fr;gap:12px;margin-bottom:16px">
    <BarChart days={chartDays} />
    <DonutChart passed={stats.passed} failed={stats.failed} />
  </div>

  <!-- ── Recent executions ── -->
  <div class="dash-card" style="margin-bottom:16px">
    <div class="dash-card-inner-header">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="dash-card-title">Recent executions</div>
          <div class="dash-card-sub">latest 8 runs across all scripts</div>
        </div>
        <a href="/executions" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 14px;white-space:nowrap">View all →</a>
      </div>
    </div>
    <ExecutionsTable rows={recent} />
  </div>

  <!-- ── Scripts ── -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <div>
      <div class="dash-section-title">Scripts</div>
      <div class="dash-section-sub">Auto-created on first SDK execution</div>
    </div>
    <a href="/scripts" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 14px">View all →</a>
  </div>

  {#if scripts.length > 0}
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      {#each scripts as s (s.id)}
        {@const pr = passRate(s.pass, s.total)}
        {@const prNum = pr === '—' ? null : parseInt(pr)}
        <a href="/scripts/{s.id}" style="display:grid;grid-template-columns:1fr 80px 100px 80px;align-items:center;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 20px;text-decoration:none;transition:border-color .15s">
          <div>
            <div style="font-family:var(--font-sans);font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">{s.name}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">{s.total.toLocaleString()} runs · avg {formatDuration(s.avgMs)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:3px">Pass rate</div>
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:{prNum === null ? 'var(--muted)' : prNum >= 95 ? 'var(--green)' : prNum >= 80 ? '#d97706' : 'var(--red)'}">{pr}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:3px">Failures</div>
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:{s.total - s.pass > 0 ? 'var(--red)' : 'var(--green)'}">{s.total - s.pass}</div>
          </div>
          <div style="text-align:right;font-family:var(--font-mono);font-size:14px;color:var(--muted)">→</div>
        </a>
      {/each}
    </div>
  {/if}

  <!-- ── API Keys ── -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <div>
      <div class="dash-section-title">API Keys</div>
      <div class="dash-section-sub">Shown once — store them securely</div>
    </div>
    <a href="/api-keys" class="dash-btn dash-btn-ghost" style="font-size:11px;padding:5px 14px">Manage →</a>
  </div>

  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px">
    {#each keys as key (key.id)}
      <div class="dash-key-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div class="dash-key-name">{key.name}</div>
        </div>
        <div class="dash-key-value">el_••••••••••••••••••••••••••••••••••••••••••••••••</div>
        <div class="dash-key-meta">Created {formatRelative(key.created_at)}</div>
      </div>
    {/each}
    <a href="/api-keys" class="dash-key-new" style="min-height:90px">
      <div style="font-size:22px;line-height:1">+</div>
      <div>Generate new API key</div>
    </a>
  </div>

{/if}