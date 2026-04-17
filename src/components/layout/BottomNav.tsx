import { Group, UnstyledButton, Stack, Text } from '@mantine/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { IconDevices, IconSearch, IconSettings } from '@tabler/icons-react'

export function BottomNav() {
  const { t } = useTranslation('common')
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const links = [
    { to: '/', label: t('nav.dashboard'), icon: IconDevices },
    { to: '/discover', label: t('nav.discover'), icon: IconSearch },
    { to: '/settings', label: t('nav.settings'), icon: IconSettings },
  ]

  return (
    <Group
      px="xs"
      justify="space-around"
      hiddenFrom="sm"
      className="bottom-nav"
      style={{ alignItems: 'flex-start', paddingTop: 8 }}
    >
      {links.map(({ to, label, icon: Icon }) => (
        <UnstyledButton
          key={to}
          component={Link}
          to={to}
          style={{ flex: 1 }}
        >
          <Stack align="center" gap={2}>
            <Icon
              size={22}
              stroke={1.5}
              color={pathname === to ? 'var(--mantine-color-blue-6)' : undefined}
            />
            <Text size="xs" c={pathname === to ? 'blue' : 'dimmed'}>
              {label}
            </Text>
          </Stack>
        </UnstyledButton>
      ))}
    </Group>
  )
}
