import { Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../../utils/formatters'
import type { StoredDevice } from '../../../types/device'

interface Props {
  device: StoredDevice
  uptime?: number   // seconds, from GetStatus sys.uptime if available
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </Group>
  )
}

export function DeviceInfoPanel({ device, uptime }: Props) {
  const { t, i18n } = useTranslation('devices')

  const genLabel = device.generation === 'gen2' ? 'Gen 2' :
                   device.generation === 'gen3' ? 'Gen 3' : 'Gen 4'

  const lastSeenLabel = formatRelativeTime(
    Date.now() - device.lastSeenAt,
    i18n.language
  )

  return (
    <Stack gap={4}>
      <InfoRow label={t('info.model')} value={device.model} />
      <InfoRow label={t('info.generation')} value={genLabel} />
      <InfoRow label={t('info.ipAddress')} value={`${device.ip}:${device.port}`} />
      <InfoRow label={t('info.lastSeen')} value={lastSeenLabel} />
      {uptime != null && (
        <InfoRow
          label={t('info.uptime')}
          value={(() => {
            const d = Math.floor(uptime / 86400)
            const h = Math.floor((uptime % 86400) / 3600)
            const m = Math.floor((uptime % 3600) / 60)
            const s = uptime % 60
            if (d > 0) return `${d}d ${h}h ${m}m`
            if (h > 0) return `${h}h ${m}m`
            if (m > 0) return `${m}m ${s}s`
            return `${s}s`
          })()}
        />
      )}
    </Stack>
  )
}
