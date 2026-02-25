<script>
    import { enhance } from '$app/forms'
    import PageHeader  from '$lib/components/dashboard/PageHeader.svelte'
    import DashAlert   from '$lib/components/dashboard/DashAlert.svelte'
    import { formatAbsolute } from '$lib/utils/format.js'
  
    let { data, form } = $props()
    let { keys }       = $derived(data)
  
    let showForm   = $state(false)
    let generating = $state(false)
    let copied     = $state(false)
    let keyName    = $state('')
  
    function copyKey() {
      if (!form?.newKey) return
      navigator.clipboard.writeText(form.newKey)
      copied = true
      setTimeout(() => { copied = false }, 2500)
    }
  
    // Reset form when a new key is generated
    $effect(() => {
      if (form?.newKey) {
        showForm = false
        keyName  = ''
      }
    })
  </script>
  
  <svelte:head><title>API Keys — EchoLogs</title></svelte:head>
  
  <PageHeader
    title="API Keys"
    sub="Keys are hashed and shown only once — store them somewhere safe"
  />
  
  <!-- Newly generated key banner -->
  {#if form?.newKey}
    <div class="dash-alert dash-alert-success" style="margin-bottom:20px">
      <div style="font-family:var(--font-sans);font-weight:700;margin-bottom:10px">
        Key created: {form.newKeyName}
      </div>
      <div style="
        font-family:var(--font-mono);font-size:12px;
        background:var(--surface);border:1px solid var(--green-mid);
        border-radius:8px;padding:12px 14px;
        word-break:break-all;margin-bottom:12px;color:var(--text)
      ">
        {form.newKey}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font-family:var(--font-mono);font-size:11px">
          This key will not be shown again. Copy it now.
        </span>
        <button class="dash-btn dash-btn-primary" style="font-size:12px;padding:7px 18px" onclick={copyKey}>
          {copied ? 'Copied!' : 'Copy key'}
        </button>
      </div>
    </div>
  {/if}
  
  <DashAlert type="error" message={form?.error} />
  
  <!-- Existing keys -->
  {#if keys.length > 0}
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px">
      {#each keys as key}
        <div class="dash-key-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div class="dash-key-name">{key.name}</div>
            <form method="POST" action="?/revoke" use:enhance>
              <input type="hidden" name="id" value={key.id} />
              <button
                type="submit"
                class="dash-key-revoke"
                onclick={(e) => {
                  if (!confirm(`Revoke "${key.name}"? Any scripts using this key will stop working immediately.`)) {
                    e.preventDefault()
                  }
                }}
              >
                Revoke
              </button>
            </form>
          </div>
          <div class="dash-key-value">
            el_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
          </div>
          <div class="dash-key-meta">Created {formatAbsolute(key.created_at)}</div>
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Generate new key -->
  {#if !showForm}
    <button
      class="dash-key-new"
      style="max-width:360px;min-height:100px"
      onclick={() => { showForm = true }}
    >
      <div style="font-size:26px;line-height:1">+</div>
      <div>Generate new API key</div>
    </button>
  {:else}
    <div class="dash-card" style="padding:24px;max-width:420px">
      <div class="dash-card-title" style="margin-bottom:4px">New API key</div>
      <div class="dash-card-sub" style="margin-bottom:20px">Give it a name so you remember what it's for</div>
  
      <form
        method="POST"
        action="?/generate"
        use:enhance={() => {
          generating = true
          return async ({ update }) => { await update(); generating = false }
        }}
      >
        <div style="margin-bottom:16px">
          <label class="dash-form-label" for="keyname">Key name</label>
          <input
            id="keyname"
            class="dash-input"
            name="name"
            type="text"
            placeholder="e.g. Production, Local dev, CI pipeline"
            required
            bind:value={keyName}
          />
          <div class="dash-input-hint">Use a name that describes where this key will be used</div>
        </div>
  
        <div style="display:flex;gap:8px">
          <button
            type="submit"
            class="dash-btn dash-btn-primary"
            disabled={generating || !keyName.trim()}
          >
            {generating ? 'Generating...' : 'Generate key'}
          </button>
          <button
            type="button"
            class="dash-btn dash-btn-ghost"
            onclick={() => { showForm = false; keyName = '' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}