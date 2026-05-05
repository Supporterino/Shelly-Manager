/**
 * Tests for SettingsTabs.
 * Covers conditional tab visibility based on device capabilities.
 */

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { SettingsTabs } from '../components/devices/settings/SettingsTabs';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../hooks/useDeviceStatus', () => ({
  useDeviceStatus: () => ({ data: null }),
}));

vi.mock('../hooks/useDeviceSettings', () => ({
  useListProfiles: () => ({ data: { profiles: [] } }),
  useSysConfig: () => ({ data: null }),
  useSysSetConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useDetectLocation: () => ({ mutate: vi.fn(), isPending: false }),
  useListTimezones: () => ({ data: null }),
  useSetTime: () => ({ mutate: vi.fn(), isPending: false }),
  useWiFiConfig: () => ({ data: null }),
  useWiFiStatus: () => ({ data: null }),
  useAPClients: () => ({ data: null }),
  useEthConfig: () => ({ data: null }),
  useEthStatus: () => ({ data: null }),
  useWebhookList: () => ({ data: null }),
  useScheduleListForCount: () => ({ data: null }),
  useSetProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useEthSetConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useWiFiSetConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useWiFiScan: () => ({ data: null, isFetching: false, refetch: vi.fn() }),
}));

vi.mock('../store/deviceStore', () => ({
  useDeviceStore: () => ({
    devices: {
      AABB001: {
        id: 'AABB001',
        name: 'Test Device',
        ip: '192.168.1.100',
        port: 80,
        model: 'Plus2PM',
        app: 'Switch',
        generation: 'gen2',
        type: 'switch',
        components: [],
        addedAt: 0,
        lastSeenAt: 0,
      },
    },
  }),
}));

describe('SettingsTabs', () => {
  it('renders all default tabs', () => {
    renderWithProviders(<SettingsTabs deviceId="AABB001" />);
    expect(screen.getByRole('tab', { name: /General/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Network/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Components/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Firmware/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Advanced/i })).toBeInTheDocument();
  });

  it('does not render Profile tab for single-profile devices', () => {
    renderWithProviders(<SettingsTabs deviceId="AABB001" />);
    expect(screen.queryByRole('tab', { name: /Profile/i })).not.toBeInTheDocument();
  });
});
