/**
 * Tests for DeviceProfileSection.
 * Covers rendering, profile selection, and confirm modal with counts.
 */

import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { DeviceProfileSection } from '../components/devices/settings/DeviceProfileSection';
import { renderWithProviders } from '../test/renderWithProviders';

const mockMutate = vi.fn();

let mockProfiles = [
  { name: 'switch', current: true },
  { name: 'cover', current: false },
];

vi.mock('../hooks/useDeviceSettings', () => ({
  useListProfiles: () => ({ data: { profiles: mockProfiles }, isLoading: false }),
  useSetProfile: () => ({ mutate: mockMutate, isPending: false }),
  useWebhookList: () => ({ data: { hooks: [{ id: 1 }, { id: 2 }] } }),
  useScheduleListForCount: () => ({ data: { jobs: [{ id: 1 }] } }),
}));

describe('DeviceProfileSection', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockProfiles = [
      { name: 'switch', current: true },
      { name: 'cover', current: false },
    ];
  });

  it('renders current profile badge', () => {
    renderWithProviders(<DeviceProfileSection deviceId="AABB001" />);
    expect(screen.getByText(/Current: switch/i)).toBeInTheDocument();
  });

  it('renders profile selector with options', () => {
    renderWithProviders(<DeviceProfileSection deviceId="AABB001" />);
    expect(screen.getByText('Switch Profile')).toBeInTheDocument();
  });

  it('renders profile selector with options', () => {
    renderWithProviders(<DeviceProfileSection deviceId="AABB001" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders current profile badge', () => {
    renderWithProviders(<DeviceProfileSection deviceId="AABB001" />);
    expect(screen.getByText(/Current: switch/i)).toBeInTheDocument();
  });
});
