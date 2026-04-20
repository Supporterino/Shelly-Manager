import { ColorPicker, Group, Slider, Stack, Switch, Text } from '@mantine/core';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRGBControl } from '../../../hooks/useDeviceControl';
import type { ShellyComponentSummary, StoredDevice } from '../../../types/device';
import type { RGBStatus } from '../../../types/shelly';
import { formatPower } from '../../../utils/formatters';
import { ErrorBadges } from './ErrorBadges';
import { LightEnergyPanel } from './LightEnergyPanel';

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function RGBControl({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices');
  const rgb = status as RGBStatus | undefined;
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'rgb' && c.id === componentId,
  );
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 });
  const mutation = useRGBControl(deviceId, componentId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleColorChange = useCallback(
    (hex: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        mutation.mutate({ rgb: hexToRgb(hex) });
      }, 150);
    },
    [mutation],
  );

  const currentHex = rgb?.rgb ? rgbToHex(rgb.rgb) : '#ffffff';

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">
          {channelLabel}
        </Text>
        <Group gap="xs">
          {rgb?.apower != null && (
            <Text size="xs" c="dimmed">
              {formatPower(rgb.apower, i18n.language)}
            </Text>
          )}
          <Switch
            checked={rgb?.output ?? false}
            onChange={(e) => mutation.mutate({ on: e.currentTarget.checked })}
            disabled={mutation.isPending}
            size="md"
            label={rgb?.output ? t('controls.on') : t('controls.off')}
          />
        </Group>
      </Group>

      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" style={{ minWidth: 28 }}>
          {rgb?.brightness ?? 0}%
        </Text>
        <Slider
          value={rgb?.brightness ?? 0}
          style={{ flex: 1 }}
          label={(v) => `${v}%`}
          onChangeEnd={(v) => mutation.mutate({ brightness: v })}
          aria-label={t('controls.brightness')}
        />
      </Group>

      <ColorPicker
        format="hex"
        value={currentHex}
        onChange={handleColorChange}
        size="sm"
        fullWidth
        swatches={[
          '#ff0000',
          '#ff8000',
          '#ffff00',
          '#00ff00',
          '#00ffff',
          '#0000ff',
          '#8000ff',
          '#ff00ff',
          '#ffffff',
        ]}
      />

      <ErrorBadges errors={rgb?.errors} />
      <LightEnergyPanel status={rgb} />
    </Stack>
  );
}
