import { AppShell } from '@mantine/core';
import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';

interface AppShellLayoutProps {
  children: ReactNode;
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
      styles={{
        main: {
          minHeight: 'unset',
          height: 'calc(100dvh - var(--app-shell-footer-offset, 3.75rem))',
          overflow: 'hidden',
          paddingBottom: 'var(--app-shell-padding)',
        },
      }}
    >
      <AppShell.Navbar>
        <SidebarNav />
      </AppShell.Navbar>
      <AppShell.Footer>
        <BottomNav />
      </AppShell.Footer>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
