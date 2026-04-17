import { useQuery } from '@tanstack/react-query'
import { ShellyClient } from '../services/shellyClient'
import type { StoredDevice } from '../types/device'
import { useWsStatusStore } from '../store/wsStatusStore'
import { useAppStore } from '../store/appStore'

export function useDeviceStatus(device: StoredDevice) {
  const isWsConnected = useWsStatusStore((s) => s.connected[device.id] ?? false)
  const pollingInterval = useAppStore((s) => s.preferences.pollingInterval) * 1000

  return useQuery({
    queryKey: ['device', device.id, 'status'],
    queryFn: ({ signal }) => new ShellyClient(device).getStatus(signal),
    refetchInterval: isWsConnected ? false : pollingInterval,
    staleTime: 10_000,
    enabled: !isWsConnected,
  })
}
