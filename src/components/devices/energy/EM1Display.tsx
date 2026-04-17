import { Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { formatPower, formatVoltage, formatCurrent } from '../../../utils/formatters'
import type { EM1Status } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </Group>
  )
}

export function EM1Display({ componentId: _c, status, device: _d }: Props) {
  const { t, i18n } = useTranslation('devices')
  const em1 = status as EM1Status | undefined
  const locale = i18n.language

  return (
    <Stack gap={4}>
      <Row label={t('power.activePower')} value={em1 != null ? formatPower(em1.act_power, locale) : '—'} />
      <Row label={t('power.apparentPower')} value={em1 != null ? `${em1.aprt_power.toFixed(1)} VA` : '—'} />
      <Row label={t('power.voltage')} value={em1 != null ? formatVoltage(em1.voltage, locale) : '—'} />
      <Row label={t('power.current')} value={em1 != null ? formatCurrent(em1.current, locale) : '—'} />
      <Row label={t('power.powerFactor')} value={em1 != null ? em1.pf.toFixed(2) : '—'} />
      <Row label={t('power.frequency')} value={em1 != null ? `${em1.freq.toFixed(1)} Hz` : '—'} />
    </Stack>
  )
}
