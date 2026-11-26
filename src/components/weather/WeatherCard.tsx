import { Badge, Card, Group, Skeleton, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../hooks/useWeather';
import { conditionFromCode } from '../../services/weather';
import { useAppStore } from '../../store/appStore';
import type { WeatherLocation } from '../../types/weather';
import { formatTemperature } from '../../utils/formatters';
import { WeatherIcon } from './WeatherIcon';

interface Props {
  location: WeatherLocation;
}

/**
 * Dashboard tile for the configured weather location. Mirrors DeviceCard so it
 * blends into the device grid and opens a detail page on click.
 */
export function WeatherCard({ location }: Props) {
  const { t, i18n } = useTranslation('weather');
  const navigate = useNavigate();
  const temperatureUnit = useAppStore((s) => s.preferences.temperatureUnit);
  const { data, isLoading, isError } = useWeather(location);

  const condition = conditionFromCode(data?.current.weatherCode);

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      h="100%"
      style={{ cursor: 'pointer' }}
      onClick={() => void navigate({ to: '/weather' })}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" align="center" style={{ minWidth: 0 }}>
            <WeatherIcon condition={condition} size={22} />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" lineClamp={1}>
                {t('title')}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {location.name}
                {location.postcode ? ` · ${location.postcode}` : ''}
              </Text>
            </Stack>
          </Group>
          <Badge size="sm" variant="light" color={isError ? 'red' : 'teal'}>
            {isError ? t('status.unavailable') : t('status.live')}
          </Badge>
        </Group>

        {isLoading && !data ? (
          <Skeleton height={20} width={140} />
        ) : (
          <Group gap="md" align="center">
            <Text size="sm" fw={500}>
              {formatTemperature(data?.current.temperature ?? 0, i18n.language, temperatureUnit)}
            </Text>
            <Text size="sm" c="dimmed">
              {t('metric.radiation')}: {Math.round(data?.current.radiation ?? 0)} W/m²
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
