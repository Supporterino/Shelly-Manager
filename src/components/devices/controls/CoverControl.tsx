import { Badge, Button, Group, Slider, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCoverControl } from '../../../hooks/useDeviceControl'
import type { CoverStatus } from '../../../types/shelly'
import type { StoredDevice, ShellyComponentSummary } from '../../../types/device'

const stateColor: Record<string, string> = {
  open: 'green',
  closed: 'gray',
  opening: 'blue',
  closing: 'orange',
  stopped: 'yellow',
  calibrating: 'violet',
}

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function CoverControl({ deviceId, componentId, status, device }: Props) {
  const { t } = useTranslation('devices')
  const cover = status as CoverStatus | undefined
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'cover' && c.id === componentId
  )
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 })
  const { open, close, stop, goTo } = useCoverControl(deviceId, componentId)
  const [targetPos, setTargetPos] = useState(cover?.current_pos ?? 0)

  const isMoving =
    cover?.state === 'opening' || cover?.state === 'closing'

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">{channelLabel}</Text>
        {cover?.state && (
          <Badge color={stateColor[cover.state] ?? 'gray'} variant="light">
            {t(`controls.state.${cover.state}`)}
          </Badge>
        )}
      </Group>

      <Group gap="xs">
        <Button
          size="xs"
          variant="light"
          color="green"
          disabled={isMoving}
          loading={open.isPending}
          onClick={() => open.mutate()}
        >
          {t('controls.open')}
        </Button>
        <Button
          size="xs"
          variant="light"
          color="red"
          loading={stop.isPending}
          onClick={() => stop.mutate()}
        >
          {t('controls.stop')}
        </Button>
        <Button
          size="xs"
          variant="light"
          color="blue"
          disabled={isMoving}
          loading={close.isPending}
          onClick={() => close.mutate()}
        >
          {t('controls.close')}
        </Button>
      </Group>

      {cover?.pos_control && (
        <Stack gap="xs">
          <Group gap="sm" align="center">
            <Text size="xs" c="dimmed" style={{ minWidth: 28 }}>
              {cover.current_pos ?? 0}%
            </Text>
            <Slider
              value={targetPos}
              style={{ flex: 1 }}
              label={(v) => `${v}%`}
              onChange={setTargetPos}
              aria-label={t('controls.position')}
            />
          </Group>
          <Button
            size="xs"
            variant="outline"
            loading={goTo.isPending}
            onClick={() => goTo.mutate({ pos: targetPos })}
          >
            {t('controls.goToPosition')}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
