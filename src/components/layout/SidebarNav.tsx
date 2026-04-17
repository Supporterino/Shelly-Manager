import { NavLink, Stack, Text } from '@mantine/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { IconDevices, IconSearch, IconSettings } from '@tabler/icons-react'

export function SidebarNav() {
  const { t } = useTranslation('common')
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const links = [
    { to: '/', label: t('nav.dashboard'), icon: IconDevices },
    { to: '/discover', label: t('nav.discover'), icon: IconSearch },
    { to: '/settings', label: t('nav.settings'), icon: IconSettings },
  ]

  return (
    <Stack gap={4} p="xs" visibleFrom="sm">
      <Text fw={700} size="sm" px="sm" py="xs" c="dimmed">
        {t('appName')}
      </Text>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          component={Link}
          to={to}
          label={label}
          leftSection={<Icon size={18} stroke={1.5} />}
          active={pathname === to}
        />
      ))}
    </Stack>
  )
}
