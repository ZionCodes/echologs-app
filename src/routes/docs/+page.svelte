<script>
  import { onMount, setContext } from 'svelte'
  import DashNav from '$lib/components/dashboard/DashNav.svelte'

  let { data }           = $props()
  let { snippets, user } = $derived(data)

  let copied     = $state('')
  let activeId   = $state('quickstart')
  let activeLang = $state('python')
  let isDark     = $state(true)

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark')

    const observer = new IntersectionObserver(
      entries => { for (const e of entries) { if (e.isIntersecting) activeId = e.target.id } },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  })

  function toggleTheme() {
    isDark = !isDark
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('mode-watcher-mode', isDark ? 'dark' : 'light')
  }

  setContext('theme', {
    get isDark() { return isDark },
    toggleTheme,
  })

  function copy(raw, id) {
    navigator.clipboard.writeText(raw)
    copied = id
    setTimeout(() => { copied = '' }, 2000)
  }

  const sections = [
    { id: 'quickstart', label: 'Quickstart'            },
    { id: 'install',    label: 'Installation'          },
    { id: 'init',       label: 'Initialise'            },
    { id: 'context',    label: 'Context manager'       },
    { id: 'decorator',  label: 'Decorator'             },
    { id: 'envvar',     label: 'Environment variables' },
    { id: 'errors',     label: 'Error handling'        },
    { id: 'naming',     label: 'Script naming'         },
    { id: 'examples',   label: 'Examples'              },
  ]

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId = id
  }
</script>

<svelte:head>
  <title>SDK Docs — EchoLogs</title>
  <meta name="description" content="EchoLogs SDK documentation for Python and JavaScript." />
</svelte:head>

<style>
  :global(body::before) { display: none; }
  :global(body::after)  { display: none; }
  :global(.shiki) { margin:0 !important; padding:18px 20px !important; background:transparent !important; font-size:13px !important; line-height:1.8 !important; overflow-x:auto; white-space:pre; }
  :global(.shiki code) { font-family: var(--font-mono) !important; }

  .docs-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 32px 80px;
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 48px;
    align-items: start;
  }
  @media (max-width: 768px) {
    .docs-body { grid-template-columns: 1fr; padding: 20px 16px 60px; }
    .docs-sidebar { display: none; }
  }
</style>

<DashNav {user} />

<div class="docs-body">

  <!-- Sidebar -->
  <div class="docs-sidebar" style="position:sticky;top:78px">
    <div style="display:flex;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:4px;margin-bottom:20px">
      <button
        onclick={() => activeLang = 'python'}
        style="flex:1;padding:6px 8px;border-radius:7px;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;transition:all .15s;background:{activeLang === 'python' ? 'var(--surface)' : 'transparent'};color:{activeLang === 'python' ? 'var(--text)' : 'var(--muted)'};box-shadow:{activeLang === 'python' ? '0 1px 4px rgba(0,0,0,.2)' : 'none'}"
      >Python</button>
      <button
        onclick={() => activeLang = 'js'}
        style="flex:1;padding:6px 8px;border-radius:7px;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;transition:all .15s;background:{activeLang === 'js' ? 'var(--surface)' : 'transparent'};color:{activeLang === 'js' ? 'var(--text)' : 'var(--muted)'};box-shadow:{activeLang === 'js' ? '0 1px 4px rgba(0,0,0,.2)' : 'none'}"
      >JavaScript</button>
    </div>

    <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--muted2);margin-bottom:8px;padding-left:12px">On this page</div>
    {#each sections as s (s.id)}
      {@const isActive = activeId === s.id}
      <button
        onclick={() => scrollTo(s.id)}
        style="display:block;width:100%;text-align:left;background:{isActive ? 'var(--green-dim)' : 'transparent'};border:none;border-left:2px solid {isActive ? 'var(--green)' : 'transparent'};cursor:pointer;font-family:var(--font-mono);font-size:11px;padding:6px 12px;border-radius:0 7px 7px 0;color:{isActive ? 'var(--green)' : 'var(--muted)'};font-weight:{isActive ? '700' : '400'};transition:all .15s;margin-bottom:2px"
      >{s.label}</button>
    {/each}

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
      <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--muted2);margin-bottom:8px;padding-left:12px">Resources</div>
      <a href="https://app.echologs.com/api-keys" style="display:block;font-family:var(--font-mono);font-size:11px;color:var(--muted);text-decoration:none;padding:5px 12px;border-radius:7px;transition:color .15s">Get API key →</a>
      <a href="https://pypi.org/project/echologs" rel="external noopener noreferrer" target="_blank" style="display:block;font-family:var(--font-mono);font-size:11px;color:var(--muted);text-decoration:none;padding:5px 12px;border-radius:7px;transition:color .15s">PyPI →</a>
      <a href="https://npmjs.com/package/echologs" rel="external noopener noreferrer" target="_blank" style="display:block;font-family:var(--font-mono);font-size:11px;color:var(--muted);text-decoration:none;padding:5px 12px;border-radius:7px;transition:color .15s">npm →</a>
    </div>
  </div>

  <!-- Content -->
  <div style="min-width:0">

    <div style="margin-bottom:40px;padding-bottom:28px;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--green);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">Documentation</div>
      <h1 style="font-family:var(--font-sans);font-size:2rem;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px;color:var(--text)">SDK Reference</h1>
      <p style="font-family:var(--font-mono);font-size:13px;color:var(--muted);margin:0;line-height:1.7">Add monitoring to any Python or JavaScript script in under 2 minutes. No infrastructure changes.</p>
    </div>

    <!-- QUICKSTART -->
    <div id="quickstart" class="docs-section">
      <div class="docs-h2">Quickstart</div>
      <p class="docs-p">Install the package, add two lines to your script, and run it. Your execution appears in the dashboard automatically.</p>
      {#if activeLang === 'python'}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">terminal</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_install.raw, 'qs1')}>{copied === 'qs1' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_install.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">your_script.py</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_quickstart.raw, 'qs2')}>{copied === 'qs2' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_quickstart.html}
        </div>
        <div class="docs-callout" style="margin-top:8px">
          Set <code class="docs-inline">ECHOLOGS_API_KEY</code> in your terminal before running.
          Get your key from the <a href="https://app.echologs.com/api-keys" class="docs-link">API Keys page →</a>
        </div>
      {:else}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">terminal</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_install.raw, 'qs3')}>{copied === 'qs3' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_install.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">your_script.mjs</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_quickstart.raw, 'qs4')}>{copied === 'qs4' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_quickstart.html}
        </div>
        <div class="docs-callout" style="margin-top:8px">
          Create a <code class="docs-inline">.env</code> file with your API key — the SDK reads it automatically.
          Get your key from the <a href="https://app.echologs.com/api-keys" class="docs-link">API Keys page →</a>
        </div>
      {/if}
    </div>

    <!-- INSTALL -->
    <div id="install" class="docs-section">
      <div class="docs-h2">Installation</div>
      {#if activeLang === 'python'}
        <p class="docs-p">Requires Python 3.8 or above.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">pip</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_install.raw, 'i1')}>{copied === 'i1' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_install.html}
        </div>
        <div class="docs-callout" style="margin-top:12px">
          No other packages required. The SDK reads <code class="docs-inline">ECHOLOGS_API_KEY</code> from <code class="docs-inline">os.environ</code> automatically. See the Environment variables section for how to set it safely.
        </div>
      {:else}
        <p class="docs-p">Requires Node.js 18 or above.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">npm</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_install.raw, 'i3')}>{copied === 'i3' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_install.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">yarn</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_install_yarn.raw, 'i4')}>{copied === 'i4' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_install_yarn.html}
        </div>
        <div class="docs-callout" style="margin-top:12px">
          No dotenv package needed. The SDK automatically reads <code class="docs-inline">ECHOLOGS_API_KEY</code> from <code class="docs-inline">process.env</code> in production, and from your <code class="docs-inline">.env</code> file locally.
        </div>
      {/if}
    </div>

    <!-- INIT -->
    <div id="init" class="docs-section">
      <div class="docs-h2">Initialise</div>
      <p class="docs-p">The SDK auto-initialises when it finds <code class="docs-inline">ECHOLOGS_API_KEY</code> in your environment. You never need to call <code class="docs-inline">init()</code> manually.</p>
      {#if activeLang === 'python'}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">auto init — recommended</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_auto_init.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">explicit init — optional</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_explicit_init.html}
        </div>
      {:else}
        <p class="docs-p">Import echologs and it auto-initialises from <code class="docs-inline">ECHOLOGS_API_KEY</code> and starts monitoring immediately.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">auto init — recommended</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_auto_init.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">explicit init — optional</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_explicit_init.html}
        </div>
      {/if}
    </div>

    <!-- CONTEXT -->
    <div id="context" class="docs-section">
      <div class="docs-h2">Context manager</div>
      <p class="docs-p">The recommended pattern. Wrap your code and EchoLogs automatically captures timing, stdout, stderr, and errors.</p>
      {#if activeLang === 'python'}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_context.raw, 'ctx1')}>{copied === 'ctx1' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_context.html}
        </div>
        <p class="docs-p" style="margin-top:14px">Override the auto-detected name:</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_context_named.raw, 'ctx2')}>{copied === 'ctx2' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_context_named.html}
        </div>
      {:else}
        <p class="docs-p">Import echologs and your entire script is monitored automatically. No wrapper needed.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">javascript — recommended</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_context.raw, 'ctx3')}>{copied === 'ctx3' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_context.html}
        </div>
        <p class="docs-p" style="margin-top:14px">If you need a custom name or want to monitor only part of your code:</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">javascript — explicit wrapper</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_context_named.raw, 'ctx4')}>{copied === 'ctx4' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_context_named.html}
        </div>
      {/if}
    </div>

    <!-- DECORATOR -->
    <div id="decorator" class="docs-section">
      <div class="docs-h2">Decorator / wrapper</div>
      <p class="docs-p">If your script is already in a function, use the decorator pattern instead.</p>
      {#if activeLang === 'python'}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_decorator.raw, 'dec1')}>{copied === 'dec1' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_decorator.html}
        </div>
      {:else}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">javascript</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_decorator.raw, 'dec2')}>{copied === 'dec2' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_decorator.html}
        </div>
      {/if}
    </div>

    <!-- ENV VARS -->
    <div id="envvar" class="docs-section">
      <div class="docs-h2">Environment variables</div>
      <p class="docs-p">Never hardcode your API key. Always set it as an environment variable — the SDK reads it automatically.</p>

      {#if activeLang === 'python'}
        <p class="docs-p" style="font-weight:700;color:var(--text)">Production</p>
        <p class="docs-p">Set it in your platform's environment settings. The SDK picks it up automatically — no code changes needed.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">github actions</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_github.raw, 'env_gh')}>{copied === 'env_gh' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_github.html}
        </div>

        <p class="docs-p" style="font-weight:700;color:var(--text);margin-top:20px">Local — Option A: export in terminal (safest)</p>
        <p class="docs-p">Set the variable once per terminal session. Nothing goes in any file that could be committed.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">terminal</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_py_export.raw, 'envpy_exp')}>{copied === 'envpy_exp' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_py_export.html}
        </div>

        <p class="docs-p" style="font-weight:700;color:var(--text);margin-top:20px">Local — Option B: .env file with python-dotenv</p>
        <p class="docs-p">Convenient if you have many env vars. Install python-dotenv once, create a <code class="docs-inline">.env</code> file, and load it at the top of your script.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">pip — one time</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_install_dotenv.raw, 'envpy_pip')}>{copied === 'envpy_pip' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_install_dotenv.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">.env — never commit this file</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_file.raw, 'env_file')}>{copied === 'env_file' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_file.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">your_script.py</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_py_dotenv_import.raw, 'envpy_dot')}>{copied === 'envpy_dot' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_py_dotenv_import.html}
        </div>

      {:else}

        <p class="docs-p" style="font-weight:700;color:var(--text)">Production</p>
        <p class="docs-p">Set it in your platform's environment settings. The SDK reads <code class="docs-inline">process.env.ECHOLOGS_API_KEY</code> automatically.</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">github actions</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_github.raw, 'env_gh_js')}>{copied === 'env_gh_js' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_github.html}
        </div>

        <p class="docs-p" style="font-weight:700;color:var(--text);margin-top:20px">Local development — .env file</p>
        <p class="docs-p">
          Create a <code class="docs-inline">.env</code> file with your API key.
          The SDK reads it automatically — no dotenv package, no flags, no extra steps. Just run your script normally.
        </p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">.env — never commit this file</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_file.raw, 'envjs_file')}>{copied === 'envjs_file' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_file.html}
        </div>
        <div class="docs-code-block" style="margin-top:8px">
          <div class="docs-code-header"><span class="docs-code-lang">terminal</span><button class="docs-copy-btn" onclick={() => copy(snippets.env_js_local.raw, 'envjs_run')}>{copied === 'envjs_run' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.env_js_local.html}
        </div>
        <div class="docs-callout" style="margin-top:12px">
          If <code class="docs-inline">ECHOLOGS_API_KEY</code> is already set in your shell or injected by your platform, the SDK uses that and ignores the <code class="docs-inline">.env</code> file entirely.
        </div>

      {/if}

      <div class="docs-callout" style="margin-top:16px">
        Always add <code class="docs-inline">.env</code> to your <code class="docs-inline">.gitignore</code>.
        Your API key must never be committed to version control or hardcoded in your source code.
      </div>
    </div>

    <!-- ERRORS -->
    <div id="errors" class="docs-section">
      <div class="docs-h2">Error handling</div>
      <p class="docs-p">If your code throws, EchoLogs marks the execution as <strong style="color:var(--red)">failed</strong>, captures the full stack trace, and re-raises so your existing error handling still works.</p>
      {#if activeLang === 'python'}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">python</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_errors.html}
        </div>
      {:else}
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">javascript</span></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_errors.html}
        </div>
      {/if}
      <div class="docs-callout" style="margin-top:14px">
        Slack alerts require Pro or Team. Email alerts are available on all plans.
        Configure at <a href="https://app.echologs.com/scripts" class="docs-link">app.echologs.com/scripts →</a>
      </div>
    </div>

    <!-- NAMING -->
    <div id="naming" class="docs-section">
      <div class="docs-h2">Script naming</div>
      <p class="docs-p">EchoLogs auto-detects the script name from your filename. You can rename the display name in the dashboard anytime without touching your code.</p>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:8px">SDK name (permanent)</div>
            <div style="font-family:var(--font-mono);font-size:12px;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:8px 12px;color:var(--text)">invoice_puller</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:6px">Auto-detected or set via name=</div>
          </div>
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted2);margin-bottom:8px">Display name (editable)</div>
            <div style="font-family:var(--font-mono);font-size:12px;color:var(--green);background:var(--surface);border:1px solid var(--green-mid);border-radius:7px;padding:8px 12px">Invoice Puller</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:6px">Change anytime in dashboard</div>
          </div>
        </div>
      </div>
      <div class="docs-callout" style="margin-top:14px">If you change the name in your code, EchoLogs creates a new script entry. Use the same name consistently across all runs.</div>
    </div>

    <!-- EXAMPLES -->
    <div id="examples" class="docs-section" style="border-bottom:none">
      <div class="docs-h2">Examples</div>
      {#if activeLang === 'python'}
        <p class="docs-p" style="font-weight:700;color:var(--text);margin-top:4px">OpenAI summariser</p>
        <div class="docs-code-block" style="margin-bottom:24px">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_ex_openai.raw, 'ex1')}>{copied === 'ex1' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_ex_openai.html}
        </div>
        <p class="docs-p" style="font-weight:700;color:var(--text)">Database cleanup</p>
        <div class="docs-code-block" style="margin-bottom:24px">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_ex_db.raw, 'ex2')}>{copied === 'ex2' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_ex_db.html}
        </div>
        <p class="docs-p" style="font-weight:700;color:var(--text)">APScheduler cron</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">python</span><button class="docs-copy-btn" onclick={() => copy(snippets.py_ex_scheduler.raw, 'ex3')}>{copied === 'ex3' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.py_ex_scheduler.html}
        </div>
      {:else}
        <p class="docs-p" style="font-weight:700;color:var(--text);margin-top:4px">OpenAI summariser</p>
        <div class="docs-code-block" style="margin-bottom:24px">
          <div class="docs-code-header"><span class="docs-code-lang">javascript</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_ex_openai.raw, 'ex4')}>{copied === 'ex4' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_ex_openai.html}
        </div>
        <p class="docs-p" style="font-weight:700;color:var(--text)">node-cron scheduled job</p>
        <div class="docs-code-block" style="margin-bottom:24px">
          <div class="docs-code-header"><span class="docs-code-lang">javascript</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_ex_cron.raw, 'ex5')}>{copied === 'ex5' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_ex_cron.html}
        </div>
        <p class="docs-p" style="font-weight:700;color:var(--text)">Stripe invoice sync</p>
        <div class="docs-code-block">
          <div class="docs-code-header"><span class="docs-code-lang">javascript</span><button class="docs-copy-btn" onclick={() => copy(snippets.js_ex_stripe.raw, 'ex6')}>{copied === 'ex6' ? '✓ Copied' : 'Copy'}</button></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html snippets.js_ex_stripe.html}
        </div>
      {/if}
    </div>

  </div>
</div>