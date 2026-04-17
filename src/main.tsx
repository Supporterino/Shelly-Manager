import './services/i18n' // initialize i18next — must be first
import { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18next from 'i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles/global.css'
import { AppLoader } from './components/common/AppLoader'
import { routeTree } from './routeTree.gen'

const hashHistory = createHashHistory()

const router = createRouter({
  routeTree,
  history: hashHistory,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 2,
    },
  },
})

const theme = createTheme({
  primaryColor: 'orange',
  defaultRadius: 'md',
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <I18nextProvider i18n={i18next}>
    <MantineProvider theme={theme}>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        {/*
          Suspense is required: the first locale chunk loads asynchronously.
          i18next-resources-to-backend uses dynamic import() which suspends the render tree.
        */}
        <Suspense fallback={<AppLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </QueryClientProvider>
    </MantineProvider>
  </I18nextProvider>
)
