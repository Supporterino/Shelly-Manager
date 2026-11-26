import { Accordion, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { StoredDevice } from '../../../types/device';
import type { PM1Status } from '../../../types/shelly';
import {
  formatCurrent,
  formatEnergy,
  formatPower,
  formatTemperature,
  formatVoltage,
} from '../../../utils/formatters';
import { EnergyHistoryChart } from './EnergyHistoryChart';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
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

export function PM1Display({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices');
  const pm1 = status as PM1Status | undefined;
  const locale = i18n.language;
  const isEz1 = device.provider === 'apsystems-ez1';
  const multiPm1 = device.components.filter((c) => c.type === 'pm1').length > 1;
  const channelTitle = isEz1
    ? componentId === 0
      ? t('power.total')
      : t('controls.channel', { n: componentId })
    : multiPm1
      ? t('controls.channel', { n: componentId + 1 })
      : null;

  return (
    <Stack gap="xs">
      {channelTitle && (
        <Text size="sm" fw={600}>
          {channelTitle}
        </Text>
      )}
      <Accordion
        variant="contained"
        multiple
        defaultValue={isEz1 ? (componentId === 0 ? ['stats', 'history'] : ['stats']) : undefined}
      >
        <Accordion.Item value="stats">
          <Accordion.Control>
            <Text size="sm">{t('power.energyStats')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap={4}>
              <Row
                label={t('power.activePower')}
                value={pm1 != null ? formatPower(pm1.apower, locale) : '—'}
              />
              {(!isEz1 || pm1?.voltage != null) && (
                <Row
                  label={t('power.voltage')}
                  value={pm1?.voltage != null ? formatVoltage(pm1.voltage, locale) : '—'}
                />
              )}
              {(!isEz1 || pm1?.current != null) && (
                <Row
                  label={t('power.current')}
                  value={pm1?.current != null ? formatCurrent(pm1.current, locale) : '—'}
                />
              )}
              {!isEz1 && (
                <Row
                  label={t('power.powerFactor')}
                  value={pm1?.pf != null ? pm1.pf.toFixed(2) : '—'}
                />
              )}
              {(!isEz1 || pm1?.freq != null) && (
                <Row
                  label={t('power.frequency')}
                  value={pm1?.freq != null ? `${pm1.freq.toFixed(1)} Hz` : '—'}
                />
              )}
              {(isEz1 || pm1?.daily_aenergy != null) && (
                <Row
                  label={t('power.dailyEnergy')}
                  value={
                    pm1?.daily_aenergy != null
                      ? formatEnergy(pm1.daily_aenergy / 1000, locale)
                      : '—'
                  }
                />
              )}
              <Row
                label={t('power.totalEnergy')}
                value={pm1 != null ? formatEnergy(pm1.aenergy.total / 1000, locale) : '—'}
              />
              {pm1?.ret_aenergy != null && (
                <Row
                  label={t('power.returnedEnergy')}
                  value={formatEnergy(pm1.ret_aenergy.total / 1000, locale)}
                />
              )}
              {pm1?.temperature?.tC != null && (
                <Row
                  label={t('power.deviceTemp')}
                  value={formatTemperature(pm1.temperature.tC, locale)}
                />
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="history">
          <Accordion.Control>
            <Text size="sm">{t('power.history24h')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <EnergyHistoryChart deviceId={deviceId} componentType="pm1" componentId={componentId} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
