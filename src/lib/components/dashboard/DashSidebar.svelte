<script>
  import { page } from '$app/stores'

  let { open = false, onClose } = $props()
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

<aside class="dash-sidebar" class:sidebar-mobile-open={open}>
  <button
    class="sidebar-close-btn"
    onclick={onClose}
    aria-label="Close sidebar"
  >
    ✕
  </button>

  {#each nav as group (group.section)}
    <span class="dash-sidebar-section">{group.section}</span>

    {#each group.items as item (item.href)}
      {@const active = isActive(item.href)}

      <a
        href={item.href}
        class="dash-sidebar-item"
        class:active={active}
        onclick={onClose}
      >
        <span class="dash-sidebar-icon">{item.icon}</span>
        {item.label}
      </a>

    {/each}
  {/each}
</aside>