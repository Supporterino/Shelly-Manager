import { useQuery } from '@tanstack/react-query';
import { ShellyClient } from '../services/shellyClient';
import type { StoredDevice } from '../types/device';

/**
 * Fetches static device identity via Shelly.GetDeviceInfo.
 * This data changes very rarely (only on firmware update or auth change),
 * so it is cached for 60 seconds and not auto-refetched on window focus.
 */
export function useDeviceInfo(device: StoredDevice) {
  return useQuery({
    queryKey: ['device', device.id, 'info'],
    queryFn: () => new ShellyClient(device).getDeviceInfo(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
