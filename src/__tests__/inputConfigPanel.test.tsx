/**
 * Tests for InputConfigPanel component.
 * Covers type switching, field visibility, save payload, restart alert, and error state.
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';
import { renderWithProviders } from '../test/renderWithProviders';
import { InputConfigPanel } from '../components/devices/controls/InputConfigPanel';
import type { InputConfig } from '../types/shelly';

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockMutate = vi.fn();

const baseConfig: InputConfig = {
  id: 0,
  name: 'Door Sensor',
  type: 'switch',
  enable: true,
  invert: false,
  factory_reset: false,
};

let mockConfigData: InputConfig | undefined = baseConfig;
let mockIsLoading = false;
let mockIsError = false;
let mockIsPending = false;

vi.mock('../hooks/useDeviceControl', () => ({
  useInputConfig: () => ({
    data: mockConfigData,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
  useInputSetConfig: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
  // Keep other hooks intact so nothing else breaks if imported together
  useSwitchControl: vi.fn(),
  useDimmerControl: vi.fn(),
  useCoverControl: vi.fn(),
  useCoverCalibrate: vi.fn(),
  useRGBControl: vi.fn(),
  useRGBWControl: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(props: Partial<React.ComponentProps<typeof InputConfigPanel>> = {}) {
  return renderWithProviders(
    <InputConfigPanel
      opened={true}
      onClose={vi.fn()}
      deviceId="AABB001"
      inputId={0}
      {...props}
    />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InputConfigPanel', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockConfigData = baseConfig;
    mockIsLoading = false;
    mockIsError = false;
    mockIsPending = false;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders all 4 type segments', () => {
    renderPanel();
    expect(screen.getByText('Switch')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByText('Analog')).toBeInTheDocument();
    expect(screen.getByText('Counter')).toBeInTheDocument();
  });

  it('renders channel name pre-filled from config', () => {
    renderPanel();
    const nameInput = screen.getByLabelText('Channel Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Door Sensor');
  });

  it('shows a loader when isLoading is true', () => {
    mockIsLoading = true;
    mockConfigData = undefined;
    renderPanel();
    // MantineLoader renders an svg or role="status"; check no form fields are visible
    expect(screen.queryByLabelText('Channel Name')).not.toBeInTheDocument();
  });

  it('shows an error alert when isError is true', () => {
    mockIsError = true;
    mockConfigData = undefined;
    renderPanel();
    expect(screen.getByText(/unreachable|Unreachable/i)).toBeInTheDocument();
  });

  // ── Field visibility by type ───────────────────────────────────────────────

  it('shows Invert and Factory Reset for switch type', () => {
    renderPanel();
    // Multiple "Invert Logic" elements exist in DOM (Collapse keeps them mounted);
    // assert at least one is present.
    expect(screen.getAllByLabelText('Invert Logic').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Allow Factory Reset via Input').length).toBeGreaterThan(0);
  });

  it('shows Invert and Factory Reset for button type', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Button'));
    expect(screen.getAllByLabelText('Invert Logic').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Allow Factory Reset via Input').length).toBeGreaterThan(0);
  });

  it('shows analog-specific fields when Analog segment is selected', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Analog'));
    expect(screen.getByLabelText('Report Threshold (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Range Min')).toBeInTheDocument();
    expect(screen.getByLabelText('Range Max')).toBeInTheDocument();
    expect(screen.getByLabelText('Transform Expression (x)')).toBeInTheDocument();
    expect(screen.getByLabelText('Transformed Unit')).toBeInTheDocument();
  });

  it('shows count-specific fields when Counter segment is selected', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Counter'));
    expect(screen.getByLabelText('Frequency Window (s)')).toBeInTheDocument();
    expect(screen.getByLabelText('Count Report Threshold')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency Report Threshold (%)')).toBeInTheDocument();
  });

  it('hides analog fields when switch type is selected', () => {
    renderPanel();
    // Collapse hides them — they should not be visible in the DOM or be hidden
    expect(screen.queryByLabelText('Report Threshold (%)')).not.toBeVisible();
  });

  it('hides count fields when switch type is selected', () => {
    renderPanel();
    expect(screen.queryByLabelText('Frequency Window (s)')).not.toBeVisible();
  });

  // ── Save payload ───────────────────────────────────────────────────────────

  it('calls mutation with switch payload on save', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'switch',
        name: 'Door Sensor',
        enable: true,
        invert: false,
        factory_reset: false,
      }),
      expect.any(Object),
    );
  });

  it('calls mutation with analog payload when analog type is selected', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Analog'));
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'analog',
        report_thr: expect.any(Number),
        range_map: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      }),
      expect.any(Object),
    );
  });

  it('calls mutation with count payload when counter type is selected', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText('Counter'));
    fireEvent.click(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'count',
        freq_window: expect.any(Number),
        count_rep_thr: expect.any(Number),
        freq_rep_thr: expect.any(Number),
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

  // ── Restart required ───────────────────────────────────────────────────────

  it('shows yellow restart alert when mutation returns restart_required: true', async () => {
    mockMutate.mockImplementation((_payload: unknown, options: { onSuccess?: (r: { restart_required: boolean }) => void }) => {
      options?.onSuccess?.({ restart_required: true });
    });
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
    // Mantine Button with loading renders a Loader inside — button text may still be in DOM
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
