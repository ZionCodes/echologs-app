<script>
    import { passRate, passRateColor, formatDuration, formatRelative } from '$lib/utils/format.js'
  
    let { script, variant = 'avg' } = $props()
    let pr      = $derived(passRate(script.pass, script.total))
    let prColor = $derived(passRateColor(pr))
  </script>
  
  <a href="/scripts/{script.id}" class="dash-script-card">
    <div class="flex items-start justify-between mb-3">
      <div>
        <div class="dash-script-name">{script.name}</div>
        <div class="dash-script-id">{script.id.slice(0, 8)}…</div>
      </div>
      <span class="dash-slack-chip {script.slack_webhook ? 'dash-slack-on' : 'dash-slack-off'}">
        {script.slack_webhook ? '⚡ Slack on' : 'Slack off'}
      </span>
    </div>
    <div class="dash-script-stats">
      <div class="dash-sstat">
        <div class="dash-sstat-val" style="color:{prColor}">{pr}</div>
        <div class="dash-sstat-lbl">pass rate</div>
      </div>
      <div class="dash-sstat">
        <div class="dash-sstat-val">{script.total.toLocaleString()}</div>
        <div class="dash-sstat-lbl">total runs</div>
      </div>
      <div class="dash-sstat">
        {#if variant === 'avg'}
          <div class="dash-sstat-val">{formatDuration(script.avgMs ?? 0)}</div>
          <div class="dash-sstat-lbl">avg time</div>
        {:else}
          <div class="dash-sstat-val">
            {script.latestRun ? formatRelative(script.latestRun.started_at) : '—'}
          </div>
          <div class="dash-sstat-lbl">last run</div>
        {/if}
      </div>
    </div>
  </a>