import { Alert, Badge, Button, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertCircle, IconMapPin, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchLocations } from '../../services/weather';
import { useWeatherStore } from '../../store/weatherStore';
import type { GeocodeResult, WeatherLocation } from '../../types/weather';

/**
 * Secondary line for a place: district · state · country. Postal codes are only
 * present for some places in GeoNames, so they cannot be the main differentiator
 * (two "Kirchheim" in Bavaria both have none) — the district always is.
 */
function describe(location: WeatherLocation): string {
  const name = location.name.toLowerCase();
  const district = location.admin3;
  // Cities often repeat their own name as the district ("München, Kreisfreie
  // Stadt München") — that adds noise instead of information.
  const showDistrict =
    district != null &&
    !district.toLowerCase().startsWith(name) &&
    !name.startsWith(district.toLowerCase());

  return [showDistrict ? district : undefined, location.admin1, location.country]
    .filter(Boolean)
    .join(' · ');
}

export function WeatherLocationSection() {
  const { t, i18n } = useTranslation('weather');
  const location = useWeatherStore((s) => s.location);
  const setLocation = useWeatherStore((s) => s.setLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await searchLocations(term, i18n.language));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(result: GeocodeResult) {
    await setLocation({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
      admin1: result.admin1,
      admin2: result.admin2,
      admin3: result.admin3,
      postcode: result.postcodes?.[0],
    });
    setResults(null);
    setQuery('');
  }

  return (
    <Stack gap="xs">
      {location && (
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" align="center" style={{ minWidth: 0 }}>
            <IconMapPin size={16} />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="sm">{location.name}</Text>
                {location.postcode && (
                  <Badge size="xs" variant="light" color="gray">
                    {location.postcode}
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                {describe(location)}
              </Text>
            </Stack>
          </Group>
          <Button
            variant="subtle"
            color="red"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={() => void setLocation(null)}
          >
            {t('settings.remove')}
          </Button>
        </Group>
      )}

      <form onSubmit={handleSearch}>
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <TextInput
            label={location ? t('settings.change') : t('settings.label')}
            placeholder={t('settings.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" variant="light" disabled={searching || query.trim().length < 2}>
            {searching ? <Loader size={14} /> : t('settings.search')}
          </Button>
        </Group>
      </form>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      {results != null && results.length === 0 && (
        <Text size="sm" c="dimmed">
          {t('settings.noResults')}
        </Text>
      )}

      {results != null && results.length > 0 && (
        <Stack gap={4}>
          {results.map((result) => (
            <Button
              key={result.id}
              variant="light"
              size="xs"
              justify="flex-start"
              leftSection={<IconMapPin size={14} />}
              onClick={() => void handlePick(result)}
              h="auto"
              py={6}
            >
              <Stack gap={0} align="flex-start">
                <Group gap={6} wrap="nowrap">
                  <Text size="xs" fw={600}>
                    {result.name}
                  </Text>
                  {result.postcodes?.[0] && (
                    <Badge size="xs" variant="light" color="gray">
                      {result.postcodes[0]}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed" fw={400}>
                  {describe(result)}
                </Text>
              </Stack>
            </Button>
          ))}
        </Stack>
      )}

      <Text size="xs" c="dimmed">
        {t('settings.hint')}
      </Text>
    </Stack>
  );
}
