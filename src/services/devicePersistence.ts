import { Store } from '@tauri-apps/plugin-store'
import type { StoredDevice } from '../types/device'

let _store: Awaited<ReturnType<typeof Store.load>> | null = null

async function getStore(): Promise<Awaited<ReturnType<typeof Store.load>>> {
  if (!_store) {
    _store = await Store.load('shelly-manager.json')
  }
  return _store
}

export async function loadDevices(): Promise<Record<string, StoredDevice>> {
  const store = await getStore()
  return (await store.get<Record<string, StoredDevice>>('devices')) ?? {}
}

export async function saveDevices(
  devices: Record<string, StoredDevice>
): Promise<void> {
  const store = await getStore()
  await store.set('devices', devices)
}

export async function loadPreferences<T>(
  key: string
): Promise<T | null> {
  const store = await getStore()
  return (await store.get<T>(key)) ?? null
}

export async function savePreferences<T>(
  key: string,
  value: T
): Promise<void> {
  const store = await getStore()
  await store.set(key, value)
}
