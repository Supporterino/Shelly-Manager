import i18next from 'i18next';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { loadPreferences, savePreferences } from '../services/devicePersistence';

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  locale: string; // e.g. 'en', 'de', 'fr' — empty string = follow browser
  pollingInterval: number; // seconds (10–120)
  temperatureUnit: 'C' | 'F';
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  locale: '',
  pollingInterval: 30,
  temperatureUnit: 'C',
};

interface AppStore {
  preferences: AppPreferences;
  isHydrated: boolean;
  setTheme: (theme: AppPreferences['theme']) => Promise<void>;
  setLocale: (locale: string) => Promise<void>;
  setPollingInterval: (interval: number) => Promise<void>;
  setTemperatureUnit: (unit: 'C' | 'F') => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    preferences: { ...DEFAULT_PREFERENCES },
    isHydrated: false,

    setTheme: async (theme) => {
      set((state) => ({
        preferences: { ...state.preferences, theme },
      }));
      await get().persist();
    },

    setLocale: async (locale) => {
      await i18next.changeLanguage(locale || undefined);
      set((state) => ({
        preferences: { ...state.preferences, locale },
      }));
      await get().persist();
    },

    setPollingInterval: async (pollingInterval) => {
      set((state) => ({
        preferences: { ...state.preferences, pollingInterval },
      }));
      await get().persist();
    },

    setTemperatureUnit: async (temperatureUnit) => {
      set((state) => ({
        preferences: { ...state.preferences, temperatureUnit },
      }));
      await get().persist();
    },

    hydrate: async () => {
      const saved = await loadPreferences<AppPreferences>('preferences');
      const preferences = saved ? { ...DEFAULT_PREFERENCES, ...saved } : { ...DEFAULT_PREFERENCES };
      set({ preferences, isHydrated: true });
      // Restore persisted locale if set
      if (preferences.locale) {
        await i18next.changeLanguage(preferences.locale);
      }
    },

    persist: async () => {
      await savePreferences('preferences', get().preferences);
    },
  })),
);
