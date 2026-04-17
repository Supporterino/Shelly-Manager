import { Stack, Text, Loader, Badge, Group, ThemeIcon } from '@mantine/core'
import { IconDevices, IconSearch, IconPencil } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { DiscoveredHost } from '../../types/discovery'
import type { DiscoveryStatus } from '../../hooks/useDiscovery'

interface DiscoveryProgressProps {
  status: DiscoveryStatus
  progress: DiscoveredHost[]
  found: number
}

const SOURCE_ICON = {
  mdns: IconSearch,
  scan: IconDevices,
  manual: IconPencil,
}

export function DiscoveryProgress({ status, progress, found }: DiscoveryProgressProps) {
  const { t } = useTranslation('discovery')

  return (
    <Stack gap="md">
      <Group gap="sm">
        {status === 'running' && <Loader size="sm" />}
        <Text fw={500}>
          {status === 'running'
            ? t('steps.searching')
            : t('found', { count: found })}
        </Text>
      </Group>

      {progress.length === 0 && status === 'running' && (
        <Text size="sm" c="dimmed">
          {t('steps.searching')}
        </Text>
      )}

      <Stack gap="xs">
        {progress.map((host, i) => {
          const Icon = SOURCE_ICON[host.source]
          return (
            <Group key={`${host.ip}-${i}`} gap="sm">
              <ThemeIcon size="sm" variant="light" color="orange">
                <Icon size={12} />
              </ThemeIcon>
              <Text size="sm" ff="monospace">
                {host.ip}:{host.port}
              </Text>
              {host.hostname && (
                <Text size="sm" c="dimmed">
                  {host.hostname}
                </Text>
              )}
              <Badge size="xs" variant="outline" color="orange">
                {host.source}
              </Badge>
            </Group>
          )
        })}
      </Stack>

      {progress.length === 0 && status === 'done' && (
        <Text size="sm" c="dimmed">
          {t('noDevicesFound')}
        </Text>
      )}
    </Stack>
  )
}
