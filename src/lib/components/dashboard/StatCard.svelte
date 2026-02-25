<script>
    let { label, value, valueColor, chip, chipType = 'green', footer } = $props()
  </script>
  
  <div class="dash-stat-card">
    <div class="dash-stat-label">{label}</div>
    <div class="dash-stat-value" style={valueColor ? `color:${valueColor}` : ''}>
      {value}
    </div>
    {#if chip || footer}
      <div class="flex items-center gap-2 mt-2">
        {#if chip}<span class="chip chip-{chipType}">{chip}</span>{/if}
        {#if footer}<span class="dash-stat-footer-text">{footer}</span>{/if}
      </div>
    {/if}
  </div>