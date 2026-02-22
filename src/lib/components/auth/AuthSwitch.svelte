<script>
  // Use 'button' type when toggling state on the same page (login/signup)
  // Use 'link' type when navigating to a different page (back to login)
  let { text, linkText, href, onclick } = $props()
</script>

<p class="auth-switch">
  {text}
  {#if href}
    <a {href} class="auth-switch-link">{linkText}</a>
  {:else}
    <button class="auth-switch-btn" {onclick}>{linkText}</button>
  {/if}
</p>
