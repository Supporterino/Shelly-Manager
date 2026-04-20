import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { loadDevices, saveDevices } from '../services/devicePersistence';
import type { StoredDevice } from '../types/device';

interface DeviceStore {
  devices: Record<string, StoredDevice>;
  isHydrated: boolean;
  addDevice: (device: StoredDevice) => void;
  updateDevice: (id: string, patch: Partial<StoredDevice>) => void;
  removeDevice: (id: string) => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>()(
  subscribeWithSelector((set, get) => ({
    devices: {},
    isHydrated: false,

    addDevice: (device) => {
      set((state) => ({
        devices: { ...state.devices, [device.id]: device },
      }));
    },

    updateDevice: (id, patch) => {
      set((state) => {
        const existing = state.devices[id];
        if (!existing) return state;
        return {
          devices: {
            ...state.devices,
            [id]: { ...existing, ...patch },
          },
        };
      });
    },

    removeDevice: (id) => {
      set((state) => {
        const { [id]: _removed, ...rest } = state.devices;
        return { devices: rest };
      });
    },

    hydrate: async () => {
      const devices = await loadDevices();
      set({ devices, isHydrated: true });
    },

    persist: async () => {
      await saveDevices(get().devices);
    },
  })),
);

// Auto-persist on every write after hydration
useDeviceStore.subscribe(
  (state) => state.devices,
  (_devices) => {
    if (useDeviceStore.getState().isHydrated) {
      useDeviceStore.getState().persist().catch(console.error);
    }
  },
);
