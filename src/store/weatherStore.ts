import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { loadPreferences, savePreferences } from '../services/devicePersistence';
import type { WeatherLocation } from '../types/weather';

const STORAGE_KEY = 'weatherLocation';

interface WeatherStore {
  location: WeatherLocation | null;
  isHydrated: boolean;
  setLocation: (location: WeatherLocation | null) => Promise<void>;
  hydrate: () => Promise<void>;
}

/**
 * The location lives in the same shellman.json store as devices and
 * preferences, but in its own slice so a weather location never shows up as a
 * device in the dashboard list or the discovery flow.
 */
export const useWeatherStore = create<WeatherStore>()(
  subscribeWithSelector((set) => ({
    location: null,
    isHydrated: false,

    setLocation: async (location) => {
      set({ location });
      await savePreferences<WeatherLocation | null>(STORAGE_KEY, location);
    },

    hydrate: async () => {
      const saved = await loadPreferences<WeatherLocation | null>(STORAGE_KEY);
      set({ location: saved ?? null, isHydrated: true });
    },
  })),
);
