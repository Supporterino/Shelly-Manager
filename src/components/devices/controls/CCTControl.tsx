import { Box, Group, Slider, Stack, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useCCTControl } from '../../../hooks/useDeviceControl';
import type { ShellyComponentSummary, StoredDevice } from '../../../types/device';
import type { LightStatus } from '../../../types/shelly';
import { formatPower } from '../../../utils/formatters';
import { ErrorBadges } from './ErrorBadges';
import { LightEnergyPanel } from './LightEnergyPanel';

const MIN_TEMP = 2700;
const MAX_TEMP = 6500;

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function CCTControl({ deviceId, componentId, status, device }: Props) {
  const { t, i18n } = useTranslation('devices');
  const light = status as LightStatus | undefined;
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'light_cct' && c.id === componentId,
  );
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 });
  const mutation = useCCTControl(deviceId, componentId);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">
          {channelLabel}
        </Text>
        <Group gap="xs">
          {light?.apower != null && (
            <Text size="xs" c="dimmed">
              {formatPower(light.apower, i18n.language)}
            </Text>
          )}
          <Switch
            checked={light?.output ?? false}
            onChange={(e) => mutation.mutate({ on: e.currentTarget.checked })}
            disabled={mutation.isPending}
            size="md"
            label={light?.output ? t('controls.on') : t('controls.off')}
          />
        </Group>
      </Group>

      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" style={{ minWidth: 28 }}>
          {light?.brightness ?? 0}%
        </Text>
        <Slider
          value={light?.brightness ?? 0}
          style={{ flex: 1 }}
          label={(v) => `${v}%`}
          onChangeEnd={(v) => mutation.mutate({ on: v > 0, brightness: v })}
          aria-label={t('controls.brightness')}
        />
      </Group>

      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" style={{ minWidth: 28 }}>
          {light?.temp ?? MIN_TEMP} K
        </Text>
        <Box
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(to right, #ffd27f, #e8f4ff)`,
            marginBottom: 4,
          }}
        />
        <Slider
          value={light?.temp ?? MIN_TEMP}
          min={MIN_TEMP}
          max={MAX_TEMP}
          style={{ flex: 1 }}
          label={(v) => `${v} K`}
          onChangeEnd={(v) => mutation.mutate({ temp: v })}
          aria-label={t('controls.colorTemperature')}
        />
      </Group>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {t('controls.warm')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('controls.cool')}
        </Text>
      </Group>

      <ErrorBadges errors={light?.errors} />
      <LightEnergyPanel status={light} showTemp />
    </Stack>
  );
}
