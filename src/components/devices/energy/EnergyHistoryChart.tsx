import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_ARRAY, useEnergyHistoryStore } from '../../../store/energyHistoryStore';
import { ZoomableAreaChart } from '../../charts/ZoomableAreaChart';

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

const FIFTEEN_MINUTES = 15 * 60 * 1000;

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

  // Minute labels repeat once the zoomed window gets short, so switch the axis
  // to seconds below 15 minutes.
  const formatTick = useCallback(
    (value: unknown, windowMs: number) =>
      formatTime(
        windowMs > 0 && windowMs <= FIFTEEN_MINUTES ? formats.second : formats.minute,
        value,
      ),
    [formats],
  );

  // The tooltip always shows seconds: the x value is the raw timestamp, so the
  // label is the only place where the reading time is visible.
  const formatTooltipLabel = useCallback(
    (value: unknown) => formatTime(formats.second, value),
    [formats],
  );

  const valueFormatter = useCallback(
    (value: number) =>
      `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} W`,
    [locale],
  );

  // The x value stays the raw timestamp: minute- or second-precision labels are
  // not unique at ~1 reading/s, and duplicated categories would make recharts
  // collapse points so most values could not be reached in the tooltip.
  const data = useMemo(
    () => readings.map((r) => ({ ts: r.ts, apower: r.apower ?? 0 })),
    [readings],
  );

  return (
    <ZoomableAreaChart
      data={data}
      dataKey="ts"
      series={[{ name: 'apower', color: 'blue.6', label: 'W' }]}
      title={t('power.history24h')}
      emptyLabel={t('power.noHistory')}
      valueFormatter={valueFormatter}
      formatTick={formatTick}
      formatTooltipLabel={formatTooltipLabel}
    />
  );
}
