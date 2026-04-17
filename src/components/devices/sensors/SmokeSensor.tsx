import { Alert, Button, Card, Group, Stack, Text } from '@mantine/core'
import { IconFlame } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import { ShellyClient } from '../../../services/shellyClient'
import { useDeviceStore } from '../../../store/deviceStore'
import type { SmokeStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function SmokeSensor({ deviceId, componentId, status, device: _d }: Props) {
  const { t } = useTranslation('devices')
  const queryClient = useQueryClient()
  const ss = status as SmokeStatus | undefined

  const muteMutation = useMutation({
    mutationFn: () => {
      const dev = useDeviceStore.getState().devices[deviceId]
      if (!dev) throw new Error('Device not found')
      return new ShellyClient(dev).smokeMute(componentId)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })

  if (ss?.alarm) {
    return (
      <Alert
        icon={<IconFlame size={18} />}
        color="red"
        title={t('sensors.smoke')}
      >
        <Group justify="space-between" align="center">
          <Text>{t('sensors.smokeAlarm')}</Text>
          {!ss.mute && (
            <Button
              size="xs"
              color="red"
              variant="outline"
              loading={muteMutation.isPending}
              onClick={() => muteMutation.mutate()}
            >
              {t('sensors.mute')}
            </Button>
          )}
        </Group>
      </Alert>
    )
  }

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">{t('sensors.smoke')}</Text>
        <Text fw={600} c="green">{t('sensors.smokeClear')}</Text>
      </Stack>
    </Card>
  )
}
