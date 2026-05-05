import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShellyClient } from '../services/shellyClient';
import { useDeviceStore } from '../store/deviceStore';
import type {
  CoverConfig,
  InputConfig,
  LightConfig,
  LightSetParams,
  RGBCCTConfig,
  RGBCCTSetParams,
  RGBConfig,
  RGBSetParams,
  RGBWConfig,
  RGBWSetParams,
  ScheduleJob,
  SwitchConfig,
} from '../types/shelly';

function getClient(deviceId: string): ShellyClient {
  const device = useDeviceStore.getState().devices[deviceId];
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  return new ShellyClient(device);
}

// ── Switch ──────────────────────────────────────────────────────────────────

export function useSwitchControl(deviceId: string, switchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ on }: { on: boolean }) => getClient(deviceId).switchSet(switchId, on),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Dimmer ──────────────────────────────────────────────────────────────────

export function useDimmerControl(deviceId: string, lightId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<LightSetParams>) =>
      getClient(deviceId).lightSet(lightId, { id: lightId, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── CCT (same as dimmer, adds temp param) ───────────────────────────────────

export const useCCTControl = useDimmerControl;

// ── RGB ─────────────────────────────────────────────────────────────────────

export function useRGBControl(deviceId: string, rgbId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<RGBSetParams>) =>
      getClient(deviceId).rgbSet(rgbId, { id: rgbId, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── RGBW ────────────────────────────────────────────────────────────────────

export function useRGBWControl(deviceId: string, rgbwId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<RGBWSetParams>) =>
      getClient(deviceId).rgbwSet(rgbwId, { id: rgbwId, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Cover ───────────────────────────────────────────────────────────────────

export function useCoverControl(deviceId: string, coverId: number) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] });
  const onError = (err: Error) =>
    notifications.show({ color: 'red', title: 'Error', message: err.message });

  const open = useMutation({
    mutationFn: () => getClient(deviceId).coverOpen(coverId),
    onSuccess: invalidate,
    onError,
  });
  const close = useMutation({
    mutationFn: () => getClient(deviceId).coverClose(coverId),
    onSuccess: invalidate,
    onError,
  });
  const stop = useMutation({
    mutationFn: () => getClient(deviceId).coverStop(coverId),
    onSuccess: invalidate,
    onError,
  });
  const goTo = useMutation({
    mutationFn: ({ pos }: { pos: number }) => getClient(deviceId).coverGoToPosition(coverId, pos),
    onSuccess: invalidate,
    onError,
  });

  return { open, close, stop, goTo };
}

// ── Cover Calibrate ──────────────────────────────────────────────────────────

export function useCoverCalibrate(deviceId: string, coverId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).coverCalibrate(coverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Input Config ─────────────────────────────────────────────────────────────

export function useInputConfig(deviceId: string, inputId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'input', inputId, 'config'],
    queryFn: () => getClient(deviceId).inputGetConfig(inputId),
    staleTime: 60_000,
  });
}

export function useInputSetConfig(deviceId: string, inputId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<InputConfig, 'id'>>) =>
      getClient(deviceId).inputSetConfig(inputId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'input', inputId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Switch Config ─────────────────────────────────────────────────────────────

export function useSwitchConfig(deviceId: string, switchId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'switch', switchId, 'config'],
    queryFn: () => getClient(deviceId).switchGetConfig(switchId),
    staleTime: 60_000,
  });
}

export function useSwitchSetConfig(deviceId: string, switchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<SwitchConfig, 'id'>>) =>
      getClient(deviceId).switchSetConfig(switchId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'switch', switchId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Cover Config ─────────────────────────────────────────────────────────────

export function useCoverConfig(deviceId: string, coverId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'cover', coverId, 'config'],
    queryFn: () => getClient(deviceId).coverGetConfig(coverId),
    staleTime: 60_000,
  });
}

export function useCoverSetConfig(deviceId: string, coverId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<CoverConfig, 'id'>>) =>
      getClient(deviceId).coverSetConfig(coverId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'cover', coverId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Light Config ─────────────────────────────────────────────────────────────

export function useLightConfig(deviceId: string, lightId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'light', lightId, 'config'],
    queryFn: () => getClient(deviceId).lightGetConfig(lightId),
    staleTime: 60_000,
  });
}

export function useLightSetConfig(deviceId: string, lightId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<LightConfig, 'id'>>) =>
      getClient(deviceId).lightSetConfig(lightId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'light', lightId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── RGB Config ───────────────────────────────────────────────────────────────

export function useRgbConfig(deviceId: string, rgbId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'rgb', rgbId, 'config'],
    queryFn: () => getClient(deviceId).rgbGetConfig(rgbId),
    staleTime: 60_000,
  });
}

export function useRgbSetConfig(deviceId: string, rgbId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<RGBConfig, 'id'>>) =>
      getClient(deviceId).rgbSetConfig(rgbId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'rgb', rgbId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── RGBW Config ──────────────────────────────────────────────────────────────

export function useRgbwConfig(deviceId: string, rgbwId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'rgbw', rgbwId, 'config'],
    queryFn: () => getClient(deviceId).rgbwGetConfig(rgbwId),
    staleTime: 60_000,
  });
}

export function useRgbwSetConfig(deviceId: string, rgbwId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<RGBWConfig, 'id'>>) =>
      getClient(deviceId).rgbwSetConfig(rgbwId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'rgbw', rgbwId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── RGBCCT ─────────────────────────────────────────────────────────────────

export function useRGBCCTControl(deviceId: string, rgbccctId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<RGBCCTSetParams>) =>
      getClient(deviceId).rgbccctSet(rgbccctId, { id: rgbccctId, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useRgbccctConfig(deviceId: string, rgbccctId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'rgbccct', rgbccctId, 'config'],
    queryFn: () => getClient(deviceId).rgbccctGetConfig(rgbccctId),
    staleTime: 60_000,
  });
}

export function useRgbccctSetConfig(deviceId: string, rgbccctId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Omit<RGBCCTConfig, 'id'>>) =>
      getClient(deviceId).rgbccctSetConfig(rgbccctId, config),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['device', deviceId, 'rgbccct', rgbccctId, 'config'],
      }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Schedule Update / DeleteAll ──────────────────────────────────────────────

export function useScheduleUpdate(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }: { id: number; config: Partial<Omit<ScheduleJob, 'id'>> }) =>
      getClient(deviceId).scheduleUpdate(id, config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'schedules'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useScheduleDeleteAll(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).scheduleDeleteAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'schedules'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

// ── Energy Data ──────────────────────────────────────────────────────────────

export function useEMDataStatus(deviceId: string, emId: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'em', emId, 'data'],
    queryFn: () => getClient(deviceId).emDataGetStatus(emId),
    staleTime: 30_000,
  });
}

export function useEMDataResetTotals(deviceId: string, emId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).emDataResetTotals(emId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'em', emId, 'data'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function useEM1DataStatus(deviceId: string, em1Id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'em1', em1Id, 'data'],
    queryFn: () => getClient(deviceId).em1DataGetStatus(em1Id),
    staleTime: 30_000,
  });
}

export function useEM1DataResetTotals(deviceId: string, em1Id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).em1DataResetTotals(em1Id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'em1', em1Id, 'data'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}

export function usePM1DataStatus(deviceId: string, pm1Id: number) {
  return useQuery({
    queryKey: ['device', deviceId, 'pm1', pm1Id, 'data'],
    queryFn: () => getClient(deviceId).pm1DataGetStatus(pm1Id),
    staleTime: 30_000,
  });
}

export function usePM1DataResetTotals(deviceId: string, pm1Id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getClient(deviceId).pm1DataResetTotals(pm1Id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'pm1', pm1Id, 'data'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });
}
