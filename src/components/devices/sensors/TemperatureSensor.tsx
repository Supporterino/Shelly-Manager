import { IconTemperature } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../../store/appStore';
import type { StoredDevice } from '../../../types/device';
import type { TemperatureStatus } from '../../../types/shelly';
import { SensorCard } from './SensorCard';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  device: StoredDevice;
}

export function TemperatureSensor({ componentId: _c, status, device: _d }: Props) {
  const { t } = useTranslation('devices');
  const unit = useAppStore((s) => s.preferences.temperatureUnit);
  const ts = status as TemperatureStatus | undefined;

  const displayValue =
    ts?.tC != null
      ? unit === 'F'
        ? `${ts.tF?.toFixed(1) ?? ((ts.tC * 9) / 5 + 32).toFixed(1)} °F`
        : `${ts.tC.toFixed(1)} °C`
      : '—';

  return (
    <SensorCard
      icon={<IconTemperature size={18} />}
      label={t('sensors.temperature')}
      value={displayValue}
    />
  );
}
