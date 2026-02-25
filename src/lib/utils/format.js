export function formatDuration(ms) {
    if (!ms && ms !== 0) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  
  export function formatRelative(dateStr) {
    if (!dateStr) return '—'
    const sec = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (sec < 60)    return 'just now'
    if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  export function formatAbsolute(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  
  export function passRate(pass, total) {
    if (!total) return '—'
    return `${Math.round((pass / total) * 100)}%`
  }
  
  export function passRateColor(pct) {
    const n = parseInt(pct)
    if (isNaN(n)) return 'var(--muted)'
    if (n >= 95)  return 'var(--green)'
    if (n >= 80)  return '#d97706'
    return 'var(--red)'
  }