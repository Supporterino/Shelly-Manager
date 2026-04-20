import { Accordion, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SwitchStatus } from '../../../types/shelly';
import { formatCurrent, formatEnergy, formatPower, formatVoltage } from '../../../utils/formatters';

interface Props {
  sw: SwitchStatus | undefined;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Group>
  );
}

export function SwitchEnergyPanel({ sw }: Props) {
  const { t, i18n } = useTranslation('devices');
  const locale = i18n.language;

  const hasStats =
    sw?.aenergy != null ||
    sw?.voltage != null ||
    sw?.current != null ||
    sw?.temperature != null ||
    sw?.timer_duration != null;

  if (!hasStats) return null;

  const elapsed =
    sw?.timer_started_at != null ? Math.floor(Date.now() / 1000) - sw.timer_started_at : 0;
  const remaining = sw?.timer_duration != null ? Math.max(0, sw.timer_duration - elapsed) : null;

  return (
    <Accordion variant="contained" chevronPosition="right">
      <Accordion.Item value="energy">
        <Accordion.Control>
          <Text size="xs">{t('power.energyStats')}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap={4}>
            {sw?.apower != null && (
              <Row label={t('power.activePower')} value={formatPower(sw.apower, locale)} />
            )}
            {sw?.voltage != null && (
              <Row label={t('power.voltage')} value={formatVoltage(sw.voltage, locale)} />
            )}
            {sw?.current != null && (
              <Row label={t('power.current')} value={formatCurrent(sw.current, locale)} />
            )}
            {sw?.pf != null && <Row label={t('power.powerFactor')} value={sw.pf.toFixed(2)} />}
            {sw?.freq != null && (
              <Row label={t('power.frequency')} value={`${sw.freq.toFixed(1)} Hz`} />
            )}
            {sw?.aenergy != null && (
              <Row
                label={t('power.totalEnergy')}
                value={formatEnergy(sw.aenergy.total / 1000, locale)}
              />
            )}
            {sw?.ret_aenergy != null && (
              <Row
                label={t('power.returnedEnergy')}
                value={formatEnergy(sw.ret_aenergy.total / 1000, locale)}
              />
            )}
            {sw?.temperature != null && (
              <Row label={t('power.deviceTemp')} value={`${sw.temperature.tC.toFixed(1)} °C`} />
            )}
            {remaining != null && remaining > 0 && (
              <Row label={t('controls.autoOffIn', { seconds: remaining })} value="" />
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
