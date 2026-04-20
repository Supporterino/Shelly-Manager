import { Badge, Checkbox, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FirmwareRowActions } from './FirmwareRowActions'
import type { DeviceFirmwareState } from '../../hooks/useFirmwareManager'
import type { StoredDevice } from '../../types/device'

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

export function FirmwareTable({
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

  const rows = devices.map((device) => {
    const state = firmwareStates[device.id] ?? {
      status: 'idle' as const,
      currentVersion: device.model,
      pollStep: 0,
    }

    return (
      <Table.Tr
        key={device.id}
        bg={
          selectedIds.has(device.id)
            ? 'var(--mantine-color-blue-light)'
            : undefined
        }
      >
        {/* Select checkbox */}
        <Table.Td>
          <Checkbox
            aria-label={`Select ${device.name}`}
            checked={selectedIds.has(device.id)}
            onChange={() => onToggleSelect(device.id)}
            disabled={globalBusy}
          />
        </Table.Td>

        {/* Device name — links to device detail */}
        <Table.Td>
          <Link
            to="/devices/$deviceId"
            params={{ deviceId: device.id }}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Text size="sm" fw={500}>
              {device.name}
            </Text>
          </Link>
        </Table.Td>

        {/* IP address */}
        <Table.Td>
          <Text size="sm" c="dimmed">
            {device.ip}:{device.port}
          </Text>
        </Table.Td>

        {/* Current firmware version */}
        <Table.Td>
          <Badge variant="light" color="gray" size="sm">
            {state.currentVersion}
          </Badge>
        </Table.Td>

        {/* Status + actions */}
        <Table.Td>
          <FirmwareRowActions
            state={state}
            globalBusy={globalBusy}
            onCheck={() => onCheckDevice(device)}
            onUpdate={() => onUpdateDevice(device)}
          />
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <Table.ScrollContainer minWidth={540}>
      <Table
        stickyHeader
        highlightOnHover
        striped="odd"
        withTableBorder
        withRowBorders
        verticalSpacing="sm"
        horizontalSpacing="md"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                aria-label="Select all devices"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={onToggleSelectAll}
                disabled={globalBusy}
              />
            </Table.Th>
            <Table.Th>{t('info.model')}</Table.Th>
            <Table.Th>{t('info.ipAddress')}</Table.Th>
            <Table.Th>{t('info.firmwareVersion')}</Table.Th>
            <Table.Th>{t('info.firmware')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
