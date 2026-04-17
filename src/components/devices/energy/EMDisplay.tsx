import { Accordion, Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { formatPower, formatVoltage, formatCurrent } from '../../../utils/formatters'
import type { EMStatus } from '../../../types/shelly'
import type { StoredDevice } from '../../../types/device'

interface Props {
  deviceId: string
  componentId: number
  status: unknown
  device: StoredDevice
}

function PhaseRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </Group>
  )
}

export function EMDisplay({ componentId: _c, status, device: _d }: Props) {
  const { t, i18n } = useTranslation('devices')
  const em = status as EMStatus | undefined
  const locale = i18n.language

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>{t('power.total')}</Text>
        <Text size="sm">{em != null ? formatPower(em.total_act_power, locale) : '—'}</Text>
      </Group>

      <Accordion variant="contained">
        <Accordion.Item value="phaseA">
          <Accordion.Control>
            <Text size="sm">{t('power.phaseA')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap={4}>
              <PhaseRow label={t('power.activePower')} value={em != null ? formatPower(em.a_act_power, locale) : '—'} />
              <PhaseRow label={t('power.apparentPower')} value={em != null ? `${em.a_aprt_power.toFixed(1)} VA` : '—'} />
              <PhaseRow label={t('power.voltage')} value={em != null ? formatVoltage(em.a_voltage, locale) : '—'} />
              <PhaseRow label={t('power.current')} value={em != null ? formatCurrent(em.a_current, locale) : '—'} />
              <PhaseRow label={t('power.powerFactor')} value={em != null ? em.a_pf.toFixed(2) : '—'} />
              <PhaseRow label={t('power.frequency')} value={em != null ? `${em.a_freq.toFixed(1)} Hz` : '—'} />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="phaseB">
          <Accordion.Control>
            <Text size="sm">{t('power.phaseB')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap={4}>
              <PhaseRow label={t('power.activePower')} value={em != null ? formatPower(em.b_act_power, locale) : '—'} />
              <PhaseRow label={t('power.apparentPower')} value={em != null ? `${em.b_aprt_power.toFixed(1)} VA` : '—'} />
              <PhaseRow label={t('power.voltage')} value={em != null ? formatVoltage(em.b_voltage, locale) : '—'} />
              <PhaseRow label={t('power.current')} value={em != null ? formatCurrent(em.b_current, locale) : '—'} />
              <PhaseRow label={t('power.powerFactor')} value={em != null ? em.b_pf.toFixed(2) : '—'} />
              <PhaseRow label={t('power.frequency')} value={em != null ? `${em.b_freq.toFixed(1)} Hz` : '—'} />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  )
}
