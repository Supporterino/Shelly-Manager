import {
  IconBolt,
  IconBulb,
  IconClick,
  IconColorFilter,
  IconColorSwatch,
  IconLayoutDistributeVertical,
  IconQuestionMark,
  IconSunElectricity,
  IconTemperature,
  IconToggleRight,
} from '@tabler/icons-react';
import type { DeviceType } from '../../types/device';

const iconMap: Record<DeviceType, React.ComponentType<{ size?: number; stroke?: number }>> = {
  switch: IconToggleRight,
  dimmer: IconBulb,
  cct: IconSunElectricity,
  rgb: IconColorSwatch,
  rgbw: IconColorFilter,
  cover: IconLayoutDistributeVertical,
  sensor: IconTemperature,
  energy: IconBolt,
  input: IconClick,
  unknown: IconQuestionMark,
};

interface DeviceTypeIconProps {
  type: DeviceType;
  size?: number;
  stroke?: number;
}

export function DeviceTypeIcon({ type, size = 20, stroke = 1.5 }: DeviceTypeIconProps) {
  const Icon = iconMap[type] ?? IconQuestionMark;
  return <Icon size={size} stroke={stroke} />;
}
