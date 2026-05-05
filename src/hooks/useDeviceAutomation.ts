import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ShellyClient } from '../services/shellyClient';
import { useDeviceStore } from '../store/deviceStore';
import type { WebhookHook } from '../types/shelly';

function getClient(deviceId: string): ShellyClient {
  const device = useDeviceStore.getState().devices[deviceId];
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  return new ShellyClient(device);
}

// ── Webhooks ────────────────────────────────────────────────────────────────

export function useWebhookList(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'webhooks'],
    queryFn: () => getClient(deviceId).webhookList(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useWebhookSupportedEvents(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'webhooks', 'events'],
    queryFn: () => getClient(deviceId).webhookListAllSupported(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useWebhookCreate(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Omit<WebhookHook, 'id'>) => getClient(deviceId).webhookCreate(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'webhooks'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useWebhookUpdate(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }: { id: number; config: Partial<Omit<WebhookHook, 'id'>> }) =>
      getClient(deviceId).webhookUpdate(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'webhooks'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useWebhookDelete(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => getClient(deviceId).webhookDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'webhooks'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useWebhookDeleteAll(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).webhookDeleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'webhooks'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── KVS ─────────────────────────────────────────────────────────────────────

export function useKVSList(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'kvs'],
    queryFn: () => getClient(deviceId).kvsList(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useKVSGet(deviceId: string, key: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'kvs', key],
    queryFn: () => getClient(deviceId).kvsGet(key),
    enabled: key.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useKVSSet(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, etag }: { key: string; value: unknown; etag?: string }) =>
      getClient(deviceId).kvsSet(key, value, etag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'kvs'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useKVSDelete(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => getClient(deviceId).kvsDelete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'kvs'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Scripts ─────────────────────────────────────────────────────────────────

export function useScriptList(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId, 'scripts'],
    queryFn: () => getClient(deviceId).scriptList(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useScriptCreate(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => getClient(deviceId).scriptCreate(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'scripts'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScriptDelete(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => getClient(deviceId).scriptDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'scripts'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScriptStart(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => getClient(deviceId).scriptStart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'scripts'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScriptStop(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => getClient(deviceId).scriptStop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'scripts'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScriptGetCode(deviceId: string, scriptId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'scripts', scriptId, 'code'],
    queryFn: () => getClient(deviceId).scriptGetCode(scriptId),
    enabled: scriptId >= 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useScriptPutCode(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      getClient(deviceId).scriptPutCode(id, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'scripts'] });
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'scripts'],
      });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScriptEval(deviceId: string) {
  return useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      getClient(deviceId).scriptEval(id, code),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}
