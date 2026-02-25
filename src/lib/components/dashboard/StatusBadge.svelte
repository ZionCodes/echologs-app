<script>
    let { status } = $props()
  </script>
  
  <span class="status-badge {status === 'pass' ? 'status-pass' : 'status-fail'}">
    <span class="status-dot"></span>{status}
  </span>