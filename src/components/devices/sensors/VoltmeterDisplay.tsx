import { IconBolt } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { SensorCard } from './SensorCard'
import { formatVoltage } from '../../../utils/formatters'
import type { VoltmeterStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function VoltmeterDisplay({ componentId: _c, status, device: _d }: Props) {
  const { t, i18n } = useTranslation('devices')
  const vs = status as VoltmeterStatus | undefined

  return (
    <SensorCard
      icon={<IconBolt size={18} />}
      label={t('sensors.voltage')}
      value={vs?.voltage != null ? formatVoltage(vs.voltage, i18n.language) : '—'}
    />
  )
}
