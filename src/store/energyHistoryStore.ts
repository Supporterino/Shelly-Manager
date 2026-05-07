import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { loadEnergyHistory, saveEnergyHistory } from '../services/energyPersistence';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/** Stable empty array reference to avoid Zustand selector infinite loops. */
export const EMPTY_ARRAY: EnergyReading[] = [];

export interface EnergyReading {
  ts: number;
  apower?: number;
}

/** deviceId → componentKey → readings */
export type EnergyHistory = Record<string, Record<string, EnergyReading[]>>;

interface EnergyHistoryStore {
  history: EnergyHistory;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addReading: (
    deviceId: string,
    componentType: string,
    componentId: number,
    reading: EnergyReading,
  ) => void;
  getReadings: (deviceId: string, componentType: string, componentId: number) => EnergyReading[];
  persist: () => Promise<void>;
}

function pruneOld(entries: EnergyReading[]): EnergyReading[] {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS;
  return entries.filter((e) => e.ts >= cutoff);
}

function makeKey(componentType: string, componentId: number): string {
  return `${componentType}:${componentId}`;
}

export const useEnergyHistoryStore = create<EnergyHistoryStore>()(
  subscribeWithSelector((set, get) => ({
    history: {},
    isHydrated: false,

    hydrate: async () => {
      const history = await loadEnergyHistory();
      // Prune on load in case the app was closed for a while
      const pruned: EnergyHistory = {};
      for (const [deviceId, components] of Object.entries(history)) {
        pruned[deviceId] = {};
        for (const [key, readings] of Object.entries(components)) {
          pruned[deviceId][key] = pruneOld(readings);
        }
      }
      set({ history: pruned, isHydrated: true });
    },

    addReading: (deviceId, componentType, componentId, reading) => {
      set((state) => {
        const key = makeKey(componentType, componentId);
        const deviceHistory = state.history[deviceId] ?? {};
        const existing = deviceHistory[key] ?? EMPTY_ARRAY;
        const updated = pruneOld([...existing, reading]);
        return {
          history: {
            ...state.history,
            [deviceId]: {
              ...deviceHistory,
              [key]: updated,
            },
          },
        };
      });
    },

    getReadings: (deviceId, componentType, componentId) => {
      const key = makeKey(componentType, componentId);
      return get().history[deviceId]?.[key] ?? EMPTY_ARRAY;
    },

    persist: async () => {
      await saveEnergyHistory(get().history);
    },
  })),
);

// Auto-persist on every write after hydration
useEnergyHistoryStore.subscribe(
  (state) => state.history,
  (_history) => {
    if (useEnergyHistoryStore.getState().isHydrated) {
      useEnergyHistoryStore.getState().persist().catch(console.error);
    }
  },
);
