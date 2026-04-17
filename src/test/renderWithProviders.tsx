/**
 * Test helper: wraps a component in all required providers.
 * Uses a synchronous i18n instance (static import-based) so tests never suspend.
 *
 * PLAN.md §7.3
 */
import { type ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

// Static JSON imports — no dynamic import(), no Suspense needed in tests
import enCommon from '../locales/en/common.json'
import enDevices from '../locales/en/devices.json'
import enDiscovery from '../locales/en/discovery.json'
import enSettings from '../locales/en/settings.json'

// Create a synchronous test i18n instance
const testI18n = i18next.createInstance()
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      common:    enCommon,
      devices:   enDevices,
      discovery: enDiscovery,
      settings:  enSettings,
    },
  },
  interpolation: { escapeValue: false },
})

interface RenderOptions {
  lng?: string
}

export function renderWithProviders(ui: ReactElement, { lng = 'en' }: RenderOptions = {}) {
  void testI18n.changeLanguage(lng)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <I18nextProvider i18n={testI18n}>
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      </MantineProvider>
    </I18nextProvider>
  )
}

export { testI18n }
