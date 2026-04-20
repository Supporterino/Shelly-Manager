import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ShellyClient } from '../services/shellyClient'
import type { StoredDevice } from '../types/device'
import { useWsStatusStore } from '../store/wsStatusStore'
import { useAppStore } from '../store/appStore'

export function useDeviceStatus(device: StoredDevice) {
  const isWsConnected = useWsStatusStore((s) => s.connected[device.id] ?? false)
  const setHttpConnected = useWsStatusStore((s) => s.setHttpConnected)
  const pollingInterval = useAppStore((s) => s.preferences.pollingInterval) * 1000

  const query = useQuery({
    queryKey: ['device', device.id, 'status'],
    queryFn: ({ signal }) => new ShellyClient(device).getStatus(signal),
    refetchInterval: isWsConnected ? false : pollingInterval,
    staleTime: 10_000,
    enabled: !isWsConnected,
  })

  // Mirror HTTP poll results into httpConnected so the dashboard filter can
  // treat devices reachable via HTTP as "online" — matching DeviceCard badge logic.
  // Uses a separate store field so WS connection state is never affected.
  useEffect(() => {
    if (query.isSuccess) setHttpConnected(device.id, true)
    else if (query.isError) setHttpConnected(device.id, false)
  }, [query.isSuccess, query.isError, device.id, setHttpConnected])

  return query
}
