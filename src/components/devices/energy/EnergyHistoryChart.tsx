import { AreaChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_ARRAY, useEnergyHistoryStore } from '../../../store/energyHistoryStore';

interface Props {
  deviceId: string;
  componentType: string;
  componentId: number;
}

export function EnergyHistoryChart({ deviceId, componentType, componentId }: Props) {
  const { t, i18n } = useTranslation('devices');
  const key = `${componentType}:${componentId}`;
  const readings = useEnergyHistoryStore(
    useCallback((s) => s.history[deviceId]?.[key] ?? EMPTY_ARRAY, [deviceId, key]),
  );

  if (readings.length === 0) {
    return (
      <Text size="xs" c="dimmed" ta="center" py="sm">
        {t('power.noHistory')}
      </Text>
    );
  }

  const locale = i18n.language;

  const data = readings.map((r) => ({
    time: new Date(r.ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    apower: r.apower ?? 0,
  }));

  return (
    <Stack gap="xs">
      <Text size="xs" fw={600}>
        {t('power.history24h')}
      </Text>
      <AreaChart
        h={160}
        w={'100%'}
        data={data}
        dataKey="time"
        series={[{ name: 'apower', color: 'blue.6', label: 'W' }]}
        curveType="monotone"
        withLegend={true}
        withDots={false}
        withTooltip
        tooltipAnimationDuration={200}
        gridAxis="y"
        tickLine="y"
        valueFormatter={(value) =>
          `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value))} W`
        }
      />
    </Stack>
  );
}
