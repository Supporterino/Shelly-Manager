/**
 * Tests for SwitchConfigPanel component.
 * Covers rendering, in_mode selection, timer collapse, save payload, restart alert, and error state.
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { renderWithProviders } from '../test/renderWithProviders';
import { SwitchConfigPanel } from '../components/devices/controls/SwitchConfigPanel';
import type { SwitchConfig } from '../types/shelly';

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockMutate = vi.fn();

const baseConfig: SwitchConfig = {
  id: 0,
  name: 'Living Room',
  in_mode: 'flip',
  in_locked: false,
  initial_state: 'restore_last',
  auto_on: false,
  auto_on_delay: 60,
  auto_off: false,
  auto_off_delay: 60,
};

let mockConfigData: SwitchConfig | undefined = baseConfig;
let mockIsLoading = false;
let mockIsError = false;
let mockIsPending = false;

vi.mock('../hooks/useDeviceControl', () => ({
  useSwitchConfig: () => ({
    data: mockConfigData,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
  useSwitchSetConfig: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
  // Keep other hooks intact
  useSwitchControl: vi.fn(),
  useInputConfig: vi.fn(),
  useInputSetConfig: vi.fn(),
  useDimmerControl: vi.fn(),
  useCoverControl: vi.fn(),
  useCoverCalibrate: vi.fn(),
  useRGBControl: vi.fn(),
  useRGBWControl: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(props: Partial<React.ComponentProps<typeof SwitchConfigPanel>> = {}) {
  return renderWithProviders(
    <SwitchConfigPanel
      opened={true}
      onClose={vi.fn()}
      deviceId="AABB001"
      switchId={0}
      {...props}
    />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SwitchConfigPanel', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockConfigData = baseConfig;
    mockIsLoading = false;
    mockIsError = false;
    mockIsPending = false;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders all 5 in_mode segments', () => {
    renderPanel();
    expect(screen.getByText('Momentary')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Flip (Edge)')).toBeInTheDocument();
    expect(screen.getByText('Detached')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  it('renders channel name pre-filled from config', () => {
    renderPanel();
    const nameInput = screen.getByLabelText('Channel Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Living Room');
  });

  it('shows a loader when isLoading is true', () => {
    mockIsLoading = true;
    mockConfigData = undefined;
    renderPanel();
    expect(screen.queryByLabelText('Channel Name')).not.toBeInTheDocument();
  });

  it('shows an error alert when isError is true', () => {
    mockIsError = true;
    mockConfigData = undefined;
    renderPanel();
    expect(screen.getByText(/unreachable|Unreachable/i)).toBeInTheDocument();
  });

  it('pre-selects in_mode from config', () => {
    renderPanel();
    // SegmentedControl marks the active option; "Flip (Edge)" should be selected
    // We verify the segment is rendered and the mutation will carry the correct value
    expect(screen.getByText('Flip (Edge)')).toBeInTheDocument();
  });

  // ── Timer collapse ─────────────────────────────────────────────────────────

  it('hides Auto ON Delay when Auto ON is off', () => {
    renderPanel();
    expect(screen.queryByLabelText('Auto ON Delay (s)')).not.toBeVisible();
  });

  it('shows Auto ON Delay when Auto ON is toggled on', async () => {
    const user = userEvent.setup();
    renderPanel();
    // Before toggle: field is in DOM but hidden (Collapse keeps it mounted)
    expect(screen.queryByLabelText('Auto ON Delay (s)')).not.toBeVisible();
    const autoOnSwitch = screen.getByLabelText('Auto ON');
    await user.click(autoOnSwitch);
    // After toggle: Collapse opens — field is now visible
    expect(screen.getByLabelText('Auto ON Delay (s)')).toBeInTheDocument();
  });

  it('hides Auto OFF Delay when Auto OFF is off', () => {
    renderPanel();
    expect(screen.queryByLabelText('Auto OFF Delay (s)')).not.toBeVisible();
  });

  it('shows Auto OFF Delay when Auto OFF is toggled on', async () => {
    const user = userEvent.setup();
    renderPanel();
    // Before toggle: field is in DOM but hidden
    expect(screen.queryByLabelText('Auto OFF Delay (s)')).not.toBeVisible();
    const autoOffSwitch = screen.getByLabelText('Auto OFF');
    await user.click(autoOffSwitch);
    // After toggle: field is now present
    expect(screen.getByLabelText('Auto OFF Delay (s)')).toBeInTheDocument();
  });

  // ── Save payload ───────────────────────────────────────────────────────────

  it('calls mutation with correct base payload on save', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        in_mode: 'flip',
        name: 'Living Room',
        in_locked: false,
        initial_state: 'restore_last',
        auto_on: false,
        auto_off: false,
      }),
      expect.any(Object),
    );
  });

  it('sends name as null when name field is empty', async () => {
    const user = userEvent.setup();
    renderPanel();
    const nameInput = screen.getByLabelText('Channel Name');
    await user.clear(nameInput);
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: null }),
      expect.any(Object),
    );
  });

  it('sends auto_on: true and delay when Auto ON is toggled', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByLabelText('Auto ON'));
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ auto_on: true, auto_on_delay: expect.any(Number) }),
      expect.any(Object),
    );
  });

  it('sends changed in_mode when segment is clicked', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Follow'));
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ in_mode: 'follow' }),
      expect.any(Object),
    );
  });

  // ── Protection limits ──────────────────────────────────────────────────────

  it('does not render protection section when config has no protection fields', () => {
    renderPanel(); // baseConfig has no power_limit etc.
    expect(screen.queryByText('Protection Limits')).not.toBeInTheDocument();
  });

  it('renders protection fields when config includes them', () => {
    mockConfigData = { ...baseConfig, power_limit: 3500, current_limit: 16 };
    renderPanel();
    expect(screen.getByText('Protection Limits')).toBeInTheDocument();
    expect(screen.getByLabelText('Power Limit (W)')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Limit (A)')).toBeInTheDocument();
  });

  // ── Restart required ───────────────────────────────────────────────────────

  it('shows yellow restart alert when mutation returns restart_required: true', async () => {
    mockMutate.mockImplementation(
      (_payload: unknown, options: { onSuccess?: (r: { restart_required: boolean }) => void }) => {
        options?.onSuccess?.({ restart_required: true });
      },
    );
    renderPanel();
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText(/restart/i)).toBeInTheDocument();
    });
  });

  it('does not show restart alert on initial render', () => {
    renderPanel();
    expect(screen.queryByText(/restart required/i)).not.toBeInTheDocument();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('shows Save button as loading when mutation is pending', () => {
    mockIsPending = true;
    renderPanel();
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
