<script>
  let {
    id,
    name,
    type       = 'text',
    label,
    required   = false,
    minlength  = undefined,
    autocomplete = undefined,
    placeholder  = '',
    value        = $bindable(''),
    borderColor  = undefined,
    autofocus    = false,
    children,
  } = $props()
</script>

<div class="auth-field">
  <div class="auth-field-label-row">
    <label class="auth-label" for={id}>{label}</label>
    {#if children}
      {@render children()}
    {/if}
  </div>
  <input
    {id}
    {name}
    {type}
    {required}
    {minlength}
    {autocomplete}
    {placeholder}
    {autofocus}
    bind:value
    class="auth-input"
    style={borderColor ? `border-color:${borderColor}` : undefined}
  />
</div>