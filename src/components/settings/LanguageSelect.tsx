import { Select } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/appStore'

const SUPPORTED_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

export function LanguageSelect() {
  const { i18n } = useTranslation()
  const setLocale = useAppStore((s) => s.setLocale)

  return (
    <Select
      data={SUPPORTED_LOCALES}
      value={i18n.language}
      onChange={(val) => void (val && setLocale(val))}
      allowDeselect={false}
      w={180}
    />
  )
}
