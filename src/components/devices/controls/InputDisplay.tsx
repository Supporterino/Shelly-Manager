import { Badge, Group, Progress, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ShellyComponentSummary, StoredDevice } from '../../../types/device';
import type { InputStatus } from '../../../types/shelly';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function InputDisplay({ deviceId: _deviceId, componentId, status, device }: Props) {
  const { t } = useTranslation('devices');
  const input = status as InputStatus | undefined;
  const comp: ShellyComponentSummary | undefined = device.components.find(
    (c) => c.type === 'input' && c.id === componentId,
  );
  const channelLabel = comp?.name ?? t('controls.channel', { n: componentId + 1 });

  const stateLabel =
    input?.state === true
      ? t('controls.input.pressed')
      : input?.state === false
        ? t('controls.input.released')
        : '—';

  const stateColor = input?.state === true ? 'blue' : 'gray';

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">
          {channelLabel}
        </Text>
        <Badge color={stateColor} variant="light">
          {stateLabel}
        </Badge>
      </Group>
      {input?.percent != null && (
        <Group gap="sm" align="center">
          <Text size="xs" c="dimmed" style={{ minWidth: 28 }}>
            {input.percent}%
          </Text>
          <Progress value={input.percent} style={{ flex: 1 }} size="sm" />
        </Group>
      )}
    </Stack>
  );
}
