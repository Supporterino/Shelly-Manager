import { IconDroplet } from '@tabler/icons-react'
import { Progress } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { SensorCard } from './SensorCard'
import type { HumidityStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function HumiditySensor({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices')
  const hs = status as HumidityStatus | undefined
  const rh = hs?.rh ?? null
  const isHigh = rh != null && rh > 80

  return (
    <SensorCard
      icon={<IconDroplet size={18} />}
      label={t('sensors.humidity')}
      value={rh != null ? `${rh.toFixed(0)} %` : '—'}
      alert={isHigh}
      extra={
        rh != null ? (
          <Progress value={rh} size="sm" color={isHigh ? 'red' : 'blue'} />
        ) : undefined
      }
    />
  )
}
