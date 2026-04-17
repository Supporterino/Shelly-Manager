/**
 * Tests for ManualAddForm and DiscoveryProgress components.
 * Phase 7.2 — PLAN.md §7.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../test/mocks/tauri'
import { renderWithProviders } from '../test/renderWithProviders'
import type { DiscoveredHost } from '../types/discovery'

const mockVerifyManualHost = vi.fn()

vi.mock('../services/discovery', () => ({
  verifyManualHost: (...args: unknown[]) => mockVerifyManualHost(...args),
  startMdnsDiscovery: vi.fn(),
  startSubnetScan: vi.fn(),
}))

import { ManualAddForm } from '../components/discovery/ManualAddForm'
import { DiscoveryProgress } from '../components/discovery/DiscoveryProgress'

describe('ManualAddForm', () => {
  beforeEach(() => mockVerifyManualHost.mockReset())

  it('renders the IP address input', () => {
    renderWithProviders(<ManualAddForm onDeviceFound={vi.fn()} />)
    expect(screen.getByLabelText(/IP Address/i)).toBeInTheDocument()
  })

  it('shows validation error for an invalid IP address', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ManualAddForm onDeviceFound={vi.fn()} />)

    const ipInput = screen.getByLabelText(/IP Address/i)
    await user.type(ipInput, 'not-an-ip')

    const submit = screen.getByRole('button', { name: /add device/i })
    await user.click(submit)

    await waitFor(() => {
      // Invalid IP → shows tc('errors.unknown') = "An unexpected error occurred."
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
    })
  })

  it('shows network error when verifyManualHost returns null', async () => {
    const user = userEvent.setup()
    mockVerifyManualHost.mockResolvedValue(null)

    renderWithProviders(<ManualAddForm onDeviceFound={vi.fn()} />)

    const ipInput = screen.getByLabelText(/IP Address/i)
    await user.type(ipInput, '192.168.1.100')

    const submit = screen.getByRole('button', { name: /add device/i })
    await user.click(submit)

    await waitFor(() => {
      // tc('errors.networkUnreachable') = "Device unreachable. Check your network."
      expect(screen.getByText('Device unreachable. Check your network.')).toBeInTheDocument()
    })
  })

  it('calls onDeviceFound when device is successfully verified', async () => {
    const user = userEvent.setup()
    const mockDevice = {
      id: 'AABB001',
      ip: '192.168.1.100',
      port: 80,
      name: 'Test Device',
      model: 'Plus1',
      app: 'Switch',
      generation: 'gen3' as const,
      type: 'switch' as const,
      components: [],
      addedAt: 0,
      lastSeenAt: 0,
    }
    mockVerifyManualHost.mockResolvedValue(mockDevice)

    const onDeviceFound = vi.fn()
    renderWithProviders(<ManualAddForm onDeviceFound={onDeviceFound} />)

    const ipInput = screen.getByLabelText(/IP Address/i)
    await user.type(ipInput, '192.168.1.100')

    const submit = screen.getByRole('button', { name: /add device/i })
    await user.click(submit)

    await waitFor(() => {
      expect(onDeviceFound).toHaveBeenCalledWith(mockDevice)
    })
  })

  it('calls verifyManualHost with the typed IP', async () => {
    const user = userEvent.setup()
    mockVerifyManualHost.mockResolvedValue(null)

    renderWithProviders(<ManualAddForm onDeviceFound={vi.fn()} />)

    const ipInput = screen.getByLabelText(/IP Address/i)
    await user.type(ipInput, '10.0.0.50')

    await user.click(screen.getByRole('button', { name: /add device/i }))

    await waitFor(() => {
      expect(mockVerifyManualHost).toHaveBeenCalledWith('10.0.0.50', 80, undefined)
    })
  })
})

describe('DiscoveryProgress', () => {
  it('shows singular "Found 1 device" for count=1', () => {
    renderWithProviders(
      <DiscoveryProgress status="done" progress={[]} found={1} />
    )
    expect(screen.getByText('Found 1 device')).toBeInTheDocument()
  })

  it('shows plural "Found 3 devices" for count=3', () => {
    renderWithProviders(
      <DiscoveryProgress status="done" progress={[]} found={3} />
    )
    expect(screen.getByText('Found 3 devices')).toBeInTheDocument()
  })

  it('shows a loader and searching text while running', () => {
    renderWithProviders(
      <DiscoveryProgress status="running" progress={[]} found={0} />
    )
    // "Searching…" text appears
    expect(screen.getAllByText('Searching…').length).toBeGreaterThan(0)
  })

  it('shows no-devices-found message when done with empty list', () => {
    renderWithProviders(
      <DiscoveryProgress status="done" progress={[]} found={0} />
    )
    expect(screen.getByText('No devices found. Try a different method.')).toBeInTheDocument()
  })

  it('renders discovered hosts in the progress list', () => {
    const hosts: DiscoveredHost[] = [
      { ip: '192.168.1.10', port: 80, hostname: 'shellyplus1-aabbcc', source: 'mdns' },
      { ip: '192.168.1.11', port: 80, hostname: undefined, source: 'scan' },
    ]
    renderWithProviders(
      <DiscoveryProgress status="done" progress={hosts} found={2} />
    )
    expect(screen.getByText('192.168.1.10:80')).toBeInTheDocument()
    expect(screen.getByText('192.168.1.11:80')).toBeInTheDocument()
    expect(screen.getByText('shellyplus1-aabbcc')).toBeInTheDocument()
  })
})
