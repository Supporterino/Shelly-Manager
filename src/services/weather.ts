import { fetch } from '@tauri-apps/plugin-http';
import type {
  GeocodeResult,
  WeatherLocation,
  WeatherSample,
  WeatherSnapshot,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'shortwave_radiation',
].join(',');

// DWD ICON-D2 is natively available in 15 minute steps, which keeps the chart
// close to the "current" reading (also a 15 minute model step).
const SERIES_FIELDS = [
  'temperature_2m',
  'shortwave_radiation',
  'cloud_cover',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
].join(',');

/** Open-Meteo returns naive timestamps ("2026-11-26T13:00") that are UTC here. */
function parseUtcTime(value: string | undefined): number | null {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const ts = Date.parse(`${withSeconds}Z`);
  return Number.isFinite(ts) ? ts : null;
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Looks up places by name (Open-Meteo geocoding, backed by GeoNames). */
export async function searchLocations(
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: language.slice(0, 2),
    format: 'json',
  });
  const response = await fetch(`${GEOCODING_URL}?${params.toString()}`, {
    method: 'GET',
    signal: signal ?? AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }
  const body = (await response.json()) as { results?: GeocodeResult[] };
  return body.results ?? [];
}

/**
 * Fetches current conditions plus a 15 minute series covering yesterday, today
 * and tomorrow, so the charts are complete on the very first load and match the
 * resolution of the current values.
 */
export async function fetchWeather(
  location: WeatherLocation,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_FIELDS,
    minutely_15: SERIES_FIELDS,
    past_days: '1',
    forecast_days: '2',
    timezone: 'UTC',
  });

  const response = await fetch(`${FORECAST_URL}?${params.toString()}`, {
    method: 'GET',
    signal: signal ?? AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  const body = (await response.json()) as {
    current?: Record<string, unknown>;
    minutely_15?: { time?: string[] } & Record<string, Array<number | null>>;
  };

  const currentRaw = body.current;
  const seriesRaw = body.minutely_15;
  const currentTs = parseUtcTime(currentRaw?.time as string | undefined);

  if (!currentRaw || !seriesRaw?.time || currentTs === null) {
    throw new Error('Invalid weather response');
  }

  const samples: WeatherSample[] = [];
  const times = seriesRaw.time;

  for (let i = 0; i < times.length; i += 1) {
    const ts = parseUtcTime(times[i]);
    if (ts === null) continue;
    samples.push({
      ts,
      temperature: toNumber(seriesRaw.temperature_2m?.[i]),
      radiation: toNumber(seriesRaw.shortwave_radiation?.[i]),
      cloudCover: toNumber(seriesRaw.cloud_cover?.[i]),
      precipitation: toNumber(seriesRaw.precipitation?.[i]),
      windSpeed: toNumber(seriesRaw.wind_speed_10m?.[i]),
      windGust: toNumber(seriesRaw.wind_gusts_10m?.[i]),
      weatherCode: toNumber(seriesRaw.weather_code?.[i]),
    });
  }

  return {
    current: {
      ts: currentTs,
      temperature: toNumber(currentRaw.temperature_2m) ?? 0,
      apparentTemperature: toNumber(currentRaw.apparent_temperature) ?? 0,
      humidity: toNumber(currentRaw.relative_humidity_2m) ?? 0,
      precipitation: toNumber(currentRaw.precipitation) ?? 0,
      cloudCover: toNumber(currentRaw.cloud_cover) ?? 0,
      windSpeed: toNumber(currentRaw.wind_speed_10m) ?? 0,
      radiation: toNumber(currentRaw.shortwave_radiation) ?? 0,
      weatherCode: toNumber(currentRaw.weather_code) ?? 0,
    },
    samples,
    fetchedAt: Date.now(),
  };
}

export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'showers'
  | 'snowShowers'
  | 'thunderstorm';

/** Groups WMO weather codes into the conditions we actually render. */
export function conditionFromCode(code: number | null | undefined): WeatherCondition {
  if (code == null) return 'overcast';
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 80 && code <= 82) return 'showers';
  if (code === 85 || code === 86) return 'snowShowers';
  if (code === 71 || code === 73 || code === 75 || code === 77) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  if (code >= 61 && code <= 67) return 'rain';
  return 'overcast';
}
