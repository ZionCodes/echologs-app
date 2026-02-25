<script>
    import { page } from '$app/stores'
  
    let path     = $derived($page.url.pathname)
    let isActive = (href) => href === '/' ? path === '/' : path.startsWith(href)
  
    const nav = [
      { section: 'Overview', items: [
        { href: '/',           icon: '▦', label: 'Dashboard'  },
        { href: '/executions', icon: '≡', label: 'Executions' },
      ]},
      { section: 'Manage', items: [
        { href: '/scripts',  icon: '◈', label: 'Scripts'  },
        { href: '/api-keys', icon: '⬡', label: 'API Keys' },
      ]},
      { section: 'Settings', items: [
        { href: '/account', icon: '◎', label: 'Account' },
      ]},
    ]
  </script>
  
  <aside class="dash-sidebar">
    {#each nav as group}
      <span class="dash-sidebar-section">{group.section}</span>
      {#each group.items as item}
        <a href={item.href} class="dash-sidebar-item" class:active={isActive(item.href)}>
          <span class="dash-sidebar-icon">{item.icon}</span>
          {item.label}
        </a>
      {/each}
    {/each}
  </aside>