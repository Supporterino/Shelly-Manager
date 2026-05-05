import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useEM1DataResetTotals,
  useEM1DataStatus,
  useEMDataResetTotals,
  useEMDataStatus,
  usePM1DataResetTotals,
  usePM1DataStatus,
} from '../../../hooks/useDeviceControl';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  deviceId: string;
  componentId: number;
  type: 'em' | 'em1' | 'pm1';
}

function formatKWh(val: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilowatt-hour',
    maximumFractionDigits: 3,
  }).format(val / 1000);
}

export function EnergyDataPanel({ deviceId, componentId, type }: Props) {
  const { t, i18n } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const emQuery = useEMDataStatus(deviceId, componentId);
  const em1Query = useEM1DataStatus(deviceId, componentId);
  const pm1Query = usePM1DataStatus(deviceId, componentId);

  const emReset = useEMDataResetTotals(deviceId, componentId);
  const em1Reset = useEM1DataResetTotals(deviceId, componentId);
  const pm1Reset = usePM1DataResetTotals(deviceId, componentId);

  const query = type === 'em' ? emQuery : type === 'em1' ? em1Query : pm1Query;
  const resetMutation = type === 'em' ? emReset : type === 'em1' ? em1Reset : pm1Reset;

  const { data, isLoading, isError } = query;

  if (isLoading) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    );
  }

  if (isError || !data) {
    return (
      <Text size="sm" c="red">
        {tc('status.error')}
      </Text>
    );
  }

  const locale = i18n.language;

  return (
    <Stack gap="sm">
      {typeof data.total_act === 'number' && (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {t('power.totalEnergy')}
          </Text>
          <Text size="sm" fw={500}>
            {formatKWh(data.total_act, locale)}
          </Text>
        </Group>
      )}
      {'total_aprt' in data && typeof (data as Record<string, unknown>).total_aprt === 'number' && (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {t('power.apparentPower')}
          </Text>
          <Text size="sm" fw={500}>
            {formatKWh((data as { total_aprt: number }).total_aprt, locale)}
          </Text>
        </Group>
      )}
      {'a_total_act' in data &&
        typeof (data as Record<string, unknown>).a_total_act === 'number' && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {t('power.phaseA')}
            </Text>
            <Text size="sm" fw={500}>
              {formatKWh((data as { a_total_act: number }).a_total_act, locale)}
            </Text>
          </Group>
        )}
      {'b_total_act' in data &&
        typeof (data as Record<string, unknown>).b_total_act === 'number' && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {t('power.phaseB')}
            </Text>
            <Text size="sm" fw={500}>
              {formatKWh((data as { b_total_act: number }).b_total_act, locale)}
            </Text>
          </Group>
        )}

      <Group justify="flex-end">
        <Button variant="light" color="red" size="xs" onClick={() => setConfirmOpen(true)}>
          {t('energy.resetTotals')}
        </Button>
      </Group>

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          resetMutation.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })
        }
        title={t('energy.resetTotals')}
        message={t('energy.resetConfirm')}
        confirmColor="red"
        loading={resetMutation.isPending}
      />
    </Stack>
  );
}
