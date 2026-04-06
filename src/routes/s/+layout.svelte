<script>
    import { onMount } from 'svelte'
  
    onMount(() => {
      const saved = localStorage.getItem('theme') ?? 'dark'
      document.documentElement.classList.toggle('dark', saved === 'dark')
    })
  </script>
  

  
  <slot />
  