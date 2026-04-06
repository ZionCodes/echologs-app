<script>
  import { onMount } from 'svelte'

  let {
    id,
    name,
    type         = 'text',
    label,
    required     = false,
    minlength    = undefined,
    autocomplete = undefined,
    placeholder  = '',
    value        = $bindable(''),
    borderColor  = undefined,
    autofocus    = false,
    children,
  } = $props()

  let inputEl = $state(null)

  onMount(() => {
    if (autofocus && inputEl) inputEl.focus()
  })
</script>

<div class="auth-field">
  <div class="auth-field-label-row">
    <label class="auth-label" for={id}>{label}</label>
    {#if children}
      {@render children()}
    {/if}
  </div>
  <input
    bind:this={inputEl}
    {id}
    {name}
    {type}
    {required}
    {minlength}
    {autocomplete}
    {placeholder}
    bind:value
    class="auth-input"
    style={borderColor ? `border-color:${borderColor}` : undefined}
  />
</div>