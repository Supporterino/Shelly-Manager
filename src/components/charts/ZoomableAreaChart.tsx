import { AreaChart } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseHandlerDataParam } from 'recharts';

export interface ZoomWindow {
  /** Timestamp of the first visible point. */
  from: number;
  /** Number of visible points — constant while panning. */
  count: number;
}

type Domain = [number | 'auto', number | 'auto'];

interface Props<Point> {
  data: Point[];
  /** Field holding the timestamp in milliseconds. */
  dataKey: keyof Point & string;
  series: Array<{ name: string; color: string; label: string }>;
  /** Timestamp field of the series values used for the y axis defaults. */
  height?: number;
  title?: React.ReactNode;
  emptyLabel?: React.ReactNode;
  valueFormatter: (value: number) => string;
  /**
   * Tick formatter. Receives the visible window span in ms so callers can
   * switch from hour to second precision for very short windows.
   */
  formatTick: (value: unknown, windowMs: number) => string;
  formatTooltipLabel?: (value: unknown) => string;
  yDomain?: Domain;
  zoomedYDomain?: Domain;
  withLegend?: boolean;
  tooltipAnimationDuration?: number;
}

/**
 * Mantine area chart with drag-to-zoom and pan.
 *
 * Interaction model:
 * - drag on the full view: select a time range, zoom into it on release
 * - drag while zoomed: pan the window 1:1 with the cursor (no deeper zoom)
 * - press without moving while zoomed: reset to the full view
 *
 * The window is anchored by start timestamp plus point count: the timestamp
 * keeps the view from drifting as new points arrive, while the fixed point
 * count keeps the category axis scale constant while panning across unevenly
 * sampled data or gaps.
 */
export function ZoomableAreaChart<Point extends Record<string, unknown>>({
  data,
  dataKey,
  series,
  height = 160,
  title,
  emptyLabel,
  valueFormatter,
  formatTick,
  formatTooltipLabel,
  yDomain = [0, 'auto'],
  zoomedYDomain = ['auto', 'auto'],
  withLegend = true,
  tooltipAnimationDuration = 200,
}: Props<Point>) {
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
  const [zoom, setZoom] = useState<ZoomWindow | null>(null);
  const [panning, setPanning] = useState(false);

  const timestamps = useMemo(() => data.map((point) => Number(point[dataKey])), [data, dataKey]);

  const rawStart = zoom ? timestamps.findIndex((ts) => ts >= zoom.from) : -1;
  const zoomed = zoom !== null && rawStart !== -1 && data.length > zoom.count;
  const start = zoomed ? Math.min(rawStart, data.length - zoom.count) : 0;
  const visible = zoomed ? data.slice(start, start + zoom.count) : data;

  const windowMs =
    visible.length > 1 ? timestamps[start + visible.length - 1] - timestamps[start] : 0;

  const tickFormatter = useCallback(
    (value: unknown) => formatTick(value, windowMs),
    [formatTick, windowMs],
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
    const first = visible[from];
    // a click without dragging zooms back out to the full window
    setZoom(
      count < 3 || count >= data.length || !first ? null : { from: Number(first[dataKey]), count },
    );
  }, [data, dataKey, visible]);

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
  const applyZoom = useCallback((next: ZoomWindow) => {
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
        const ts = timestamps[nextStart];
        if (ts !== undefined) applyZoom({ from: ts, count: pan.count });
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const point = pointFromEvent(event);
      if (!point) return;
      drag.to = point.index;
      drawSelection(point.x);
    },
    [applyZoom, data.length, drawSelection, pointFromEvent, timestamps],
  );

  if (data.length === 0) {
    return typeof emptyLabel === 'string' ? (
      <Text size="xs" c="dimmed" ta="center" py="sm">
        {emptyLabel}
      </Text>
    ) : (
      (emptyLabel ?? null)
    );
  }

  const rangeLabel =
    zoomed && visible.length > 0
      ? `${formatTick(timestamps[start], windowMs)} – ${formatTick(
          timestamps[start + visible.length - 1],
          windowMs,
        )}`
      : null;

  return (
    <Stack gap="xs">
      {(title != null || rangeLabel != null) && (
        <Group justify="space-between" gap="xs" wrap="nowrap">
          {title != null ? (
            typeof title === 'string' ? (
              <Text size="xs" fw={600}>
                {title}
              </Text>
            ) : (
              title
            )
          ) : (
            <span />
          )}
          {rangeLabel != null && (
            <Text size="xs" c="dimmed">
              {rangeLabel}
            </Text>
          )}
        </Group>
      )}
      <div ref={boxRef} style={{ cursor: zoomed ? 'grab' : 'crosshair' }}>
        <AreaChart
          h={height}
          w="100%"
          data={visible as Array<Record<string, unknown>>}
          dataKey={dataKey}
          series={series}
          curveType="monotone"
          withLegend={withLegend}
          withDots={false}
          withTooltip={!panning}
          tooltipAnimationDuration={tooltipAnimationDuration}
          gridAxis="y"
          tickLine="y"
          xAxisProps={{ tickFormatter: tickFormatter }}
          {...(formatTooltipLabel ? { tooltipProps: { labelFormatter: formatTooltipLabel } } : {})}
          yAxisProps={{ domain: zoomed ? zoomedYDomain : yDomain }}
          areaChartProps={{ onMouseDown: handleMouseDown, onMouseMove: handleMouseMove }}
          valueFormatter={(value) => valueFormatter(Number(value))}
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
