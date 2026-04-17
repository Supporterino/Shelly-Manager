import { Box, Card, Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { DeviceStatusBadge } from './DeviceStatusBadge'
import { DeviceTypeIcon } from './DeviceTypeIcon'
import { DeviceCardInlineControl } from './DeviceCardInlineControl'
import { useDeviceStatus } from '../../hooks/useDeviceStatus'
import { useWsStatus } from '../../hooks/useWsStatus'
import type { StoredDevice, ConnectionStatus } from '../../types/device'

interface Props {
  device: StoredDevice
  locale: string
}

export function DeviceCard({ device, locale }: Props) {
  const { t } = useTranslation('devices')
  const navigate = useNavigate()
  const { data: polledStatus } = useDeviceStatus(device)
  const { wsStatus, isConnected } = useWsStatus(device.id)

  const status = isConnected
    ? (wsStatus as typeof polledStatus)
    : polledStatus

  const connectionStatus: ConnectionStatus = isConnected
    ? 'online'
    : polledStatus !== undefined
    ? 'online'
    : 'offline'

  return (
    <Box
      component="div"
      onClick={() => navigate({ to: '/devices/$deviceId', params: { deviceId: device.id } })}
      style={{ width: '100%', cursor: 'pointer' }}
    >
      <Card withBorder radius="md" p="md" h="100%">
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Group gap="xs" align="center">
              <DeviceTypeIcon type={device.type} size={22} />
              <Stack gap={0}>
                <Text fw={600} size="sm" lineClamp={1}>{device.name}</Text>
                <Text size="xs" c="dimmed">{device.model}</Text>
              </Stack>
            </Group>
            <DeviceStatusBadge status={connectionStatus} />
          </Group>

          <Text size="xs" c="dimmed">{t('info.ipAddress')}: {device.ip}</Text>

          {/* Intercept clicks on controls so they don't trigger card navigation */}
          <div onClick={(e) => e.stopPropagation()}>
            <DeviceCardInlineControl
              device={device}
              status={status}
              locale={locale}
            />
          </div>
        </Stack>
      </Card>
    </Box>
  )
}
