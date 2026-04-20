import { Accordion, Badge, Button, Group, Slider, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCoverControl } from '../../../hooks/useDeviceControl'
import { formatPower, formatEnergy, formatVoltage, formatCurrent } from '../../../utils/formatters'
import type { CoverStatus } from '../../../types/shelly'
import type { StoredDevice, ShellyComponentSummary } from '../../../types/device'
import { ErrorBadges } from './ErrorBadges'

const stateColor: Record<string, string> = {
  open: 'green',
  closed: 'gray',
  opening: 'blue',
  closing: 'yellow',
  stopped: 'yellow',
  calibrating: 'violet',
}

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

export function CoverControl({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices')
  const locale = i18n.language
  const cover = status as CoverStatus | undefined
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'cover' && c.id === componentId
  )
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 })
  const { open, close, stop, goTo } = useCoverControl(deviceId, componentId)
  const [targetPos, setTargetPos] = useState(cover?.current_pos ?? 0)

  const isMoving =
    cover?.state === 'opening' || cover?.state === 'closing'

  const hasEnergyStats =
    cover?.apower != null ||
    cover?.voltage != null ||
    cover?.current != null ||
    cover?.aenergy != null ||
    cover?.temperature != null

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">{channelLabel}</Text>
        <Group gap="xs" align="center">
          {cover?.last_direction != null && (
            <Text size="xs" c="dimmed">
              {t(`controls.direction.${cover.last_direction}`)}
            </Text>
          )}
          {cover?.state && (
            <Badge color={stateColor[cover.state] ?? 'gray'} variant="light">
              {t(`controls.state.${cover.state}`)}
            </Badge>
          )}
        </Group>
      </Group>

      <ErrorBadges errors={cover?.errors} />

      <Group gap="xs" grow>
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

      {hasEnergyStats && (
        <Accordion variant="contained" chevronPosition="right">
          <Accordion.Item value="energy">
            <Accordion.Control>
              <Text size="xs">{t('power.energyStats')}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={4}>
                {cover?.apower != null && (
                  <Row label={t('power.activePower')} value={formatPower(cover.apower, locale)} />
                )}
                {cover?.voltage != null && (
                  <Row label={t('power.voltage')} value={formatVoltage(cover.voltage, locale)} />
                )}
                {cover?.current != null && (
                  <Row label={t('power.current')} value={formatCurrent(cover.current, locale)} />
                )}
                {cover?.pf != null && (
                  <Row label={t('power.powerFactor')} value={cover.pf.toFixed(2)} />
                )}
                {cover?.freq != null && (
                  <Row label={t('power.frequency')} value={`${cover.freq.toFixed(1)} Hz`} />
                )}
                {cover?.aenergy != null && (
                  <Row
                    label={t('power.totalEnergy')}
                    value={formatEnergy(cover.aenergy.total / 1000, locale)}
                  />
                )}
                {cover?.temperature != null && (
                  <Row
                    label={t('power.deviceTemp')}
                    value={`${cover.temperature.tC.toFixed(1)} °C`}
                  />
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
    </Stack>
  )
}
