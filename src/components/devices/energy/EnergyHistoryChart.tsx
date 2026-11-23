import { AreaChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_ARRAY, useEnergyHistoryStore } from '../../../store/energyHistoryStore';

interface Props {
  deviceId: string;
  componentType: string;
  componentId: number;
}

/** Recharts also calls the formatters with empty values, and Intl throws on NaN. */
function formatTime(format: Intl.DateTimeFormat, value: unknown): string {
  const ts = Number(value);
  return Number.isFinite(ts) ? format.format(ts) : '';
}

export function EnergyHistoryChart({ deviceId, componentType, componentId }: Props) {
  const { t, i18n } = useTranslation('devices');
  const key = `${componentType}:${componentId}`;
  const readings = useEnergyHistoryStore(
    useCallback((s) => s.history[deviceId]?.[key] ?? EMPTY_ARRAY, [deviceId, key]),
  );

  const locale = i18n.language;

  // Recharts calls tickFormatter for every candidate tick — thousands of times
  // per render with 24h of readings. toLocaleTimeString builds a new ICU
  // formatter on each call, so keep one instance per locale instead.
  const formats = useMemo(
    () => ({
      minute: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }),
      second: new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }),
    [locale],
  );

  // The x value stays the raw timestamp: minute- or second-precision labels are
  // not unique at ~1 reading/s, and duplicated categories would make recharts
  // collapse points so most values could not be reached in the tooltip.
  const formatTick = useCallback((value: unknown) => formatTime(formats.minute, value), [formats]);
  const formatTooltipLabel = useCallback(
    (value: unknown) => formatTime(formats.second, value),
    [formats],
  );

  if (readings.length === 0) {
    return (
      <Text size="xs" c="dimmed" ta="center" py="sm">
        {t('power.noHistory')}
      </Text>
    );
  }

  const data = readings.map((r) => ({ ts: r.ts, apower: r.apower ?? 0 }));

  return (
    <Stack gap="xs">
      <Text size="xs" fw={600}>
        {t('power.history24h')}
      </Text>
      <AreaChart
        h={160}
        w={'100%'}
        data={data}
        dataKey="ts"
        series={[{ name: 'apower', color: 'blue.6', label: 'W' }]}
        curveType="monotone"
        withLegend={true}
        withDots={false}
        withTooltip
        tooltipAnimationDuration={200}
        gridAxis="y"
        tickLine="y"
        xAxisProps={{ tickFormatter: formatTick }}
        tooltipProps={{ labelFormatter: formatTooltipLabel }}
        valueFormatter={(value) =>
          `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value))} W`
        }
      />
    </Stack>
  );
}
