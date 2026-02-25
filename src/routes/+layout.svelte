<script>
	import '../app.css'
	import { invalidate } from '$app/navigation'
	import { onMount, setContext } from 'svelte'
  
	let { data, children } = $props()
	let supabase = $derived(data.supabase)
	let isDark   = $state(false)
  
	function toggleTheme() {
	  isDark = !isDark
	  if (isDark) {
		document.documentElement.classList.add('dark')
		localStorage.setItem('theme', 'dark')
	  } else {
		document.documentElement.classList.remove('dark')
		localStorage.setItem('theme', 'light')
	  }
	}
  
	setContext('theme', {
	  toggleTheme,
	  get isDark() { return isDark }
	})
  
	onMount(() => {
	  isDark = document.documentElement.classList.contains('dark')
	  const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
		invalidate('supabase:auth')
	  })
	  return () => subscription.unsubscribe()
	})
  </script>
  
  {@render children()}