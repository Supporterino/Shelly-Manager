import { Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { StoredDevice } from '../../../types/device';
import type { PM1Status } from '../../../types/shelly';
import { formatCurrent, formatEnergy, formatPower, formatVoltage } from '../../../utils/formatters';

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

export function PM1Display({ componentId: _c, status, device: _d }: Props) {
  const { t, i18n } = useTranslation('devices');
  const pm1 = status as PM1Status | undefined;
  const locale = i18n.language;

  return (
    <Stack gap={4}>
      <Row
        label={t('power.activePower')}
        value={pm1 != null ? formatPower(pm1.apower, locale) : '—'}
      />
      <Row
        label={t('power.voltage')}
        value={pm1 != null ? formatVoltage(pm1.voltage, locale) : '—'}
      />
      <Row
        label={t('power.current')}
        value={pm1 != null ? formatCurrent(pm1.current, locale) : '—'}
      />
      <Row label={t('power.powerFactor')} value={pm1 != null ? pm1.pf.toFixed(2) : '—'} />
      <Row label={t('power.frequency')} value={pm1 != null ? `${pm1.freq.toFixed(1)} Hz` : '—'} />
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
    </Stack>
  );
}
