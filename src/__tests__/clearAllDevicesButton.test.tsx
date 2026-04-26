/**
 * Tests for src/components/settings/ClearAllDevicesButton.tsx
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { renderWithProviders } from '../test/renderWithProviders';
import { useDeviceStore } from '../store/deviceStore';
import type { StoredDevice } from '../types/device';
import { ClearAllDevicesButton } from '../components/settings/ClearAllDevicesButton';

// Mock mantine notifications so we can assert on them without a real portal
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const makeDevice = (id: string): StoredDevice => ({
  id,
  ip: `192.168.1.${id}`,
  port: 80,
  name: `Device ${id}`,
  model: 'SHSW-1',
  app: 'Switch',
  generation: 'gen2',
  type: 'switch',
  components: [],
  addedAt: Date.now(),
  lastSeenAt: Date.now(),
});

beforeEach(() => {
  useDeviceStore.setState({ devices: {}, isHydrated: false });
  vi.clearAllMocks();
});

describe('ClearAllDevicesButton', () => {
  it('renders a disabled button when there are no devices', () => {
    renderWithProviders(<ClearAllDevicesButton />);
    expect(screen.getByRole('button', { name: /clear all devices/i })).toBeDisabled();
  });

  it('renders an enabled button when devices exist', () => {
    useDeviceStore.setState({ devices: { '1': makeDevice('1') }, isHydrated: false });
    renderWithProviders(<ClearAllDevicesButton />);
    expect(screen.getByRole('button', { name: /clear all devices/i })).toBeEnabled();
  });

  it('opens a confirm modal when the button is clicked', async () => {
    const user = userEvent.setup();
    useDeviceStore.setState({ devices: { '1': makeDevice('1') }, isHydrated: false });
    renderWithProviders(<ClearAllDevicesButton />);

    await user.click(screen.getByRole('button', { name: /clear all devices/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/clear all devices\?/i)).toBeInTheDocument();
  });

  it('cancels and leaves devices intact', async () => {
    const user = userEvent.setup();
    useDeviceStore.setState({
      devices: { '1': makeDevice('1'), '2': makeDevice('2') },
      isHydrated: false,
    });
    renderWithProviders(<ClearAllDevicesButton />);

    await user.click(screen.getByRole('button', { name: /clear all devices/i }));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(Object.keys(useDeviceStore.getState().devices)).toHaveLength(2);
  });

  it('clears all devices on confirm', async () => {
    const { notifications } = await import('@mantine/notifications');
    const user = userEvent.setup();
    useDeviceStore.setState({
      devices: { '1': makeDevice('1'), '2': makeDevice('2') },
      isHydrated: false,
    });
    renderWithProviders(<ClearAllDevicesButton />);

    await user.click(screen.getByRole('button', { name: /clear all devices/i }));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(useDeviceStore.getState().devices).toEqual({});
    expect(notifications.show).toHaveBeenCalledOnce();
  });
});
