import { Badge, Group, Progress, Text } from '@mantine/core'
import { IconBattery } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { SensorCard } from './SensorCard'
import type { DevicePowerStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

function batteryColor(percent: number): string {
  if (percent > 50) return 'green'
  if (percent > 20) return 'yellow'
  return 'red'
}

export function BatteryIndicator({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices')
  const dp = status as DevicePowerStatus | undefined
  const percent = dp?.battery?.percent ?? null

  return (
    <SensorCard
      icon={<IconBattery size={18} />}
      label={t('sensors.battery')}
      value={percent != null ? `${percent}%` : '—'}
      alert={percent != null && percent < 20}
      extra={
        <>
          {percent != null && (
            <Progress
              value={percent}
              size="sm"
              color={batteryColor(percent)}
            />
          )}
          <Group justify="space-between">
            {dp?.battery?.V != null && (
              <Text size="xs" c="dimmed">{dp.battery.V.toFixed(2)} V</Text>
            )}
            {dp?.external?.present && (
              <Badge size="xs" color="blue" variant="light">
                {t('sensors.externalPower')}
              </Badge>
            )}
          </Group>
        </>
      }
    />
  )
}
