import { Card, Stack, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PresenceStatus } from '../../../types/shelly';
import { SensorCard } from '../sensors/SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
}

export function PresenceSensor({ componentId, status }: Props) {
  const { t } = useTranslation('devices');
  const s = status as PresenceStatus | undefined;

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Text fw={500} size="sm">
          {t('sensors.presence')} #{componentId + 1}
        </Text>
        <SensorCard
          icon={<IconUser size={20} />}
          label={t('sensors.presence')}
          value={s?.presence ? t('sensors.presenceDetected') : t('sensors.presenceClear')}
          alert={!!s?.presence}
        />
        {s?.motion != null && (
          <SensorCard
            icon={<IconUser size={20} />}
            label={t('sensors.motion')}
            value={s.motion ? t('sensors.motionDetected') : t('sensors.motionClear')}
            alert={s.motion}
          />
        )}
        {s?.errors && s.errors.length > 0 && (
          <Text size="xs" c="red">
            {s.errors.join(', ')}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
