import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';

const SUPPORTED_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

export function LanguageSelect() {
  const { i18n } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);
  // Use the persisted locale from the store as the primary reactive value.
  // Fall back to the browser-detected language (normalized to bare code, e.g.
  // 'en-US' → 'en') so the select always shows a valid selection even before
  // the user explicitly picks a language.
  const storedLocale = useAppStore((s) => s.preferences.locale);
  const value = storedLocale || i18n.language.split('-')[0];

  return (
    <Select
      data={SUPPORTED_LOCALES}
      value={value}
      onChange={(val) => void (val && setLocale(val))}
      allowDeselect={false}
      w={180}
    />
  );
}
