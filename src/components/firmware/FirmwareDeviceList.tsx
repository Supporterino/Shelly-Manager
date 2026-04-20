import { Checkbox, Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { DeviceFirmwareState } from '../../hooks/useFirmwareManager'
import type { StoredDevice } from '../../types/device'
import { FirmwareDeviceCard } from './FirmwareDeviceCard'

interface Props {
  devices: StoredDevice[]
  firmwareStates: Record<string, DeviceFirmwareState>
  selectedIds: Set<string>
  globalBusy: boolean
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onCheckDevice: (device: StoredDevice) => void
  onUpdateDevice: (device: StoredDevice) => void
}

export function FirmwareDeviceList({
  devices,
  firmwareStates,
  selectedIds,
  globalBusy,
  onToggleSelect,
  onToggleSelectAll,
  onCheckDevice,
  onUpdateDevice,
}: Props) {
  const { t } = useTranslation('devices')

  const allSelected = devices.length > 0 && devices.every((d) => selectedIds.has(d.id))
  const someSelected = devices.some((d) => selectedIds.has(d.id))

  return (
    <Stack gap="sm">
      {/* Select-all row — mirrors the table header checkbox */}
      <Group gap="xs" align="center" px={4}>
        <Checkbox
          aria-label={t('firmware.selectAll')}
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={onToggleSelectAll}
          disabled={globalBusy}
        />
        <Text size="sm" c="dimmed">
          {t('firmware.selectAll')}
        </Text>
      </Group>

      {/* One card per device */}
      {devices.map((device) => {
        const state = firmwareStates[device.id] ?? {
          status: 'idle' as const,
          currentVersion: device.model,
          pollStep: 0,
        }
        return (
          <FirmwareDeviceCard
            key={device.id}
            device={device}
            state={state}
            globalBusy={globalBusy}
            selected={selectedIds.has(device.id)}
            onToggleSelect={() => onToggleSelect(device.id)}
            onCheckDevice={() => onCheckDevice(device)}
            onUpdateDevice={() => onUpdateDevice(device)}
          />
        )
      })}
    </Stack>
  )
}
