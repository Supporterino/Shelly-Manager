import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useMantineColorScheme } from '@mantine/core'
import { AppShellLayout } from '../components/layout/AppShellLayout'
import { useDeviceStore } from '../store/deviceStore'
import { useAppStore } from '../store/appStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const hydrateDevices = useDeviceStore((s) => s.hydrate)
  const hydrateApp = useAppStore((s) => s.hydrate)
  const isHydrated = useAppStore((s) => s.isHydrated)
  const theme = useAppStore((s) => s.preferences.theme)
  const { setColorScheme } = useMantineColorScheme()

  useEffect(() => {
    // Hydrate both stores on mount — runs once
    hydrateDevices().catch(console.error)
    hydrateApp().catch(console.error)
  }, [hydrateDevices, hydrateApp])

  // Apply stored color scheme as soon as the app store is hydrated from disk.
  // This ensures the correct theme is visible on first render, not only when
  // the Settings page is opened.
  useEffect(() => {
    if (isHydrated) {
      setColorScheme(theme === 'system' ? 'auto' : theme)
    }
  }, [isHydrated, theme, setColorScheme])

  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  )
}
