import {
  IconCloud,
  IconCloudFog,
  IconCloudRain,
  IconCloudSnow,
  IconCloudStorm,
  IconSun,
  IconSunHigh,
} from '@tabler/icons-react';
import type { WeatherCondition } from '../../services/weather';

const ICONS: Record<WeatherCondition, React.ComponentType<{ size?: number }>> = {
  clear: IconSun,
  partlyCloudy: IconSunHigh,
  overcast: IconCloud,
  fog: IconCloudFog,
  drizzle: IconCloudRain,
  rain: IconCloudRain,
  snow: IconCloudSnow,
  showers: IconCloudRain,
  snowShowers: IconCloudSnow,
  thunderstorm: IconCloudStorm,
};

export function WeatherIcon({
  condition,
  size = 18,
}: {
  condition: WeatherCondition;
  size?: number;
}) {
  const Icon = ICONS[condition] ?? IconCloud;
  return <Icon size={size} />;
}
