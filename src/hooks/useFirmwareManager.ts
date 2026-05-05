import { useCallback, useState } from 'react';
import { ShellyClient, verifyShellyHost } from '../services/shellyClient';
import type { StoredDevice } from '../types/device';
import { pollUntilOffline, pollUntilOnline } from '../utils/firmware';

// ── Per-device firmware state ─────────────────────────────────────────────────

export type FirmwareStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'updating'
  | 'done'
  | 'failed'
  | 'skipped';

export interface DeviceFirmwareState {
  status: FirmwareStatus;
  /** Version string displayed in the "Current Version" badge */
  currentVersion: string;
  /** Available version for the active track, only set when status === 'update-available' */
  availableVersion?: string;
  /** Which track this state was checked against (stable | beta) */
  updateTrack: 'stable' | 'beta';
  /** 0-indexed poll step (0 = not yet polling) — drives the progress bar */
  pollStep: number;
  /** Human-readable error message, only set when status === 'failed' */
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive the current version string for a device.
 * Prefers `sys.fw_id` from the live status payload; falls back to `device.model`.
 */
export function extractCurrentVersion(
  device: StoredDevice,
  liveStatus?: Record<string, unknown>,
): string {
  const sys = liveStatus?.sys as Record<string, unknown> | undefined;
  return (sys?.fw_id as string | undefined) ?? device.model;
}

/** Possible shapes returned by Shelly.CheckForUpdate (direct or wrapped). */
interface CheckForUpdateResult {
  stable?: { version?: string } | null;
  beta?: { version?: string } | null;
  available_updates?: {
    stable?: { version?: string } | null;
    beta?: { version?: string } | null;
  } | null;
}

/**
 * Extract the version string for a given track from a CheckForUpdate response.
 * Handles both direct `{ stable?, beta? }` and wrapped `{ available_updates: { stable?, beta? } }`
 * shapes, plus nullish values.
 */
export function extractTrackVersion(
  result: CheckForUpdateResult,
  track: 'stable' | 'beta',
): string | undefined {
  const direct = track === 'beta' ? result.beta : result.stable;
  if (direct && typeof direct === 'object' && direct.version) {
    return direct.version;
  }
  const wrapped =
    track === 'beta' ? result.available_updates?.beta : result.available_updates?.stable;
  if (wrapped && typeof wrapped === 'object' && wrapped.version) {
    return wrapped.version;
  }
  return undefined;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFirmwareManager(
  devices: StoredDevice[],
  liveStatuses: Record<string, Record<string, unknown>>,
) {
  const [firmwareStates, setFirmwareStates] = useState<Record<string, DeviceFirmwareState>>(() =>
    Object.fromEntries(
      devices.map((d) => [
        d.id,
        {
          status: 'idle' as FirmwareStatus,
          currentVersion: extractCurrentVersion(d, liveStatuses[d.id]),
          updateTrack: d.updateTrack ?? 'stable',
          pollStep: 0,
        },
      ]),
    ),
  );

  // Ensure newly-added devices get an entry without resetting existing ones
  const ensureEntries = useCallback(
    (devs: StoredDevice[]) => {
      setFirmwareStates((prev) => {
        const patch: Record<string, DeviceFirmwareState> = {};
        for (const d of devs) {
          if (!prev[d.id]) {
            patch[d.id] = {
              status: 'idle',
              currentVersion: extractCurrentVersion(d, liveStatuses[d.id]),
              updateTrack: d.updateTrack ?? 'stable',
              pollStep: 0,
            };
          }
        }
        return Object.keys(patch).length ? { ...prev, ...patch } : prev;
      });
    },
    [liveStatuses],
  );

  const patchState = useCallback((deviceId: string, patch: Partial<DeviceFirmwareState>) => {
    setFirmwareStates((prev) => ({
      ...prev,
      [deviceId]: { ...prev[deviceId], ...patch },
    }));
  }, []);

  // ── Single device operations ───────────────────────────────────────────────

  const checkDevice = useCallback(
    async (device: StoredDevice, track: 'stable' | 'beta' = 'stable') => {
      patchState(device.id, { status: 'checking', error: undefined, updateTrack: track });
      try {
        const client = new ShellyClient(device);
        const [result, deviceInfo] = await Promise.all([
          client.checkForUpdate(),
          client.getDeviceInfo().catch(() => null),
        ]);
        // Use the clean version string from GetDeviceInfo if available
        const versionPatch: Partial<DeviceFirmwareState> = deviceInfo?.ver
          ? { currentVersion: deviceInfo.ver }
          : {};
        const trackVersion = extractTrackVersion(result as CheckForUpdateResult, track);
        if (trackVersion) {
          patchState(device.id, {
            status: 'update-available',
            availableVersion: trackVersion,
            updateTrack: track,
            ...versionPatch,
          });
        } else {
          patchState(device.id, {
            status: 'up-to-date',
            availableVersion: undefined,
            updateTrack: track,
            ...versionPatch,
          });
        }
      } catch (err) {
        patchState(device.id, {
          status: 'failed',
          error: (err as Error).message,
        });
      }
    },
    [patchState],
  );

  const updateDevice = useCallback(
    async (device: StoredDevice, track: 'stable' | 'beta' = 'stable') => {
      patchState(device.id, {
        status: 'updating',
        pollStep: 0,
        error: undefined,
        updateTrack: track,
      });
      try {
        await new ShellyClient(device).triggerUpdate(track);

        // Phase 1: wait for the device to go offline.
        // Shelly.Update returns immediately — the device downloads firmware in
        // the background while its HTTP server stays responsive.  We MUST wait
        // until the device stops responding before polling for it to come back;
        // otherwise the device appears "online" before any update has occurred.
        const wentOffline = await pollUntilOffline(device.ip, device.port);
        if (!wentOffline) {
          throw new Error('Device did not go offline — update may not have started');
        }

        // Phase 2: wait for the device to reboot and come back online.
        const online = await pollUntilOnline(device.ip, device.port, (step) =>
          patchState(device.id, { pollStep: step }),
        );
        if (!online) {
          throw new Error('Device did not come back online after update');
        }

        // Re-read version from /shelly after the device reboots.
        // The Shelly API returns fw_id (build ID) and ver (version string).
        const info = await verifyShellyHost(device.ip, device.port);
        patchState(device.id, {
          status: 'done',
          currentVersion:
            info?.fw_id ?? info?.ver ?? firmwareStates[device.id]?.currentVersion ?? device.model,
          availableVersion: undefined,
          pollStep: 0,
        });
      } catch (err) {
        patchState(device.id, {
          status: 'failed',
          error: (err as Error).message,
          pollStep: 0,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patchState, firmwareStates],
  );

  // ── Bulk operations ────────────────────────────────────────────────────────

  /** Check all given devices in parallel */
  const checkAll = useCallback(
    async (devicesToCheck: StoredDevice[], track: 'stable' | 'beta' = 'stable') => {
      ensureEntries(devicesToCheck);
      await Promise.all(devicesToCheck.map((d) => checkDevice(d, track)));
    },
    [checkDevice, ensureEntries],
  );

  /** Check a selected subset of devices in parallel */
  const checkSelected = useCallback(
    async (devicesToCheck: StoredDevice[], track: 'stable' | 'beta' = 'stable') => {
      ensureEntries(devicesToCheck);
      await Promise.all(devicesToCheck.map((d) => checkDevice(d, track)));
    },
    [checkDevice, ensureEntries],
  );

  /** Update devices sequentially (safer for LAN stability) */
  const updateSelected = useCallback(
    async (devicesToUpdate: StoredDevice[], track: 'stable' | 'beta' = 'stable') => {
      for (const device of devicesToUpdate) {
        await updateDevice(device, track);
      }
    },
    [updateDevice],
  );

  return {
    firmwareStates,
    checkDevice,
    updateDevice,
    checkAll,
    checkSelected,
    updateSelected,
  };
}
