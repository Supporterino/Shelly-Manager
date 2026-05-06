/**
 * Tests for SystemSettingsSection.
 * Covers rendering, form interactions, save payload, and restart alert.
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { SystemSettingsSection } from '../components/devices/settings/SystemSettingsSection';
import { renderWithProviders } from '../test/renderWithProviders';

const mockMutate = vi.fn();
const mockSetTimeMutate = vi.fn();

let mockConfig: Record<string, unknown> = {
  device: { name: 'Living Room' },
  eco_mode: false,
};

vi.mock('../hooks/useDeviceSettings', () => ({
  useSysConfig: () => ({ data: mockConfig, isLoading: false }),
  useSysSetConfig: () => ({ mutate: mockMutate, isPending: false }),
  useSetTime: () => ({ mutate: mockSetTimeMutate, isPending: false }),
}));

vi.mock('../store/deviceStore', () => ({
  useDeviceStore: () => ({
    devices: { AABB001: { id: 'AABB001', name: 'Living Room', discoverable: true } },
    updateDevice: vi.fn(),
  }),
}));

describe('SystemSettingsSection', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockSetTimeMutate.mockReset();
    mockConfig = {
      device: { name: 'Living Room' },
      eco_mode: false,
    };
  });

  it('renders device name input pre-filled', () => {
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    const input = screen.getByLabelText('Device Name') as HTMLInputElement;
    expect(input.value).toBe('Living Room');
  });

  it('toggles eco mode switch when device supports it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    const ecoSwitch = screen.getByLabelText('Eco Mode');
    expect(ecoSwitch).not.toBeChecked();
    await user.click(ecoSwitch);
    expect(ecoSwitch).toBeChecked();
  });

  it('hides eco mode switch when device does not support it', () => {
    mockConfig = {
      device: { name: 'Living Room' },
    };
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    expect(screen.queryByLabelText('Eco Mode')).not.toBeInTheDocument();
  });

  it('calls save mutation with correct payload when name changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    const input = screen.getByLabelText('Device Name') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Bedroom Light');
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ device: { name: 'Bedroom Light' } }),
      expect.any(Object),
    );
  });

  it('shows restart alert after successful save', async () => {
    mockMutate.mockImplementation((_payload: unknown, options: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText(/restart/i)).toBeInTheDocument();
    });
  });

  it('calls sync time mutation on button click', () => {
    renderWithProviders(<SystemSettingsSection deviceId="AABB001" />);
    fireEvent.click(screen.getByText('Sync Time'));
    expect(mockSetTimeMutate).toHaveBeenCalledWith(expect.any(String));
  });
});
