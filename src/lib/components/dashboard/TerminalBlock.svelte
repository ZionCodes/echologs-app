<script>
    let { label, text, color, smartColor = false, labelColor } = $props()
    let lines = $derived(text ? text.split('\n') : [])
  </script>
  
  {#if text}
    <div style="margin-bottom:16px">
      <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;color:{labelColor ?? 'var(--muted)'}">
        {label}
      </div>
      <div class="dash-terminal" style={color ? `color:${color}` : ''}>
        {#if smartColor}
          {#each lines as line}
            <div
              class:t-pass={line.toLowerCase().includes('done') || line.toLowerCase().includes('success')}
              class:t-fail={line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')}
            >{line}</div>
          {/each}
        {:else}
          {text}
        {/if}
      </div>
    </div>
  {/if}