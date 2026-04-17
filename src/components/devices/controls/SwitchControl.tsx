import { Accordion, Group, Stack, Switch, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useSwitchControl } from '../../../hooks/useDeviceControl'
import { formatPower, formatEnergy } from '../../../utils/formatters'
import type { SwitchStatus } from '../../../types/shelly'
import type { StoredDevice, ShellyComponentSummary } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

export function SwitchControl({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices')
  const sw = status as SwitchStatus | undefined
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'switch' && c.id === componentId
  )
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 })
  const mutation = useSwitchControl(deviceId, componentId)

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">{channelLabel}</Text>
        <Group gap="xs" align="center">
          {sw?.apower != null && (
            <Text size="xs" c="dimmed">{formatPower(sw.apower, i18n.language)}</Text>
          )}
          <Switch
            checked={sw?.output ?? false}
            onChange={(e) => mutation.mutate({ on: e.currentTarget.checked })}
            disabled={mutation.isPending}
            size="md"
            label={sw?.output ? t('controls.on') : t('controls.off')}
          />
        </Group>
      </Group>

      {sw?.aenergy != null && (
        <Accordion variant="contained" chevronPosition="right">
          <Accordion.Item value="energy">
            <Accordion.Control>
              <Text size="xs">{t('power.totalEnergy')}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm">
                {formatEnergy(sw.aenergy.total / 1000, i18n.language)}
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
    </Stack>
  )
}
