import { Card, Group, Stack, Text } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PresenceZoneStatus } from '../../../types/shelly';
import { SensorCard } from './SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
}

export function PresenceZoneSensor({ componentId, status }: Props) {
  const { t } = useTranslation('devices');
  const s = status as PresenceZoneStatus | undefined;

  const zoneEntries = s?.zones ? Object.entries(s.zones) : [];

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Text fw={500} size="sm">
          {t('sensors.presenceZone')} #{componentId + 1}
        </Text>
        <SensorCard
          icon={<IconMapPin size={20} />}
          label={t('sensors.presence')}
          value={s?.presence ? t('sensors.presenceDetected') : t('sensors.presenceClear')}
          alert={!!s?.presence}
        />
        {zoneEntries.length > 0 && (
          <Stack gap="xs">
            {zoneEntries.map(([zoneName, active]) => (
              <Group key={zoneName} justify="space-between">
                <Text size="sm">{zoneName}</Text>
                <Text size="sm" c={active ? 'green' : 'dimmed'}>
                  {active ? t('sensors.zoneActive') : t('sensors.zoneInactive')}
                </Text>
              </Group>
            ))}
          </Stack>
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
