import { Badge, Group, Text } from '@mantine/core';
import { IconWalk } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { StoredDevice } from '../../../types/device';
import type { MotionStatus } from '../../../types/shelly';
import { formatRelativeTime } from '../../../utils/formatters';
import { SensorCard } from './SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function MotionSensor({ componentId: _c, status, device: _d }: Props) {
  const { t, i18n } = useTranslation('devices');
  const ms = status as MotionStatus | undefined;

  const lastMotion =
    ms?.motion_ts != null
      ? t('sensors.lastMotion', {
          time: formatRelativeTime(Date.now() - ms.motion_ts * 1000, i18n.language),
        })
      : null;

  return (
    <SensorCard
      icon={<IconWalk size={18} />}
      label={t('sensors.motion')}
      value={
        <Group gap="xs" align="center">
          <Badge
            color={ms?.motion ? 'blue' : 'gray'}
            variant={ms?.motion ? 'filled' : 'light'}
            style={ms?.motion ? { animation: 'pulse 1s infinite' } : undefined}
          >
            {ms?.motion ? t('sensors.motionDetected') : t('sensors.motionClear')}
          </Badge>
        </Group>
      }
      extra={
        lastMotion ? (
          <Text size="xs" c="dimmed">
            {lastMotion}
          </Text>
        ) : undefined
      }
    />
  );
}
