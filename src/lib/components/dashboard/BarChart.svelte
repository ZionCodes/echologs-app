<script>
  let { days = [] } = $props()
  let max = $derived(Math.max(...days.map(d => d.pass + d.fail), 1))
</script>

<div class="dash-card" style="height:100%">
  <div class="dash-card-inner-header">
    <div class="dash-card-title">Executions — last 14 days</div>
    <div class="dash-card-sub">pass vs fail per day</div>
  </div>
  <div class="dash-card-inner-body">
    <div class="dash-bar-chart">
      {#each days as day}
        {@const total = day.pass + day.fail}
        {@const passH = ((day.pass / max) * 72).toFixed(1)}
        {@const failH = ((day.fail / max) * 72).toFixed(1)}
        <div class="dash-bar-col" title="Pass: {day.pass} | Fail: {day.fail}">
          {#if day.fail > 0}
            <div class="dash-bar-seg dash-bar-fail" style="height:{failH}px"></div>
          {/if}
          {#if day.pass > 0}
            <div class="dash-bar-seg dash-bar-pass" style="height:{passH}px"></div>
          {/if}
          {#if total === 0}
            <div class="dash-bar-empty"></div>
          {/if}
          <div class="dash-bar-day">{day.label}</div>
        </div>
      {/each}
    </div>
  </div>
</div>