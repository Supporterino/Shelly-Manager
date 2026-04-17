import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppShellLayout } from '../components/layout/AppShellLayout'
import { useDeviceStore } from '../store/deviceStore'
import { useAppStore } from '../store/appStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const hydrateDevices = useDeviceStore((s) => s.hydrate)
  const hydrateApp = useAppStore((s) => s.hydrate)

  useEffect(() => {
    // Hydrate both stores on mount — runs once
    hydrateDevices().catch(console.error)
    hydrateApp().catch(console.error)
  }, [hydrateDevices, hydrateApp])

  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  )
}
