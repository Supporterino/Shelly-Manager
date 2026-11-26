import { useCallback, useMemo } from 'react';
import { ZoomableAreaChart } from '../charts/ZoomableAreaChart';

export interface WeatherChartSeries {
  /** Key of this metric inside the data rows. */
  name: string;
  color: string;
  /** Human readable name for tooltip and legend. */
  label: string;
  /** Draw as dashed outline instead of a filled area. */
  dashed?: boolean;
}

interface Props<Row extends { ts: number }> {
  data: Row[];
  series: WeatherChartSeries[];
  height?: number;
  title?: string;
  formatValue: (value: number) => string;
  withLegend?: boolean;
  markers?: Array<{ at: number; label?: string }>;
  /** Widen when tick labels carry a unit such as "W/m²". */
  yAxisWidth?: number;
}

function formatTime(format: Intl.DateTimeFormat, value: unknown): string {
  const ts = Number(value);
  return Number.isFinite(ts) ? format.format(ts) : '';
}

/**
 * Weather series with the shared zoom/pan behaviour. The x value is the raw
 * timestamp (same reasoning as in EnergyHistoryChart: repeated labels would
 * collapse data points). Supports several curves on one axis, e.g. wind speed
 * as area plus a dashed gust outline.
 */
export function WeatherChart<Row extends { ts: number }>({
  data,
  series,
  height = 140,
  title,
  formatValue,
  withLegend = false,
  markers,
  yAxisWidth,
}: Props<Row>) {
  const formats = useMemo(
    () => ({
      hour: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }),
      day: new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit' }),
    }),
    [],
  );

  // Hourly data needs no second precision; over multi-day windows the weekday
  // beats a repeated "01:00".
  const formatTick = useCallback(
    (value: unknown, windowMs: number) =>
      formatTime(windowMs > 30 * 60 * 60 * 1000 ? formats.day : formats.hour, value),
    [formats],
  );

  const formatTooltipLabel = useCallback(
    (value: unknown) => formatTime(formats.hour, value),
    [formats],
  );

  const valueFormatter = useCallback((value: number) => formatValue(value), [formatValue]);

  const chartSeries = useMemo(
    () =>
      series.map((entry) => ({
        name: entry.name,
        color: entry.color,
        label: entry.label,
        strokeDasharray: entry.dashed ? '5 4' : undefined,
      })),
    [series],
  );

  // A dashed companion keeps the fill of the curve underneath visible.
  const areaProps = useCallback(
    (item: { name?: string }) =>
      series.find((entry) => entry.name === item.name)?.dashed ? { fillOpacity: 0 } : {},
    [series],
  );

  return (
    <ZoomableAreaChart
      data={data}
      dataKey="ts"
      series={chartSeries}
      areaProps={areaProps}
      height={height}
      title={title}
      withLegend={withLegend}
      valueFormatter={valueFormatter}
      formatTick={formatTick}
      formatTooltipLabel={formatTooltipLabel}
      markers={markers}
      yAxisWidth={yAxisWidth}
      emptyLabel="—"
    />
  );
}
