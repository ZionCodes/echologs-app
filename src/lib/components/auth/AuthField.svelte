<script>
  // All standard input attributes passed as props
  // children — optional snippet for the label row (e.g. forgot password link)
  let {
    id,
    name,
    type       = 'text',
    label,
    required   = false,
    autocomplete = '',
    placeholder  = '',
    minlength,
    value      = $bindable(''),
    children,
    borderColor,  // reactive border for confirm password validation
  } = $props()
</script>

<div class="auth-field">
  <div class="auth-field-row">
    <label for={id} class="auth-label">{label}</label>
    {@render children?.()}
  </div>
  <input
    {id}
    {name}
    {type}
    {required}
    {autocomplete}
    {placeholder}
    {minlength}
    bind:value
    class="auth-input"
    style={borderColor ? `border-color: ${borderColor};` : ''}
    onfocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)' }}
    onblur={(e)  => { e.currentTarget.style.borderColor = borderColor ?? 'var(--border)' }}
  />
</div>
