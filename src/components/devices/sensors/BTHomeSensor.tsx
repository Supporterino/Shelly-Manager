import { Card, Group, Stack, Text } from '@mantine/core';
import { IconBluetooth } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { BTHomeStatus } from '../../../types/shelly';
import { SensorCard } from './SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
}

export function BTHomeSensor({ componentId, status }: Props) {
  const { t, i18n } = useTranslation('devices');
  const s = status as BTHomeStatus | undefined;

  if (!s) return null;

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs">
          <IconBluetooth size={18} />
          <Text fw={500} size="sm">
            {t('sensors.bthome')} #{componentId + 1}
          </Text>
        </Group>

        {s.rssi != null && (
          <Text size="xs" c="dimmed">
            RSSI: {s.rssi} dBm
          </Text>
        )}

        {s.battery != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.battery')}
            value={`${s.battery}%`}
          />
        )}

        {s.temperature != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.temperature')}
            value={`${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(s.temperature)} °C`}
          />
        )}

        {s.humidity != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.humidity')}
            value={`${s.humidity}%`}
          />
        )}

        {s.illuminance != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.illuminance')}
            value={`${s.illuminance} lux`}
          />
        )}

        {s.motion != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.motion')}
            value={s.motion ? t('sensors.motionDetected') : t('sensors.motionClear')}
            alert={s.motion}
          />
        )}

        {s.window != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.window')}
            value={s.window ? t('sensors.windowOpen') : t('sensors.windowClosed')}
            alert={s.window}
          />
        )}

        {s.button != null && (
          <SensorCard
            icon={<IconBluetooth size={16} />}
            label={t('sensors.button')}
            value={`${s.button}`}
          />
        )}

        {s.errors && s.errors.length > 0 && (
          <Text size="xs" c="red">
            {s.errors.join(', ')}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
