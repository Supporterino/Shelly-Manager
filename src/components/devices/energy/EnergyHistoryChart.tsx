import { AreaChart } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MouseHandlerDataParam } from 'recharts';
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
  const formatTooltipLabel = useCallback(
    (value: unknown) => formatTime(formats.second, value),
    [formats],
  );

  const [zoom, setZoom] = useState<{ from: number; count: number } | null>(null);
  const selectionGradientId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<SVGGElement>(null);
  const dragRef = useRef<{ from: number; to: number; fromX: number } | null>(null);
  const panRef = useRef<{
    startX: number;
    rawDx: number;
    start: number;
    count: number;
    pointsPerPx: number;
  } | null>(null);
  const [panning, setPanning] = useState(false);

  const data = readings.map((r) => ({ ts: r.ts, apower: r.apower ?? 0 }));

  // Anchor the zoom window by start timestamp plus point count: the timestamp
  // keeps the window from drifting as new readings arrive, while the fixed
  // point count keeps the category-axis scale constant while panning across
  // gaps or uneven sampling intervals.
  const rawStart = zoom ? data.findIndex((d) => d.ts >= zoom.from) : -1;
  const zoomed = zoom !== null && rawStart !== -1 && data.length > zoom.count;
  const start = zoomed ? Math.min(rawStart, data.length - zoom.count) : 0;
  const visible = zoomed ? data.slice(start, start + zoom.count) : data;

  // Minute labels repeat once the zoomed window gets short, so switch the axis
  // to seconds below 15 minutes.
  const shortWindow =
    visible.length > 1 && visible[visible.length - 1].ts - visible[0].ts <= 15 * 60 * 1000;
  const formatTick = useCallback(
    (value: unknown) => formatTime(shortWindow ? formats.second : formats.minute, value),
    [formats, shortWindow],
  );

  const drawSelection = useCallback((toX: number, y1?: string, y2?: string) => {
    const drag = dragRef.current;
    const selection = selectionRef.current;
    if (!drag || !selection) return;
    const area = selection.querySelector('rect');
    const [startLine, endLine] = selection.querySelectorAll('line');
    if (!area || !startLine || !endLine) return;
    if (y1 && y2) {
      area.setAttribute('y', y1);
      area.setAttribute('height', `${Math.max(0, Number(y2) - Number(y1))}`);
      startLine.setAttribute('y1', y1);
      startLine.setAttribute('y2', y2);
      endLine.setAttribute('y1', y1);
      endLine.setAttribute('y2', y2);
    }
    area.setAttribute('x', `${Math.min(drag.fromX, toX)}`);
    area.setAttribute('width', `${Math.abs(toX - drag.fromX)}`);
    startLine.setAttribute('x1', `${drag.fromX}`);
    startLine.setAttribute('x2', `${drag.fromX}`);
    endLine.setAttribute('x1', `${toX}`);
    endLine.setAttribute('x2', `${toX}`);
    selection.style.display = '';
  }, []);

  const finishDrag = useCallback(() => {
    const pan = panRef.current;
    const drag = dragRef.current;
    panRef.current = null;
    dragRef.current = null;
    if (selectionRef.current) selectionRef.current.style.display = 'none';

    if (pan) {
      if (boxRef.current) boxRef.current.style.cursor = 'grab';
      setPanning(false);
      // a press without moving resets the zoom — the raw pointer travel counts,
      // not the clamped shift, which is 0 while the window sits at an edge
      if (Math.abs(pan.rawDx) < 3) setZoom(null);
      return;
    }

    if (!drag) return;
    const from = Math.min(drag.from, drag.to);
    const to = Math.max(drag.from, drag.to);
    const count = to - from + 1;
    // a click without dragging zooms back out to the full window
    const first = visible[from];
    setZoom(count < 3 || count >= data.length || !first ? null : { from: first.ts, count });
  }, [data.length, visible]);

  useEffect(() => {
    const onMouseUp = () => finishDrag();
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [finishDrag]);

  // Plot geometry: the curve's bounding box spans exactly the first to the last
  // reading, which is all that is needed and does not depend on recharts.
  const plotBox = useCallback(() => {
    const svg = boxRef.current?.querySelector('svg.recharts-surface');
    const curve = svg?.querySelector<SVGPathElement>('.recharts-area-curve');
    if (!svg || !curve) return null;
    const rect = svg.getBoundingClientRect();
    const box = curve.getBBox();
    if (rect.width <= 0 || !(box.width > 0)) return null;
    const gridLine = svg.querySelector<SVGLineElement>('.recharts-cartesian-grid line');
    const y1 = gridLine?.getAttribute('y1') ?? `${box.y}`;
    const y2 = gridLine?.getAttribute('y2') ?? `${box.y + box.height}`;
    const scale = (Number(svg.getAttribute('width')) || rect.width) / rect.width;
    return { left: rect.left, scale, x: box.x, width: box.width, y1, y2 };
  }, []);

  const pointFromEvent = useCallback(
    (event: React.MouseEvent) => {
      const plot = plotBox();
      if (!plot) return null;
      const rawX = (event.clientX - plot.left) * plot.scale;
      const clampedX = Math.max(plot.x, Math.min(plot.x + plot.width, rawX));
      const index = Math.round(((clampedX - plot.x) / plot.width) * (visible.length - 1));
      const x = plot.x + (index / (visible.length - 1)) * plot.width;
      return { index, x, y1: plot.y1, y2: plot.y2 };
    },
    [plotBox, visible.length],
  );

  // Recharts already throttles mouse events to one handler call per frame, so
  // this needs no throttle of its own. Skipping identical values avoids
  // pointless renders while the window is pinned at a data edge.
  const applyZoom = useCallback((next: { from: number; count: number }) => {
    setZoom((current) =>
      current && current.from === next.from && current.count === next.count ? current : next,
    );
  }, []);

  const handleMouseDown = useCallback(
    (_state: MouseHandlerDataParam, event: React.MouseEvent<SVGGraphicsElement>) => {
      if (!boxRef.current) return;

      if (zoomed && zoom) {
        const plot = plotBox();
        if (!plot) return;
        panRef.current = {
          startX: event.clientX,
          rawDx: 0,
          start,
          count: zoom.count,
          pointsPerPx: (zoom.count - 1) / (plot.width / plot.scale),
        };
        boxRef.current.style.cursor = 'grabbing';
        setPanning(true);
        return;
      }

      const point = pointFromEvent(event);
      if (!point) return;
      dragRef.current = { from: point.index, to: point.index, fromX: point.x };
      drawSelection(point.x, point.y1, point.y2);
    },
    [drawSelection, plotBox, pointFromEvent, start, zoom, zoomed],
  );

  const handleMouseMove = useCallback(
    (_state: MouseHandlerDataParam, event: React.MouseEvent<SVGGraphicsElement>) => {
      if (!boxRef.current) return;
      const pan = panRef.current;

      if (pan) {
        // the curve follows the pointer, and simply stops at the data edges
        pan.rawDx = event.clientX - pan.startX;
        const nextStart = Math.max(
          0,
          Math.min(data.length - pan.count, Math.round(pan.start - pan.rawDx * pan.pointsPerPx)),
        );
        const first = data[nextStart];
        if (first) applyZoom({ from: first.ts, count: pan.count });
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const point = pointFromEvent(event);
      if (!point) return;
      drag.to = point.index;
      drawSelection(point.x);
    },
    [applyZoom, data, drawSelection, pointFromEvent],
  );

  if (readings.length === 0) {
    return (
      <Text size="xs" c="dimmed" ta="center" py="sm">
        {t('power.noHistory')}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Text size="xs" fw={600}>
          {t('power.history24h')}
        </Text>
        {zoomed && visible.length > 0 && (
          <Text size="xs" c="dimmed">
            {formatTick(visible[0].ts)} – {formatTick(visible[visible.length - 1].ts)}
          </Text>
        )}
      </Group>
      <div
        ref={boxRef}
        style={{
          cursor: zoomed ? 'grab' : 'crosshair',
        }}
      >
        <AreaChart
          h={160}
          w={'100%'}
          data={visible}
          dataKey="ts"
          series={[{ name: 'apower', color: 'blue.6', label: 'W' }]}
          curveType="monotone"
          withLegend={true}
          withDots={false}
          withTooltip={!panning}
          tooltipAnimationDuration={200}
          gridAxis="y"
          tickLine="y"
          xAxisProps={{ tickFormatter: formatTick }}
          tooltipProps={{ labelFormatter: formatTooltipLabel }}
          yAxisProps={{ domain: zoomed ? ['auto', 'auto'] : [0, 'auto'] }}
          areaChartProps={{ onMouseDown: handleMouseDown, onMouseMove: handleMouseMove }}
          valueFormatter={(value) =>
            `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value))} W`
          }
        >
          <g
            ref={selectionRef}
            style={{ display: 'none', pointerEvents: 'none' }}
            stroke="var(--mantine-color-dimmed)"
            strokeWidth={1}
            strokeDasharray="5 5"
          >
            <defs>
              <linearGradient id={selectionGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mantine-color-dimmed)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--mantine-color-dimmed)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <rect fill={`url(#${selectionGradientId})`} stroke="none" />
            <line />
            <line />
          </g>
        </AreaChart>
      </div>
    </Stack>
  );
}
