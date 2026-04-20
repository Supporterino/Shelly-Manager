import { Accordion, Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { formatPower, formatEnergy, formatVoltage, formatCurrent } from '../../../utils/formatters'
import type { LightStatus, RGBStatus, RGBWStatus } from '../../../types/shelly'

type LightLike = LightStatus | RGBStatus | RGBWStatus

interface Props {
  status: LightLike | undefined
  showTemp?: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </Group>
  )
}

export function LightEnergyPanel({ status, showTemp = false }: Props) {
  const { t, i18n } = useTranslation('devices')
  const locale = i18n.language

  const hasStats =
    status?.apower != null ||
    status?.voltage != null ||
    status?.current != null ||
    status?.aenergy != null ||
    (showTemp && (status as LightStatus | undefined)?.temperature != null)

  if (!hasStats) return null

  const temp = showTemp ? (status as LightStatus | undefined)?.temperature : undefined

  return (
    <Accordion variant="contained" chevronPosition="right">
      <Accordion.Item value="energy">
        <Accordion.Control>
          <Text size="xs">{t('power.energyStats')}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap={4}>
            {status?.apower != null && (
              <Row label={t('power.activePower')} value={formatPower(status.apower, locale)} />
            )}
            {status?.voltage != null && (
              <Row label={t('power.voltage')} value={formatVoltage(status.voltage, locale)} />
            )}
            {status?.current != null && (
              <Row label={t('power.current')} value={formatCurrent(status.current, locale)} />
            )}
            {status?.aenergy != null && (
              <Row
                label={t('power.totalEnergy')}
                value={formatEnergy(status.aenergy.total / 1000, locale)}
              />
            )}
            {temp != null && (
              <Row
                label={t('power.deviceTemp')}
                value={`${temp.tC.toFixed(1)} °C`}
              />
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
