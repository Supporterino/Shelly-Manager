import { ColorPicker, Group, Slider, Stack, Switch, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useCallback, useRef } from 'react'
import { useRGBWControl } from '../../../hooks/useDeviceControl'
import { formatPower } from '../../../utils/formatters'
import type { RGBWStatus } from '../../../types/shelly'
import type { StoredDevice, ShellyComponentSummary } from '../../../types/device'

function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function RGBWControl({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices')
  const rgbw = status as RGBWStatus | undefined
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'rgbw' && c.id === componentId
  )
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 })
  const mutation = useRGBWControl(deviceId, componentId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleColorChange = useCallback(
    (hex: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        mutation.mutate({ rgb: hexToRgb(hex) })
      }, 150)
    },
    [mutation]
  )

  const currentHex = rgbw?.rgb ? rgbToHex(rgbw.rgb) : '#ffffff'

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">{channelLabel}</Text>
        <Group gap="xs">
          {rgbw?.apower != null && (
            <Text size="xs" c="dimmed">{formatPower(rgbw.apower, i18n.language)}</Text>
          )}
          <Switch
            checked={rgbw?.output ?? false}
            onChange={(e) => mutation.mutate({ on: e.currentTarget.checked })}
            disabled={mutation.isPending}
            size="md"
            label={rgbw?.output ? t('controls.on') : t('controls.off')}
          />
        </Group>
      </Group>

      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" style={{ minWidth: 64 }}>{t('controls.colorBrightness')}</Text>
        <Slider
          value={rgbw?.brightness ?? 0}
          style={{ flex: 1 }}
          label={(v) => `${v}%`}
          onChangeEnd={(v) => mutation.mutate({ brightness: v })}
          aria-label={t('controls.colorBrightness')}
        />
      </Group>

      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" style={{ minWidth: 64 }}>{t('controls.white')}</Text>
        <Slider
          value={rgbw?.white ?? 0}
          style={{ flex: 1 }}
          label={(v) => `${v}%`}
          onChangeEnd={(v) => mutation.mutate({ white: v })}
          aria-label={t('controls.white')}
        />
      </Group>

      <ColorPicker
        format="hex"
        value={currentHex}
        onChange={handleColorChange}
        size="sm"
        fullWidth
        swatches={[
          '#ff0000', '#ff8000', '#ffff00', '#00ff00',
          '#00ffff', '#0000ff', '#8000ff', '#ff00ff', '#ffffff',
        ]}
      />
    </Stack>
  )
}
