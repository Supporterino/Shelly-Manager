import { useState } from 'react'
import {
  Stack,
  Checkbox,
  Group,
  Text,
  Badge,
  ActionIcon,
  Indicator,
  Tooltip,
  ThemeIcon,
} from '@mantine/core'
import {
  IconDevices,
  IconBolt,
  IconSun,
  IconFlame,
  IconDroplet,
  IconShield,
  IconCheck,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { StoredDevice, DeviceType } from '../../types/device'

interface FoundDevicesListProps {
  devices: StoredDevice[]
  onAdd: (selected: StoredDevice[]) => void
}

const TYPE_ICON: Record<DeviceType, React.ComponentType<{ size?: number }>> = {
  switch: IconBolt,
  dimmer: IconSun,
  cct: IconSun,
  rgb: IconFlame,
  rgbw: IconFlame,
  cover: IconShield,
  sensor: IconDroplet,
  energy: IconBolt,
  input: IconDevices,
  unknown: IconDevices,
}

export function FoundDevicesList({ devices, onAdd }: FoundDevicesListProps) {
  const { t } = useTranslation('discovery')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(devices.map((d) => d.id))
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleAdd() {
    onAdd(devices.filter((d) => selected.has(d.id)))
  }

  if (devices.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('noDevicesFound')}
      </Text>
    )
  }

  return (
    <Stack gap="sm">
      {devices.map((device) => {
        const Icon = TYPE_ICON[device.type]
        return (
          <Checkbox
            key={device.id}
            checked={selected.has(device.id)}
            onChange={() => toggle(device.id)}
            label={
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <Icon size={12} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    {device.name}
                  </Text>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed" ff="monospace">
                      {device.ip}
                    </Text>
                    <Badge size="xs" variant="outline">
                      {device.model || device.app}
                    </Badge>
                  </Group>
                </Stack>
              </Group>
            }
          />
        )
      })}

      <Group justify="flex-end" mt="xs">
        <Tooltip label={`${t('addSelected')} (${selected.size})`}>
          <Indicator label={String(selected.size)} size={16} disabled={selected.size === 0} color="blue">
            <ActionIcon
              variant="filled"
              size="lg"
              color="blue"
              disabled={selected.size === 0}
              onClick={handleAdd}
              aria-label={t('addSelected')}
            >
              <IconCheck size={18} />
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Group>
    </Stack>
  )
}
