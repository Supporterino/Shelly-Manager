import { Store } from '@tauri-apps/plugin-store';
import type { EnergyHistory } from '../store/energyHistoryStore';

let _store: Awaited<ReturnType<typeof Store.load>> | null = null;

async function getStore(): Promise<Awaited<ReturnType<typeof Store.load>>> {
  if (!_store) {
    _store = await Store.load('energy-history.json');
  }
  return _store;
}

export async function loadEnergyHistory(): Promise<EnergyHistory> {
  const store = await getStore();
  return (await store.get<EnergyHistory>('history')) ?? {};
}

export async function saveEnergyHistory(history: EnergyHistory): Promise<void> {
  const store = await getStore();
  await store.set('history', history);
}
