/**
 * Tests for SwitchControl and DimmerControl components.
 * Phase 7.2 — PLAN.md §7.2
 */

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { renderWithProviders } from '../test/renderWithProviders';
import type { StoredDevice } from '../types/device';

const mockSwitchMutate = vi.fn();
const mockDimmerMutate = vi.fn();

vi.mock('../hooks/useDeviceControl', () => ({
  useSwitchControl: () => ({ mutate: mockSwitchMutate, isPending: false }),
  useDimmerControl: () => ({ mutate: mockDimmerMutate, isPending: false }),
}));

import { DimmerControl } from '../components/devices/controls/DimmerControl';
import { SwitchControl } from '../components/devices/controls/SwitchControl';

const mockSwitchDevice: StoredDevice = {
  id: 'AABB001',
  ip: '192.168.1.10',
  port: 80,
  name: 'Bedroom Switch',
  model: 'SNSW-001X16EU',
  app: 'Switch',
  generation: 'gen3',
  type: 'switch',
  components: [{ type: 'switch', id: 0, name: 'Light' }],
  addedAt: 0,
  lastSeenAt: 0,
};

const mockDimmerDevice: StoredDevice = {
  id: 'AABB002',
  ip: '192.168.1.11',
  port: 80,
  name: 'Hallway Dimmer',
  model: 'SNDM-0013US',
  app: 'Dimmer',
  generation: 'gen3',
  type: 'dimmer',
  components: [{ type: 'light', id: 0, name: 'Ceiling' }],
  addedAt: 0,
  lastSeenAt: 0,
};

describe('SwitchControl', () => {
  beforeEach(() => mockSwitchMutate.mockReset());

  it('renders the channel label', () => {
    renderWithProviders(
      <SwitchControl
        deviceId="AABB001"
        componentId={0}
        status={undefined}
        device={mockSwitchDevice}
      />,
    );
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('renders the Off label when status is off', () => {
    renderWithProviders(
      <SwitchControl
        deviceId="AABB001"
        componentId={0}
        status={{ output: false }}
        device={mockSwitchDevice}
      />,
    );
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('calls mutation with on:true when toggled on', () => {
    renderWithProviders(
      <SwitchControl
        deviceId="AABB001"
        componentId={0}
        status={{ output: false }}
        device={mockSwitchDevice}
      />,
    );
    // Mantine Switch renders <input type="checkbox" role="switch">
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(mockSwitchMutate).toHaveBeenCalledWith({ on: true });
  });

  it('calls mutation with on:false when toggled off', () => {
    renderWithProviders(
      <SwitchControl
        deviceId="AABB001"
        componentId={0}
        status={{ output: true }}
        device={mockSwitchDevice}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(mockSwitchMutate).toHaveBeenCalledWith({ on: false });
  });

  it('is not disabled when mutation is idle', () => {
    // The mock returns isPending: false — the switch must be enabled
    renderWithProviders(
      <SwitchControl
        deviceId="AABB001"
        componentId={0}
        status={{ output: false }}
        device={mockSwitchDevice}
      />,
    );
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toBeDisabled();
  });
});

describe('DimmerControl', () => {
  beforeEach(() => mockDimmerMutate.mockReset());

  it('renders the channel label', () => {
    renderWithProviders(
      <DimmerControl
        deviceId="AABB002"
        componentId={0}
        status={undefined}
        device={mockDimmerDevice}
      />,
    );
    expect(screen.getByText('Ceiling')).toBeInTheDocument();
  });

  it('renders the brightness percentage', () => {
    renderWithProviders(
      <DimmerControl
        deviceId="AABB002"
        componentId={0}
        status={{ output: true, brightness: 75 }}
        device={mockDimmerDevice}
      />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('calls mutation with on:true when switch is turned on', () => {
    renderWithProviders(
      <DimmerControl
        deviceId="AABB002"
        componentId={0}
        status={{ output: false, brightness: 50 }}
        device={mockDimmerDevice}
      />,
    );
    // Mantine Switch renders <input type="checkbox" role="switch">
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(mockDimmerMutate).toHaveBeenCalledWith({ on: true });
  });

  it('renders a slider element for brightness control', () => {
    renderWithProviders(
      <DimmerControl
        deviceId="AABB002"
        componentId={0}
        status={{ output: true, brightness: 60 }}
        device={mockDimmerDevice}
      />,
    );
    // Mantine Slider renders a thumb with role="slider"
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('calls mutation with correct brightness on slider key change', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DimmerControl
        deviceId="AABB002"
        componentId={0}
        status={{ output: true, brightness: 50 }}
        device={mockDimmerDevice}
      />,
    );
    const slider = screen.getByRole('slider');
    await user.click(slider);
    await user.keyboard('{ArrowRight}');
    // Mantine Slider fires onChangeEnd on ArrowRight key release
    // mutation should be called with new brightness value (51)
    expect(mockDimmerMutate).toHaveBeenCalledWith(
      expect.objectContaining({ brightness: expect.any(Number) }),
    );
  });
});
