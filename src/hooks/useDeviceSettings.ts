import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ShellyClient } from '../services/shellyClient';
import { useDeviceStore } from '../store/deviceStore';
import type { EthConfig, SysConfig, WiFiConfig, WiFiSTA1Config } from '../types/shelly';

function getClient(deviceId: string): ShellyClient {
  const device = useDeviceStore.getState().devices[deviceId];
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  return new ShellyClient(device);
}

// ── System ──────────────────────────────────────────────────────────────────

export function useSysConfig(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'sys', 'config'],
    queryFn: () => getClient(deviceId).sysGetConfig(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSysSetConfig(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<SysConfig>) => getClient(deviceId).sysSetConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'sys', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'info'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useDetectLocation(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).detectLocation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'sys', 'config'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useListTimezones(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'timezones'],
    queryFn: () => getClient(deviceId).listTimezones(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSetTime(deviceId: string) {
  return useMutation({
    mutationFn: (time: string) => getClient(deviceId).sysSetTime(time),
    onSuccess: () => notifications.show({ color: 'green', message: 'Device time synchronized' }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── WiFi ────────────────────────────────────────────────────────────────────

export function useWiFiConfig(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'wifi', 'config'],
    queryFn: () => getClient(deviceId).wifiGetConfig(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useWiFiSetConfig(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: {
      sta?: Partial<WiFiConfig>;
      sta1?: Partial<WiFiSTA1Config>;
      ap?: Partial<{ ssid: string | null; pass: string | null; enable: boolean }>;
    }) => getClient(deviceId).wifiSetConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'wifi', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'wifi', 'status'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useWiFiStatus(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'wifi', 'status'],
    queryFn: () => getClient(deviceId).wifiGetStatus(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useWiFiScan(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'wifi', 'scan'],
    queryFn: async () => {
      const client = getClient(deviceId);
      const startTime = Date.now();
      const timeout = 30_000;

      while (Date.now() - startTime < timeout) {
        const result = await client.wifiScan();
        if (result.results && result.results.length > 0) {
          return result.results;
        }
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      throw new Error('WiFi scan timed out');
    },
    enabled: false, // Must be triggered manually
    staleTime: 0,
  });
}

export function useAPClients(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'wifi', 'ap_clients'],
    queryFn: () => getClient(deviceId).wifiListAPClients(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// ── Ethernet ────────────────────────────────────────────────────────────────

export function useEthConfig(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'eth', 'config'],
    queryFn: () => getClient(deviceId).ethGetConfig(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useEthSetConfig(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<EthConfig>) => getClient(deviceId).ethSetConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'eth', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'eth', 'status'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useEthStatus(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'eth', 'status'],
    queryFn: () => getClient(deviceId).ethGetStatus(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// ── Device Profile ──────────────────────────────────────────────────────────

export function useListProfiles(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'profiles'],
    queryFn: () => getClient(deviceId).listProfiles(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSetProfile(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => getClient(deviceId).setProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'profiles'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'info'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] });
      notifications.show({ color: 'green', message: 'Profile switched successfully' });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Webhook & Schedule (for profile consequence count) ──────────────────────

export function useWebhookList(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'webhooks'],
    queryFn: async () => {
      const client = getClient(deviceId);
      return client.call<{ hooks: Array<{ id: number; enable: boolean }> }>('Webhook.List');
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useScheduleListForCount(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'schedules', 'count'],
    queryFn: async () => {
      const client = getClient(deviceId);
      return client.scheduleList();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
