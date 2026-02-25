<script>
  let { passed = 0, failed = 0 } = $props()

  let total   = $derived(passed + failed)
  let pctNum  = $derived(total ? Math.round((passed / total) * 100) : 0)
  let circ    = 2 * Math.PI * 38
  let passArc = $derived((pctNum / 100) * circ)
  let failArc = $derived(circ - passArc)
</script>

<div class="dash-card" style="height:100%">
  <div class="dash-card-inner-header">
    <div class="dash-card-title">Status split</div>
    <div class="dash-card-sub">all time</div>
  </div>
  <div class="dash-card-inner-body dash-donut-wrap">
    <div class="dash-donut-ring">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="42" fill="none" stroke="var(--border)" stroke-width="13"/>
        <circle cx="55" cy="55" r="42" fill="none" stroke="var(--green)" stroke-width="13"
          stroke-dasharray="{passArc} {failArc}" stroke-linecap="round"
          style="transform:rotate(-90deg);transform-origin:55px 55px"/>
        {#if failed > 0}
          <circle cx="55" cy="55" r="42" fill="none" stroke="var(--red)" stroke-width="13"
            stroke-dasharray="{failArc} {passArc}" stroke-dashoffset="{-passArc}"
            stroke-linecap="round" style="transform:rotate(-90deg);transform-origin:55px 55px"/>
        {/if}
      </svg>
      <div class="dash-donut-inner">
        <div class="dash-donut-pct">{pctNum}%</div>
        <div class="dash-donut-lbl">pass rate</div>
      </div>
    </div>
    <div class="dash-donut-legend">
      <div class="dash-legend-row">
        <div class="dash-legend-dot" style="background:var(--green)"></div>
        <span class="dash-legend-text">Pass <strong>{passed.toLocaleString()}</strong></span>
      </div>
      <div class="dash-legend-row">
        <div class="dash-legend-dot" style="background:var(--red)"></div>
        <span class="dash-legend-text">Fail <strong>{failed.toLocaleString()}</strong></span>
      </div>
    </div>
  </div>
</div>