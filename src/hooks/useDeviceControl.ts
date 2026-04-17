import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { ShellyClient } from '../services/shellyClient'
import { useDeviceStore } from '../store/deviceStore'
import type { LightSetParams, RGBSetParams, RGBWSetParams } from '../types/shelly'

function getClient(deviceId: string): ShellyClient {
  const device = useDeviceStore.getState().devices[deviceId]
  if (!device) throw new Error(`Device not found: ${deviceId}`)
  return new ShellyClient(device)
}

// ── Switch ──────────────────────────────────────────────────────────────────

export function useSwitchControl(deviceId: string, switchId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ on }: { on: boolean }) =>
      getClient(deviceId).switchSet(switchId, on),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })
}

// ── Dimmer ──────────────────────────────────────────────────────────────────

export function useDimmerControl(deviceId: string, lightId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Partial<LightSetParams>) =>
      getClient(deviceId).lightSet(lightId, { id: lightId, ...params }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })
}

// ── CCT (same as dimmer, adds temp param) ───────────────────────────────────

export const useCCTControl = useDimmerControl

// ── RGB ─────────────────────────────────────────────────────────────────────

export function useRGBControl(deviceId: string, rgbId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Partial<RGBSetParams>) =>
      getClient(deviceId).rgbSet(rgbId, { id: rgbId, ...params }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })
}

// ── RGBW ────────────────────────────────────────────────────────────────────

export function useRGBWControl(deviceId: string, rgbwId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Partial<RGBWSetParams>) =>
      getClient(deviceId).rgbwSet(rgbwId, { id: rgbwId, ...params }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })
}

// ── Cover ───────────────────────────────────────────────────────────────────

export function useCoverControl(deviceId: string, coverId: number) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['device', deviceId, 'status'] })
  const onError = (err: Error) =>
    notifications.show({ color: 'red', title: 'Error', message: err.message })

  const open = useMutation({
    mutationFn: () => getClient(deviceId).coverOpen(coverId),
    onSuccess: invalidate,
    onError,
  })
  const close = useMutation({
    mutationFn: () => getClient(deviceId).coverClose(coverId),
    onSuccess: invalidate,
    onError,
  })
  const stop = useMutation({
    mutationFn: () => getClient(deviceId).coverStop(coverId),
    onSuccess: invalidate,
    onError,
  })
  const goTo = useMutation({
    mutationFn: ({ pos }: { pos: number }) =>
      getClient(deviceId).coverGoToPosition(coverId, pos),
    onSuccess: invalidate,
    onError,
  })

  return { open, close, stop, goTo }
}
