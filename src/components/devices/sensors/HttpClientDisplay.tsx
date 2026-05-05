import { Card, Group, Stack, Text } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { HTTPClientStatus } from '../../../types/shelly';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
}

export function HttpClientDisplay({ componentId, status }: Props) {
  const { t } = useTranslation('devices');
  const s = status as HTTPClientStatus | undefined;

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs">
          <IconWorld size={18} />
          <Text fw={500} size="sm">
            {t('sensors.httpClient')} #{componentId + 1}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm">{t('sensors.httpConnected')}</Text>
          <Text size="sm" c={s?.connected ? 'green' : 'red'}>
            {s?.connected ? t('sensors.httpYes') : t('sensors.httpNo')}
          </Text>
        </Group>

        {s?.errors && s.errors.length > 0 && (
          <Text size="xs" c="red">
            {s.errors.join(', ')}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
