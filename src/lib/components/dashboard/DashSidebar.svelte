<script>
  import { page } from '$app/stores'

  let path = $derived($page.url.pathname)

  const nav = [
    {
      section: 'Overview',
      items: [
        { href: '/',           icon: '▦', label: 'Dashboard'  },
        { href: '/executions', icon: '≡', label: 'Executions' },
        { href: '/scripts',    icon: '◈', label: 'Scripts'    },
      ]
    },
    {
      section: 'Account',
      items: [
        { href: '/api-keys', icon: '⚿', label: 'API Keys' },
        { href: '/account',  icon: '◯', label: 'Account'  },
      ]
    },
    {
      section: 'Help',
      items: [
        { href: '/docs', icon: '⊡', label: 'SDK Docs' },
      ]
    },
  ]

  function isActive(href) {
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }
</script>

<aside class="dash-sidebar">
  {#each nav as group}
    <span class="dash-sidebar-section">{group.section}</span>
    {#each group.items as item}
      {@const active = isActive(item.href)}
      <a href={item.href} class="dash-sidebar-item" class:active>
        <span class="dash-sidebar-icon">{item.icon}</span>
        {item.label}
      </a>
    {/each}
  {/each}
</aside>