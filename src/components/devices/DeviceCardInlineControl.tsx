import { ActionIcon, Badge, Group, Slider, Text } from '@mantine/core'
import { IconToggleLeft, IconToggleRight } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useSwitchControl, useDimmerControl } from '../../hooks/useDeviceControl'
import { formatPower } from '../../utils/formatters'
import type { StoredDevice } from '../../types/device'
import type {
  ShellyGetStatusResult,
  SwitchStatus,
  LightStatus,
  EMStatus,
  EM1Status,
  PM1Status,
  TemperatureStatus,
  HumidityStatus,
  CoverStatus,
} from '../../types/shelly'

interface Props {
  device: StoredDevice
  status: ShellyGetStatusResult | undefined
  locale: string
}

function SingleSwitchInline({ deviceId, switchId, status }: {
  deviceId: string
  switchId: number
  status: SwitchStatus | undefined
}) {
  const mutation = useSwitchControl(deviceId, switchId)
  const on = status?.output ?? false
  return (
    <ActionIcon
      variant={on ? 'filled' : 'light'}
      color={on ? 'orange' : 'gray'}
      size="lg"
      onClick={() => mutation.mutate({ on: !on })}
      loading={mutation.isPending}
    >
      {on ? <IconToggleRight size={18} /> : <IconToggleLeft size={18} />}
    </ActionIcon>
  )
}

function MultiSwitchInline({ deviceId, switches }: {
  deviceId: string
  switches: Array<{ id: number; status: SwitchStatus | undefined }>
}) {
  return (
    <Group gap="xs">
      {switches.map((sw) => (
        <SingleSwitchInline
          key={sw.id}
          deviceId={deviceId}
          switchId={sw.id}
          status={sw.status}
        />
      ))}
    </Group>
  )
}

function DimmerInline({ deviceId, lightId, status, locale }: {
  deviceId: string
  lightId: number
  status: LightStatus | undefined
  locale: string
}) {
  const mutation = useDimmerControl(deviceId, lightId)
  const brightness = status?.brightness ?? 0
  const { t } = useTranslation('devices')
  return (
    <Group gap="xs" align="center" style={{ flex: 1 }}>
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {formatPower(brightness, locale)}%
      </Text>
      <Slider
        value={brightness}
        style={{ flex: 1, minWidth: 60 }}
        size="xs"
        label={null}
        onChangeEnd={(v) =>
          mutation.mutate({ on: v > 0, brightness: v })
        }
        aria-label={t('controls.brightness')}
      />
    </Group>
  )
}

export function DeviceCardInlineControl({ device, status, locale }: Props) {
  const { t } = useTranslation('devices')

  if (!status) return null

  const switches = device.components
    .filter((c) => c.type === 'switch')
    .map((c) => ({
      id: c.id,
      status: status[`switch:${c.id}`] as SwitchStatus | undefined,
    }))

  const lights = device.components.filter(
    (c) => c.type === 'light' || c.type === 'light_cct'
  )

  const covers = device.components.filter((c) => c.type === 'cover')

  // Switch(es)
  if (switches.length === 1) {
    return <SingleSwitchInline deviceId={device.id} switchId={0} status={switches[0].status} />
  }
  if (switches.length > 1) {
    return <MultiSwitchInline deviceId={device.id} switches={switches} />
  }

  // Single dimmer
  if (lights.length === 1) {
    const lightStatus = status[`light:${lights[0].id}`] as LightStatus | undefined
    return (
      <DimmerInline
        deviceId={device.id}
        lightId={lights[0].id}
        status={lightStatus}
        locale={locale}
      />
    )
  }

  // Multiple dimmers — badges only
  if (lights.length > 1) {
    return (
      <Group gap="xs">
        {lights.map((l) => {
          const ls = status[`light:${l.id}`] as LightStatus | undefined
          return (
            <Badge key={l.id} variant="light" color="yellow">
              {ls?.brightness ?? 0}%
            </Badge>
          )
        })}
      </Group>
    )
  }

  // Single cover
  if (covers.length === 1) {
    const cs = status[`cover:${covers[0].id}`] as CoverStatus | undefined
    return (
      <Badge variant="light" color="blue">
        {cs?.state ? t(`controls.state.${cs.state}`) : '—'}
      </Badge>
    )
  }

  // Multiple covers — state badges
  if (covers.length > 1) {
    return (
      <Group gap="xs">
        {covers.map((c) => {
          const cs = status[`cover:${c.id}`] as CoverStatus | undefined
          return (
            <Badge key={c.id} variant="light" color="blue">
              {cs?.state ? t(`controls.state.${cs.state}`) : '—'}
            </Badge>
          )
        })}
      </Group>
    )
  }

  // Sensor primary value
  const tempComp = device.components.find((c) => c.type === 'temperature')
  if (tempComp) {
    const ts = status[`temperature:${tempComp.id}`] as TemperatureStatus | undefined
    const humComp = device.components.find((c) => c.type === 'humidity')
    const hs = humComp
      ? (status[`humidity:${humComp.id}`] as HumidityStatus | undefined)
      : undefined
    return (
      <Text size="sm">
        {ts?.tC != null ? `${ts.tC.toFixed(1)} °C` : '—'}
        {hs?.rh != null ? ` / ${hs.rh.toFixed(0)} %` : ''}
      </Text>
    )
  }

  // Energy total power
  const em = device.components.find((c) => c.type === 'em')
  if (em) {
    const es = status[`em:${em.id}`] as EMStatus | undefined
    return (
      <Text size="sm">{es != null ? formatPower(es.total_act_power, locale) : '—'}</Text>
    )
  }
  const em1 = device.components.find((c) => c.type === 'em1')
  if (em1) {
    const es = status[`em1:${em1.id}`] as EM1Status | undefined
    return (
      <Text size="sm">{es != null ? formatPower(es.act_power, locale) : '—'}</Text>
    )
  }
  const pm1 = device.components.find((c) => c.type === 'pm1')
  if (pm1) {
    const ps = status[`pm1:${pm1.id}`] as PM1Status | undefined
    return (
      <Text size="sm">{ps != null ? formatPower(ps.apower, locale) : '—'}</Text>
    )
  }

  return null
}
