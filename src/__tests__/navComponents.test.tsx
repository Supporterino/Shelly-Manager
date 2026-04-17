/**
 * Tests for BottomNav and LanguageSelect components.
 * Phase 7.2 — PLAN.md §7.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../test/mocks/tauri'
import { renderWithProviders } from '../test/renderWithProviders'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockRouterState = vi.fn(() => ({ location: { pathname: '/' } }))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => mockRouterState(),
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    [key: string]: unknown
  }) => <a href={to} {...rest}>{children}</a>,
}))

const mockSetLocale = vi.fn()

vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ setLocale: mockSetLocale })
  ),
}))

import { BottomNav } from '../components/layout/BottomNav'
import { LanguageSelect } from '../components/settings/LanguageSelect'

// ── BottomNav ──────────────────────────────────────────────────────────────

describe('BottomNav', () => {
  beforeEach(() => mockRouterState.mockClear())

  it('renders all three navigation labels', () => {
    renderWithProviders(<BottomNav />)
    expect(screen.getByText('Devices')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the Devices tab when pathname is /', () => {
    mockRouterState.mockReturnValue({ location: { pathname: '/' } })
    renderWithProviders(<BottomNav />)
    // The active label gets c="orange"; inactive ones get c="dimmed".
    // Mantine renders c prop as data-c attribute on Text component.
    const devicesLabel = screen.getByText('Devices')
    // Active: c="orange" → not "dimmed"
    expect(devicesLabel).not.toHaveAttribute('data-c', 'dimmed')
  })

  it('highlights the Discover tab when pathname is /discover', () => {
    mockRouterState.mockReturnValue({ location: { pathname: '/discover' } })
    renderWithProviders(<BottomNav />)
    const devicesLabel = screen.getByText('Devices')
    const discoverLabel = screen.getByText('Discover')
    // Only Discover should be active
    expect(devicesLabel).not.toHaveAttribute('data-c', 'orange')
    expect(discoverLabel).not.toHaveAttribute('data-c', 'dimmed')
  })

  it('highlights the Settings tab when pathname is /settings', () => {
    mockRouterState.mockReturnValue({ location: { pathname: '/settings' } })
    renderWithProviders(<BottomNav />)
    const settingsLabel = screen.getByText('Settings')
    expect(settingsLabel).not.toHaveAttribute('data-c', 'dimmed')
  })

  it('renders nav links as anchor elements', () => {
    renderWithProviders(<BottomNav />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
  })
})

// ── LanguageSelect ─────────────────────────────────────────────────────────

describe('LanguageSelect', () => {
  beforeEach(() => mockSetLocale.mockReset())

  it('renders the select component', () => {
    renderWithProviders(<LanguageSelect />)
    // The select input is a combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays the current language (English) as the selected value', () => {
    renderWithProviders(<LanguageSelect />)
    // The combobox input should have the value "English" for locale "en"
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveValue('English')
  })

  it('calls setLocale when a different language is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelect />)

    const combobox = screen.getByRole('combobox')
    // Open the dropdown
    await user.click(combobox)

    // Select Deutsch
    const deutschOption = await screen.findByText('Deutsch')
    await user.click(deutschOption)

    expect(mockSetLocale).toHaveBeenCalledWith('de')
  })
})
