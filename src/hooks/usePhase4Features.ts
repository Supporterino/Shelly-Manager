import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShellyClient } from '../services/shellyClient';
import { useDeviceStore } from '../store/deviceStore';
import { computeHa1 } from '../utils/auth';

function getClient(deviceId: string): ShellyClient {
  const device = useDeviceStore.getState().devices[deviceId];
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  return new ShellyClient(device);
}

// ── Auth Management ─────────────────────────────────────────────────────────

export function useSetAuth(deviceId: string) {
  const queryClient = useQueryClient();
  const updateDevice = useDeviceStore((s) => s.updateDevice);

  return useMutation({
    mutationFn: async ({ enabled, password }: { enabled: boolean; password?: string }) => {
      const device = useDeviceStore.getState().devices[deviceId];
      if (!device) throw new Error('Device not found');

      const client = new ShellyClient(device);

      if (!enabled) {
        // Disable auth: send empty ha1
        await client.setAuth('admin', device.id, '');
        updateDevice(deviceId, { authHa1: undefined, auth: undefined });
        return { enabled: false };
      }

      if (!password) {
        // If we have a stored ha1, use it to re-enable
        if (device.authHa1) {
          await client.setAuth('admin', device.authHa1.realm, device.authHa1.ha1);
          return { enabled: true };
        }
        throw new Error('Password required to enable authentication');
      }

      // Compute ha1 from password. Use device ID as realm fallback.
      const realm = device.id;
      const ha1 = await computeHa1(realm, password);
      await client.setAuth('admin', realm, ha1);
      updateDevice(deviceId, { authHa1: { realm, ha1 }, auth: { username: 'admin', password } });
      return { enabled: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'info'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] });
      notifications.show({ color: 'green', message: 'Authentication settings updated' });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Method Discovery ────────────────────────────────────────────────────────

export function useListMethods(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'methods'],
    queryFn: () => getClient(deviceId).listMethods(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ── New Sensor Status Queries ───────────────────────────────────────────────

export function usePresenceStatus(deviceId: string, id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'presence', id, 'status'],
    queryFn: () => getClient(deviceId).presenceGetStatus(id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function usePresenceZoneStatus(deviceId: string, id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'presence_zone', id, 'status'],
    queryFn: () => getClient(deviceId).presenceZoneGetStatus(id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useBTHomeStatus(deviceId: string, id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'bthome', id, 'status'],
    queryFn: () => getClient(deviceId).bthomeGetStatus(id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useHTTPClientStatus(deviceId: string, id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'http', id, 'status'],
    queryFn: () => getClient(deviceId).httpGetStatus(id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useGenericComponentStatus(deviceId: string, component: string, id: number) {
  return useQuery({
    queryKey: ['device', deviceId, component, id, 'status'],
    queryFn: () => getClient(deviceId).genericGetStatus(component, id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
