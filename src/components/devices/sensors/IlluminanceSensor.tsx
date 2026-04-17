import { Badge, Group } from '@mantine/core'
import { IconSun } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { SensorCard } from './SensorCard'
import type { IlluminanceStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

const levelColor: Record<string, string> = {
  dark: 'gray',
  twilight: 'yellow',
  bright: 'orange',
}

export function IlluminanceSensor({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices')
  const is = status as IlluminanceStatus | undefined

  return (
    <SensorCard
      icon={<IconSun size={18} />}
      label={t('sensors.illuminance')}
      value={is?.lux != null ? `${is.lux.toFixed(0)} lx` : '—'}
      extra={
        is?.illuminance ? (
          <Group>
            <Badge color={levelColor[is.illuminance] ?? 'gray'} variant="light">
              {t(`sensors.illuminanceLevel.${is.illuminance}`)}
            </Badge>
          </Group>
        ) : undefined
      }
    />
  )
}
