import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { WeatherChart } from '../components/weather/WeatherChart';
import { WeatherIcon } from '../components/weather/WeatherIcon';
import { useWeather } from '../hooks/useWeather';
import { conditionFromCode } from '../services/weather';
import { useAppStore } from '../store/appStore';
import { useWeatherStore } from '../store/weatherStore';
import { formatTemperature } from '../utils/formatters';

export const Route = createFileRoute('/weather')({
  component: WeatherPage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Group>
  );
}
function WeatherPage() {
  const { t, i18n } = useTranslation('weather');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const location = useWeatherStore((s) => s.location);
  const temperatureUnit = useAppStore((s) => s.preferences.temperatureUnit);
  // Format numbers and times with the active UI language, same as the energy
  // chart — the stored preference is empty when following the system locale.
  const locale = i18n.language;
  const { data, isLoading, isError, refetch } = useWeather(location);

  // The current values are 15 minute model steps, while the hourly series used
  // by the charts only has full hours — show the reading time so both are
  // unambiguous.
  const currentTime =
    data?.current.ts != null
      ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
          data.current.ts,
        )
      : null;

  const back = (
    <Link to="/">
      <ActionIcon variant="subtle" size="lg" aria-label={tc('actions.back')}>
        <IconArrowLeft size={18} />
      </ActionIcon>
    </Link>
  );

  if (!location) {
    return (
      <ScrollArea h="100%">
        <Container size="sm">
          <Stack gap="md" p="md">
            <Group gap="xs" align="center">
              {back}
              <Title order={3}>{t('title')}</Title>
            </Group>
            <Text size="sm" c="dimmed">
              {t('empty.description')}
            </Text>
            <Button onClick={() => void navigate({ to: '/settings' })}>
              {t('empty.openSettings')}
            </Button>
          </Stack>
        </Container>
      </ScrollArea>
    );
  }

  const current = data?.current;
  const condition = conditionFromCode(current?.weatherCode);
  const samples = data?.samples ?? [];
  const temperatureSeries = samples.map((s) => ({ ts: s.ts, temperature: s.temperature }));
  const radiationSeries = samples.map((s) => ({ ts: s.ts, radiation: s.radiation }));
  const windSeries = samples.map((s) => ({ ts: s.ts, wind: s.windSpeed, gust: s.windGust }));
  const precipitationSeries = samples.map((s) => ({ ts: s.ts, precipitation: s.precipitation }));

  // The series covers yesterday 00:00 to tomorrow 23:45 UTC. Marking "now"
  // separates the observed part from the forecast part. Reference lines sit on
  // the category axis, so snap to the nearest sample (15 minute steps).
  const now = Date.now();
  const nearestSample = samples.reduce<number | null>(
    (best, sample) =>
      best === null || Math.abs(sample.ts - now) < Math.abs(best - now) ? sample.ts : best,
    null,
  );
  const markers = nearestSample === null ? [] : [{ at: nearestSample, label: t('chart.now') }];

  return (
    <ScrollArea h="100%">
      <Container size="md">
        <Stack gap="md" p="md">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
              {back}
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Title order={3} lineClamp={1}>
                  {t('title')}
                </Title>
                <Group gap="xs" align="center">
                  <Badge size="sm" variant="light" color={isError ? 'red' : 'teal'}>
                    {isError ? t('status.unavailable') : t('status.live')}
                  </Badge>
                  {currentTime && !isError && (
                    <Text size="xs" c="dimmed">
                      {t('status.updatedAt', { time: currentTime })}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed" truncate="end">
                    {location.name}
                    {[location.postcode, location.admin3, location.admin1, location.country].filter(
                      Boolean,
                    ).length > 0
                      ? ` · ${[
                          location.postcode,
                          location.admin3,
                          location.admin1,
                          location.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}`
                      : ''}
                  </Text>
                </Group>
              </Stack>
            </Group>
            <Group gap="xs">
              <ActionIcon
                variant="light"
                size="lg"
                aria-label={tc('actions.refresh')}
                loading={isLoading}
                onClick={() => void refetch()}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <Divider />

          {isLoading && !current ? (
            <Center h={120}>
              <Loader size="sm" />
            </Center>
          ) : (
            <Stack gap={6}>
              <Group gap="sm" align="center">
                <WeatherIcon condition={condition} size={28} />
                <Text size="xl" fw={600}>
                  {formatTemperature(current?.temperature ?? 0, locale, temperatureUnit)}
                </Text>
                <Text size="sm" c="dimmed">
                  {t(`condition.${condition}`)}
                </Text>
              </Group>
              <Row
                label={t('metric.apparentTemperature')}
                value={formatTemperature(
                  current?.apparentTemperature ?? 0,
                  locale,
                  temperatureUnit,
                )}
              />
              <Row label={t('metric.humidity')} value={`${Math.round(current?.humidity ?? 0)} %`} />
              <Row
                label={t('metric.cloudCover')}
                value={`${Math.round(current?.cloudCover ?? 0)} %`}
              />
              <Row
                label={t('metric.precipitation')}
                value={`${(current?.precipitation ?? 0).toFixed(1)} mm`}
              />
              <Row
                label={t('metric.windSpeed')}
                value={`${Math.round(current?.windSpeed ?? 0)} km/h`}
              />
              <Row
                label={t('metric.radiation')}
                value={`${Math.round(current?.radiation ?? 0)} W/m²`}
              />
            </Stack>
          )}

          <Divider />

          <Stack gap="xs">
            <WeatherChart
              data={temperatureSeries}
              series={[{ name: 'temperature', color: 'orange.6', label: t('series.temperature') }]}
              title={t('chart.temperature')}
              formatValue={(value) => formatTemperature(value, locale, temperatureUnit)}
              markers={markers}
            />
          </Stack>

          <Stack gap="xs">
            <WeatherChart
              data={radiationSeries}
              series={[{ name: 'radiation', color: 'yellow.6', label: t('series.radiation') }]}
              title={t('chart.radiation')}
              formatValue={(value) => `${Math.round(value)} W/m²`}
              markers={markers}
              yAxisWidth={70}
            />
          </Stack>

          <Stack gap="xs">
            <WeatherChart
              data={windSeries}
              series={[
                { name: 'wind', color: 'cyan.6', label: t('series.wind') },
                { name: 'gust', color: 'cyan.9', label: t('series.gust'), dashed: true },
              ]}
              title={t('chart.wind')}
              formatValue={(value) => `${Math.round(value)} km/h`}
              withLegend
              markers={markers}
              yAxisWidth={64}
            />
          </Stack>

          <Stack gap="xs">
            <WeatherChart
              data={precipitationSeries}
              series={[
                { name: 'precipitation', color: 'blue.6', label: t('series.precipitation') },
              ]}
              title={t('chart.precipitation')}
              formatValue={(value) =>
                `${new Intl.NumberFormat(locale, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                }).format(value)} mm`
              }
              markers={markers}
              yAxisWidth={64}
            />
          </Stack>

          <Text size="xs" c="dimmed">
            {t('chart.hint')}
          </Text>
        </Stack>
      </Container>
    </ScrollArea>
  );
}
