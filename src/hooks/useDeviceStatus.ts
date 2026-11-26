import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ShellyClient } from '../services/shellyClient';
import { useAppStore } from '../store/appStore';
import { useWsStatusStore } from '../store/wsStatusStore';
import type { StoredDevice } from '../types/device';

export function useDeviceStatus(device: StoredDevice) {
  const isWsConnected = useWsStatusStore((s) => s.connected[device.id] ?? false);
  const setHttpConnected = useWsStatusStore((s) => s.setHttpConnected);
  const setStatus = useWsStatusStore((s) => s.setStatus);
  const pollingInterval = useAppStore((s) => s.preferences.pollingInterval) * 1000;

  const query = useQuery({
    queryKey: ['device', device.id, 'status'],
    queryFn: ({ signal }) => new ShellyClient(device).getStatus(signal),
    refetchInterval: isWsConnected ? false : pollingInterval,
    staleTime: 10_000,
    enabled: !isWsConnected,
  });

  // Mirror HTTP poll results into httpConnected so the dashboard filter can
  // treat devices reachable via HTTP as "online" — matching DeviceCard badge logic.
  // Also feed wsStatusStore.statuses when not on WS so useEnergyCollector records
  // power history for HTTP-only devices (e.g. APsystems EZ1).
  useEffect(() => {
    if (query.isSuccess) {
      setHttpConnected(device.id, true);
      if (!isWsConnected && query.data) {
        setStatus(device.id, query.data);
      }
    } else if (query.isError) {
      setHttpConnected(device.id, false);
    }
  }, [
    query.isSuccess,
    query.isError,
    query.data,
    isWsConnected,
    device.id,
    setHttpConnected,
    setStatus,
  ]);

  return query;
}
