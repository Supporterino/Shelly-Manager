import { useWsStatusStore } from '../store/wsStatusStore';

export function useWsStatus(deviceId: string) {
  const wsStatus = useWsStatusStore((s) => s.statuses[deviceId]);
  const isConnected = useWsStatusStore((s) => s.connected[deviceId] ?? false);
  return { wsStatus, isConnected };
}
