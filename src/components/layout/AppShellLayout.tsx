import { AppShell } from '@mantine/core'
import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { SidebarNav } from './SidebarNav'

interface AppShellLayoutProps {
  children: ReactNode
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <AppShell
      footer={{ height: 60 }}
      navbar={{
        width: 220,
        breakpoint: 'sm',
        collapsed: { mobile: true, desktop: false },
      }}
      padding="md"
    >
      <AppShell.Navbar>
        <SidebarNav />
      </AppShell.Navbar>
      <AppShell.Footer>
        <BottomNav />
      </AppShell.Footer>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
