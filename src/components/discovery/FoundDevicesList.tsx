import { useState } from 'react'
import {
  Stack,
  Checkbox,
  Group,
  Text,
  Badge,
  Button,
  ThemeIcon,
} from '@mantine/core'
import {
  IconDevices,
  IconBolt,
  IconSun,
  IconFlame,
  IconDroplet,
  IconShield,
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
                <ThemeIcon size="sm" variant="light" color="orange">
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

      <Button
        color="orange"
        onClick={handleAdd}
        disabled={selected.size === 0}
        mt="xs"
      >
        {t('addSelected')} ({selected.size})
      </Button>
    </Stack>
  )
}
