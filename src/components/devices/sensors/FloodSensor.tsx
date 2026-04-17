import { Alert, Card, Stack, Text } from '@mantine/core'
import { IconDroplets } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { FloodStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function FloodSensor({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices')
  const fs = status as FloodStatus | undefined

  if (fs?.flood) {
    return (
      <Alert
        icon={<IconDroplets size={18} />}
        color="blue"
        title={t('sensors.flood')}
      >
        {t('sensors.floodDetected')}
      </Alert>
    )
  }

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">{t('sensors.flood')}</Text>
        <Text fw={600} c="green">{t('sensors.floodClear')}</Text>
      </Stack>
    </Card>
  )
}
