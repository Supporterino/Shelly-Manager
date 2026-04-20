import { Progress } from '@mantine/core';
import { IconDroplet } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { StoredDevice } from '../../../types/device';
import type { HumidityStatus } from '../../../types/shelly';
import { SensorCard } from './SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function HumiditySensor({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices');
  const hs = status as HumidityStatus | undefined;
  const rh = hs?.rh ?? null;
  const isHigh = rh != null && rh > 80;

  return (
    <SensorCard
      icon={<IconDroplet size={18} />}
      label={t('sensors.humidity')}
      value={rh != null ? `${rh.toFixed(0)} %` : '—'}
      alert={isHigh}
      extra={
        rh != null ? <Progress value={rh} size="sm" color={isHigh ? 'red' : 'blue'} /> : undefined
      }
    />
  );
}
