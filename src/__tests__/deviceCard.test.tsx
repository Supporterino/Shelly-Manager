/**
 * Tests for DeviceCard component.
 * Phase 7.2 — PLAN.md §7.2
 */

import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { renderWithProviders } from '../test/renderWithProviders';
import type { StoredDevice } from '../types/device';

// Must be declared before imports that use them, but vi.mock is hoisted automatically
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('../hooks/useDeviceStatus', () => ({
  useDeviceStatus: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('../hooks/useWsStatus', () => ({
  useWsStatus: () => ({ wsStatus: undefined, isConnected: false }),
}));

// Avoid pulling in DeviceCardInlineControl's own hooks
vi.mock('../components/devices/DeviceCardInlineControl', () => ({
  DeviceCardInlineControl: () => <div data-testid="inline-control" />,
}));

import { DeviceCard } from '../components/devices/DeviceCard';

const mockDevice: StoredDevice = {
  id: 'AABBCCDDEEFF',
  ip: '192.168.1.100',
  port: 80,
  name: 'Living Room Switch',
  model: 'SNSW-001X16EU',
  app: 'Switch',
  generation: 'gen3',
  type: 'switch',
  components: [{ type: 'switch', id: 0 }],
  addedAt: 0,
  lastSeenAt: 0,
};

describe('DeviceCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the device name', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    expect(screen.getByText('Living Room Switch')).toBeInTheDocument();
  });

  it('renders the device model', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    expect(screen.getByText('SNSW-001X16EU')).toBeInTheDocument();
  });

  it('shows offline status badge when no status data is available', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    // DeviceStatusBadge renders t('status.offline') = "Offline" when polledStatus is undefined
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('navigates to device detail page on click', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    // Click on the device name text (inside the UnstyledButton)
    fireEvent.click(screen.getByText('Living Room Switch'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/devices/$deviceId',
      params: { deviceId: 'AABBCCDDEEFF' },
    });
  });

  it('renders the inline control sub-component', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    expect(screen.getByTestId('inline-control')).toBeInTheDocument();
  });

  it('uses device type label translation for the IP address label', () => {
    renderWithProviders(<DeviceCard device={mockDevice} locale="en" />);
    // Translated IP address label from devices namespace
    expect(screen.getByText(/IP Address:/)).toBeInTheDocument();
  });
});
