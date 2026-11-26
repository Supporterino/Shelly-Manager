import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '../services/weather';
import type { WeatherLocation } from '../types/weather';

/**
 * Weather changes on an hourly scale, so a 10 minute poll is plenty and keeps
 * the free Open-Meteo API (rate limit ~10k requests/day) far away from its cap.
 */
export function useWeather(location: WeatherLocation | null) {
  return useQuery({
    queryKey: ['weather', location?.latitude, location?.longitude],
    queryFn: ({ signal }) => {
      if (!location) throw new Error('No location configured');
      return fetchWeather(location, signal);
    },
    enabled: location != null,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}
