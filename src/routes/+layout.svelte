<script>
  import '../app.css'
  import { ModeWatcher } from 'mode-watcher'
  import { invalidate }  from '$app/navigation'
  import { onMount, setContext } from 'svelte'
  import { mode, toggleMode } from 'mode-watcher'

  let { data, children } = $props()
  let supabase = $derived(data.supabase)

  // isDark derived from mode-watcher's reactive store
  let isDark = $derived(mode.current === 'dark')

  setContext('theme', {
    get isDark() { return isDark },
    toggleTheme: toggleMode,
  })

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth')
    })
    return () => subscription.unsubscribe()
  })
</script>

<!-- defaultMode="light" — light is the default, respects user preference and localStorage -->
<ModeWatcher defaultMode="light" />

{@render children()}