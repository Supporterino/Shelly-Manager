/**
 * Tests for src/hooks/useFirmwareManager.ts
 * Covers extractCurrentVersion, checkDevice, updateDevice, checkAll, updateSelected.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/mocks/tauri';

// ── Hoist mock functions so they can be referenced inside vi.mock() factories ──
const mockCheckForUpdate = vi.hoisted(() => vi.fn());
const mockTriggerUpdate = vi.hoisted(() => vi.fn());
const mockGetDeviceInfo = vi.hoisted(() => vi.fn());
const mockVerifyHost = vi.hoisted(() => vi.fn());
const mockPollUntilOnline = vi.hoisted(() => vi.fn());
const mockPollUntilOffline = vi.hoisted(() => vi.fn());

vi.mock('../services/shellyClient', () => {
  // Must use a class so the mock is newable as a constructor.
  // Vitest 4.x requires 'function' or 'class' keyword for newable mocks.
  class ShellyClient {
    checkForUpdate = mockCheckForUpdate;
    triggerUpdate = mockTriggerUpdate;
    getDeviceInfo = mockGetDeviceInfo;
  }
  return {
    ShellyClient: vi.fn(ShellyClient),
    verifyShellyHost: mockVerifyHost,
  };
});

vi.mock('../utils/firmware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/firmware')>();
  return {
    ...actual,
    pollUntilOnline: mockPollUntilOnline,
    pollUntilOffline: mockPollUntilOffline,
  };
});

import {
  extractCurrentVersion,
  extractTrackVersion,
  useFirmwareManager,
} from '../hooks/useFirmwareManager';
import type { StoredDevice } from '../types/device';

// ── Fixture factory ────────────────────────────────────────────────────────────

function makeDevice(overrides: Partial<StoredDevice> = {}): StoredDevice {
  return {
    id: 'AABBCC001122',
    name: 'Test Switch',
    ip: '192.168.1.10',
    port: 80,
    generation: 'gen3',
    model: 'SNSW-001X16EU',
    app: 'Switch',
    type: 'switch',
    components: [{ type: 'switch', id: 0 }],
    addedAt: 0,
    lastSeenAt: 0,
    ...overrides,
  };
}

const device1 = makeDevice({ id: 'DEV001', name: 'Switch 1', ip: '192.168.1.1' });
const device2 = makeDevice({ id: 'DEV002', name: 'Switch 2', ip: '192.168.1.2' });

// ── extractCurrentVersion ─────────────────────────────────────────────────────

describe('extractCurrentVersion', () => {
  it('returns sys.fw_id from liveStatus when present', () => {
    const liveStatus = { sys: { fw_id: '20240101-120000/1.2.3' } };
    expect(extractCurrentVersion(device1, liveStatus)).toBe('20240101-120000/1.2.3');
  });

  it('falls back to device.model when liveStatus has no sys key', () => {
    expect(extractCurrentVersion(device1, {})).toBe('SNSW-001X16EU');
  });

  it('falls back to device.model when liveStatus is undefined', () => {
    expect(extractCurrentVersion(device1, undefined)).toBe('SNSW-001X16EU');
  });

  it('falls back to device.model when sys.fw_id is absent', () => {
    const liveStatus = { sys: { uptime: 3600 } };
    expect(extractCurrentVersion(device1, liveStatus)).toBe('SNSW-001X16EU');
  });
});

// ── extractTrackVersion ───────────────────────────────────────────────────────

describe('extractTrackVersion', () => {
  it('extracts stable version from direct shape', () => {
    const result = { stable: { version: '1.5.0' } };
    expect(extractTrackVersion(result, 'stable')).toBe('1.5.0');
  });

  it('extracts beta version from direct shape', () => {
    const result = { beta: { version: '1.6.0-beta1' } };
    expect(extractTrackVersion(result, 'beta')).toBe('1.6.0-beta1');
  });

  it('extracts stable version from available_updates wrapper', () => {
    const result = { available_updates: { stable: { version: '1.5.0' } } };
    expect(extractTrackVersion(result, 'stable')).toBe('1.5.0');
  });

  it('extracts beta version from available_updates wrapper', () => {
    const result = { available_updates: { beta: { version: '1.6.0-beta1' } } };
    expect(extractTrackVersion(result, 'beta')).toBe('1.6.0-beta1');
  });

  it('prefers direct shape over wrapper', () => {
    const result = {
      stable: { version: '2.0.0' },
      available_updates: { stable: { version: '1.5.0' } },
    };
    expect(extractTrackVersion(result, 'stable')).toBe('2.0.0');
  });

  it('returns undefined when track is absent', () => {
    expect(extractTrackVersion({}, 'stable')).toBeUndefined();
    expect(extractTrackVersion({}, 'beta')).toBeUndefined();
  });

  it('returns undefined when version is missing', () => {
    expect(extractTrackVersion({ stable: {} }, 'stable')).toBeUndefined();
    expect(extractTrackVersion({ beta: {} }, 'beta')).toBeUndefined();
  });

  it('handles null values gracefully', () => {
    expect(extractTrackVersion({ stable: null }, 'stable')).toBeUndefined();
    expect(extractTrackVersion({ beta: null }, 'beta')).toBeUndefined();
    expect(extractTrackVersion({ available_updates: null }, 'stable')).toBeUndefined();
  });
});

// ── useFirmwareManager ────────────────────────────────────────────────────────

describe('useFirmwareManager', () => {
  beforeEach(() => {
    mockCheckForUpdate.mockReset();
    mockTriggerUpdate.mockReset();
    mockGetDeviceInfo.mockReset();
    mockVerifyHost.mockReset();
    mockPollUntilOnline.mockReset();
    mockPollUntilOffline.mockReset();
  });

  it('initialises all devices with idle status', () => {
    const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
    expect(result.current.firmwareStates.DEV001?.status).toBe('idle');
    expect(result.current.firmwareStates.DEV002?.status).toBe('idle');
  });

  it('initialises currentVersion from sys.fw_id when liveStatus is provided', () => {
    const liveStatuses = { DEV001: { sys: { fw_id: '20240601/1.4.2' } } };
    const { result } = renderHook(() => useFirmwareManager([device1], liveStatuses));
    expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('20240601/1.4.2');
  });

  it('initialises currentVersion from device.model when no liveStatus', () => {
    const { result } = renderHook(() => useFirmwareManager([device1], {}));
    expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('SNSW-001X16EU');
  });

  it('initialises updateTrack from device.updateTrack when set', () => {
    const betaDevice = makeDevice({ id: 'DEV003', updateTrack: 'beta' });
    const { result } = renderHook(() => useFirmwareManager([betaDevice], {}));
    expect(result.current.firmwareStates.DEV003?.updateTrack).toBe('beta');
  });

  it('defaults updateTrack to stable when device.updateTrack is undefined', () => {
    const { result } = renderHook(() => useFirmwareManager([device1], {}));
    expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('stable');
  });

  // ── checkDevice ─────────────────────────────────────────────────────────────

  describe('checkDevice', () => {
    it('sets up-to-date when no stable update is available', async () => {
      mockCheckForUpdate.mockResolvedValue({});
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('up-to-date');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBeUndefined();
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('stable');
    });

    it('sets update-available with the correct version string', async () => {
      mockCheckForUpdate.mockResolvedValue({ stable: { version: '1.5.0' } });
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('update-available');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBe('1.5.0');
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('stable');
    });

    it('sets update-available for beta track when beta version exists', async () => {
      mockCheckForUpdate.mockResolvedValue({
        stable: { version: '1.5.0' },
        beta: { version: '1.6.0-beta1' },
      });
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1, 'beta');
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('update-available');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBe('1.6.0-beta1');
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('beta');
    });

    it('sets up-to-date for beta track when no beta version exists', async () => {
      mockCheckForUpdate.mockResolvedValue({ stable: { version: '1.5.0' } });
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1, 'beta');
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('up-to-date');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBeUndefined();
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('beta');
    });

    it('sets currentVersion from getDeviceInfo.ver on successful check', async () => {
      mockCheckForUpdate.mockResolvedValue({});
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240601-090000/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('1.4.0');
    });

    it('does not update currentVersion if getDeviceInfo throws', async () => {
      mockCheckForUpdate.mockResolvedValue({});
      mockGetDeviceInfo.mockRejectedValue(new Error('unreachable'));

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1);
      });

      // Status should still succeed; currentVersion stays as the initial fallback
      expect(result.current.firmwareStates.DEV001?.status).toBe('up-to-date');
      expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('SNSW-001X16EU');
    });

    it('sets failed with error message on network error', async () => {
      mockCheckForUpdate.mockRejectedValue(new Error('Network timeout'));
      mockGetDeviceInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.checkDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('failed');
      expect(result.current.firmwareStates.DEV001?.error).toBe('Network timeout');
    });

    it('clears a previous error on a new check attempt', async () => {
      mockCheckForUpdate.mockRejectedValueOnce(new Error('First failure')).mockResolvedValue({});
      mockGetDeviceInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));

      // First check fails
      await act(async () => {
        await result.current.checkDevice(device1);
      });
      expect(result.current.firmwareStates.DEV001?.error).toBe('First failure');

      // Second check succeeds — error should be cleared
      await act(async () => {
        await result.current.checkDevice(device1);
      });
      expect(result.current.firmwareStates.DEV001?.error).toBeUndefined();
    });
  });

  // ── updateDevice ────────────────────────────────────────────────────────────

  describe('updateDevice', () => {
    it('transitions to done with new firmware version on success', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue({
        type: 'SHSW',
        mac: 'DEV001',
        gen: 3,
        fw_id: '20240601-090000/1.5.0',
        ver: '1.5.0',
        auth: false,
      });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('done');
      // fw_id takes precedence over ver in the version readback
      expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('20240601-090000/1.5.0');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBeUndefined();
      expect(result.current.firmwareStates.DEV001?.pollStep).toBe(0);
      expect(mockTriggerUpdate).toHaveBeenCalledWith('stable');
    });

    it('calls triggerUpdate with beta when track is beta', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue({
        type: 'SHSW',
        mac: 'DEV001',
        gen: 3,
        fw_id: '20240601-090000/1.6.0-beta1',
        ver: '1.6.0-beta1',
        auth: false,
      });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1, 'beta');
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('done');
      expect(mockTriggerUpdate).toHaveBeenCalledWith('beta');
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('beta');
    });

    it('sets failed when device never goes offline (update did not start)', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(false);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('failed');
      expect(result.current.firmwareStates.DEV001?.error).toBe(
        'Device did not go offline — update may not have started',
      );
      // pollUntilOnline must NOT be called if the offline phase already failed
      expect(mockPollUntilOnline).not.toHaveBeenCalled();
    });

    it('sets failed when device does not come back online after update', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(false);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('failed');
      expect(result.current.firmwareStates.DEV001?.error).toBe(
        'Device did not come back online after update',
      );
      expect(result.current.firmwareStates.DEV001?.pollStep).toBe(0);
    });

    it('sets failed when triggerUpdate itself throws', async () => {
      mockTriggerUpdate.mockRejectedValue(new Error('Update rejected by device'));

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('failed');
      expect(result.current.firmwareStates.DEV001?.error).toBe('Update rejected by device');
    });

    it('uses device.model as currentVersion fallback when verifyShellyHost returns null', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue(null);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('done');
      // Falls back to device.model when fw_id/ver are unavailable
      expect(result.current.firmwareStates.DEV001?.currentVersion).toBe('SNSW-001X16EU');
    });

    it('calls pollUntilOffline before pollUntilOnline with the correct ip and port', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue(null);

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateDevice(device1);
      });

      expect(mockPollUntilOffline).toHaveBeenCalledWith(device1.ip, device1.port);
      expect(mockPollUntilOnline).toHaveBeenCalledWith(
        device1.ip,
        device1.port,
        expect.any(Function),
      );
    });
  });

  // ── checkAll ────────────────────────────────────────────────────────────────

  describe('checkAll', () => {
    it('checks all provided devices and updates their statuses', async () => {
      mockCheckForUpdate.mockResolvedValue({ stable: { version: '2.0.0' } });
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
      await act(async () => {
        await result.current.checkAll([device1, device2]);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('update-available');
      expect(result.current.firmwareStates.DEV002?.status).toBe('update-available');
      expect(mockCheckForUpdate).toHaveBeenCalledTimes(2);
    });

    it('passes track parameter to all device checks', async () => {
      mockCheckForUpdate.mockResolvedValue({ beta: { version: '2.0.0-beta1' } });
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
      await act(async () => {
        await result.current.checkAll([device1, device2], 'beta');
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('update-available');
      expect(result.current.firmwareStates.DEV001?.availableVersion).toBe('2.0.0-beta1');
      expect(result.current.firmwareStates.DEV001?.updateTrack).toBe('beta');
      expect(result.current.firmwareStates.DEV002?.updateTrack).toBe('beta');
    });

    it('handles mixed results across devices independently', async () => {
      mockCheckForUpdate
        .mockResolvedValueOnce({}) // DEV001 — up-to-date
        .mockResolvedValueOnce({ stable: { version: '2.0.0' } }); // DEV002 — available
      mockGetDeviceInfo.mockResolvedValue({ ver: '1.4.0', fw_id: '20240101/1.4.0' });

      const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
      await act(async () => {
        await result.current.checkAll([device1, device2]);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('up-to-date');
      expect(result.current.firmwareStates.DEV002?.status).toBe('update-available');
    });
  });

  // ── updateSelected ──────────────────────────────────────────────────────────

  describe('updateSelected', () => {
    it('updates all selected devices and marks them as done', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue({
        type: 'SHSW',
        mac: 'MAC',
        gen: 3,
        fw_id: '20240601/2.0.0',
        ver: '2.0.0',
        auth: false,
      });

      const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
      await act(async () => {
        await result.current.updateSelected([device1, device2]);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('done');
      expect(result.current.firmwareStates.DEV002?.status).toBe('done');
      expect(mockTriggerUpdate).toHaveBeenCalledTimes(2);
    });

    it('updates with beta track when passed', async () => {
      mockTriggerUpdate.mockResolvedValue(undefined);
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue({
        type: 'SHSW',
        mac: 'MAC',
        gen: 3,
        fw_id: '20240601/2.0.0-beta1',
        ver: '2.0.0-beta1',
        auth: false,
      });

      const { result } = renderHook(() => useFirmwareManager([device1], {}));
      await act(async () => {
        await result.current.updateSelected([device1], 'beta');
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('done');
      expect(mockTriggerUpdate).toHaveBeenCalledWith('beta');
    });

    it('continues updating remaining devices even after one fails', async () => {
      mockTriggerUpdate
        .mockRejectedValueOnce(new Error('Device 1 unreachable')) // DEV001 fails
        .mockResolvedValue(undefined); // DEV002 succeeds
      mockPollUntilOffline.mockResolvedValue(true);
      mockPollUntilOnline.mockResolvedValue(true);
      mockVerifyHost.mockResolvedValue(null);

      const { result } = renderHook(() => useFirmwareManager([device1, device2], {}));
      await act(async () => {
        await result.current.updateSelected([device1, device2]);
      });

      expect(result.current.firmwareStates.DEV001?.status).toBe('failed');
      expect(result.current.firmwareStates.DEV002?.status).toBe('done');
    });
  });
});
