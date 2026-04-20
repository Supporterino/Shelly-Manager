import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      // Vite turns each JSON into a lazy chunk — no HTTP fetch, works in Tauri
      (language: string, namespace: string) => import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr', 'es', 'zh', 'ja'],
    ns: ['common', 'devices', 'discovery', 'settings'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18next;
