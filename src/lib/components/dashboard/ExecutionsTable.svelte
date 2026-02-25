<script>
    import { goto } from '$app/navigation'
    import StatusBadge from './StatusBadge.svelte'
    import { formatDuration, formatRelative } from '$lib/utils/format.js'
  
    let { rows = [], liveRows = [], showScript = true } = $props()
  </script>
  
  <table class="dash-table">
    <thead>
      <tr>
        <th>Status</th>
        {#if showScript}<th>Script</th>{/if}
        <th>Duration</th>
        <th>Error</th>
        <th>When</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each liveRows as ex (ex.id)}
        <tr class="slide-in" style="background:var(--green-dim)"
          onclick={() => goto(`/executions/${ex.id}`)}>
          <td><StatusBadge status={ex.status} /></td>
          {#if showScript}
            <td>
              <div class="dash-table-script-name">{ex.scripts?.name ?? '—'}</div>
              <div class="dash-table-run">live</div>
            </td>
          {/if}
          <td class="dash-table-muted">{formatDuration(ex.duration_ms)}</td>
          <td>
            {#if ex.error}<div class="dash-table-err">{ex.error}</div>
            {:else}<span class="dash-table-muted">—</span>{/if}
          </td>
          <td class="dash-table-muted">just now</td>
          <td><span class="dash-table-arrow">View →</span></td>
        </tr>
      {/each}
  
      {#each rows as ex (ex.id)}
        <tr onclick={() => goto(`/executions/${ex.id}`)}>
          <td><StatusBadge status={ex.status} /></td>
          {#if showScript}
            <td><div class="dash-table-script-name">{ex.scripts?.name ?? '—'}</div></td>
          {/if}
          <td class="dash-table-muted">{formatDuration(ex.duration_ms)}</td>
          <td>
            {#if ex.error}<div class="dash-table-err">{ex.error}</div>
            {:else}<span class="dash-table-muted">—</span>{/if}
          </td>
          <td class="dash-table-muted">{formatRelative(ex.started_at)}</td>
          <td><span class="dash-table-arrow">View →</span></td>
        </tr>
      {:else}
        {#if liveRows.length === 0}
          <tr><td colspan={showScript ? 6 : 5}>
            <div class="dash-empty">No executions yet.</div>
          </td></tr>
        {/if}
      {/each}
    </tbody>
  </table>