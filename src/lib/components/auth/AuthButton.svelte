<script>
  let {
    label        = 'Submit',
    loadingLabel = 'Loading...',
    loading      = false,
    disabled     = false,
  } = $props()

  let isDisabled = $derived(loading || disabled)
</script>

<button
  type="submit"
  class="auth-btn"
  disabled={isDisabled}
  aria-disabled={isDisabled}
>
  {#if loading}
    <span class="auth-btn-spinner"></span>
    {loadingLabel}
  {:else}
    {label}
  {/if}
</button>

<style>
  .auth-btn {
    width: 100%;
    padding: 11px 20px;
    border-radius: 9px;
    border: none;
    background: var(--green);
    color: #080b0f;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s, transform .15s, box-shadow .15s, opacity .15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .auth-btn:hover:not(:disabled) {
    background: #00ff88;
    box-shadow: 0 6px 20px #00e57a33;
    transform: translateY(-1px);
  }
  .auth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .auth-btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(8,11,15,0.3);
    border-top-color: #080b0f;
    border-radius: 50%;
    animation: btn-spin .6s linear infinite;
    flex-shrink: 0;
  }
  @keyframes btn-spin { to { transform: rotate(360deg); } }
</style>