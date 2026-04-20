import { Badge, Group, Skeleton, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../../utils/formatters'
import type { StoredDevice } from '../../../types/device'
import type { ShellyGetDeviceInfoResult } from '../../../types/shelly'

interface Props {
  device: StoredDevice
  uptime?: number                           // seconds, from sys.uptime
  deviceInfo?: ShellyGetDeviceInfoResult    // from useDeviceInfo query
  deviceInfoLoading?: boolean
  sysStatus?: Record<string, unknown>       // sys object from GetStatus
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>{label}</Text>
      <Text size="sm" fw={500} ta="right">{value}</Text>
    </Group>
  )
}

/** Format a MAC stored as "AABBCCDDEEFF" → "AA:BB:CC:DD:EE:FF" */
function formatMac(raw: string): string {
  return raw.match(/.{2}/g)?.join(':') ?? raw
}

/** Format bytes as a human-readable KB string */
function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

export function DeviceInfoPanel({
  device,
  uptime,
  deviceInfo,
  deviceInfoLoading,
  sysStatus,
}: Props) {
  const { t, i18n } = useTranslation('devices')

  const genLabel =
    device.generation === 'gen2' ? 'Gen 2' :
    device.generation === 'gen3' ? 'Gen 3' : 'Gen 4'

  const lastSeenLabel = formatRelativeTime(
    Date.now() - device.lastSeenAt,
    i18n.language
  )

  const ramFree  = sysStatus?.ram_free  as number | undefined
  const ramSize  = sysStatus?.ram_size  as number | undefined
  const restartRequired = sysStatus?.restart_required as boolean | undefined

  return (
    <Stack gap={6}>
      {/* ── Identity (no network call) ───────────────────────────────── */}
      <InfoRow label={t('info.model')}      value={device.model} />
      <InfoRow label={t('info.appName')}    value={device.app} />
      <InfoRow label={t('info.generation')} value={genLabel} />
      <InfoRow label={t('info.macAddress')} value={formatMac(device.id)} />
      <InfoRow label={t('info.ipAddress')}  value={`${device.ip}:${device.port}`} />

      {/* ── From GetDeviceInfo (may still be loading) ────────────────── */}
      <InfoRow
        label={t('info.firmwareVersion')}
        value={
          deviceInfoLoading
            ? <Skeleton height={14} width={80} />
            : (deviceInfo?.ver ?? '—')
        }
      />
      <InfoRow
        label={t('info.authEnabled')}
        value={
          deviceInfoLoading
            ? <Skeleton height={18} width={100} />
            : deviceInfo == null
            ? '—'
            : (
              <Badge
                size="sm"
                color={deviceInfo.auth_en ? 'orange' : 'gray'}
                variant="light"
              >
                {deviceInfo.auth_en ? t('info.authOn') : t('info.authOff')}
              </Badge>
            )
        }
      />

      {/* ── Runtime stats (from status.sys) ──────────────────────────── */}
      {restartRequired && (
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
            {t('info.restartRequired')}
          </Text>
          <Badge size="sm" color="yellow" variant="light">!</Badge>
        </Group>
      )}
      {ramFree != null && ramSize != null && (
        <InfoRow
          label={t('info.ramFree')}
          value={`${formatKb(ramFree)} / ${formatKb(ramSize)}`}
        />
      )}
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
