import { fetch } from '@tauri-apps/plugin-http';
import type { StoredDevice } from '../types/device';
import type {
  CoverGoToPositionParams,
  LightSetParams,
  RGBSetParams,
  RGBWSetParams,
  ScheduleJob,
  ShellyGetDeviceInfoResult,
  ShellyGetStatusResult,
  SwitchSetParams,
} from '../types/shelly';
import { computeDigestAuth, parseWwwAuthenticate } from '../utils/auth';
import { buildRpcFrame, parseRpcResponse } from '../utils/rpc';

export class ShellyError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'ShellyError';
  }
}

export class ShellyClient {
  private readonly baseUrl: string;

  constructor(private readonly device: StoredDevice) {
    this.baseUrl = `http://${device.ip}:${device.port}`;
  }

  // ── Core transport ───────────────────────────────────────────────────────

  async call<T>(
    method: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const frame = buildRpcFrame(method, params);

    // First attempt — no auth
    const response = await fetch(`${this.baseUrl}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frame),
      signal,
    });

    if (response.status === 401 && this.device.auth) {
      // Parse WWW-Authenticate header for digest challenge
      const wwwAuth = response.headers.get('WWW-Authenticate') ?? '';
      const challenge = parseWwwAuthenticate(wwwAuth);
      if (challenge) {
        const auth = await computeDigestAuth(
          challenge.realm,
          challenge.nonce,
          this.device.auth.password,
        );
        const authFrame = buildRpcFrame(method, params, auth);
        const authResponse = await fetch(`${this.baseUrl}/rpc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authFrame),
          signal,
        });
        if (!authResponse.ok) {
          throw new ShellyError(`Auth failed: ${authResponse.status} ${authResponse.statusText}`);
        }
        const body = await authResponse.json();
        return parseRpcResponse<T>(body);
      }
    }

    if (!response.ok) {
      throw new ShellyError(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    return parseRpcResponse<T>(body);
  }

  // ── Device-level ─────────────────────────────────────────────────────────

  async getDeviceInfo(): Promise<ShellyGetDeviceInfoResult> {
    return this.call<ShellyGetDeviceInfoResult>('Shelly.GetDeviceInfo');
  }

  async getStatus(signal?: AbortSignal): Promise<ShellyGetStatusResult> {
    return this.call<ShellyGetStatusResult>('Shelly.GetStatus', undefined, signal);
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>('Shelly.GetConfig');
  }

  async reboot(): Promise<void> {
    await this.call('Shelly.Reboot');
  }

  async factoryReset(): Promise<void> {
    await this.call('Shelly.FactoryReset');
  }

  async checkForUpdate(): Promise<{
    stable?: { version: string };
    beta?: { version: string };
  }> {
    return this.call('Shelly.CheckForUpdate');
  }

  async triggerUpdate(stage: 'stable' | 'beta' = 'stable'): Promise<void> {
    await this.call('Shelly.Update', { stage });
  }

  async setAuth(user: string, realm: string, ha1: string): Promise<void> {
    await this.call('Shelly.SetAuth', { user, realm, ha1 });
  }

  // ── Switch ───────────────────────────────────────────────────────────────

  async switchSet(id: number, on: boolean, toggleAfter?: number): Promise<void> {
    const params: SwitchSetParams = { id, on };
    if (toggleAfter !== undefined) params.toggle_after = toggleAfter;
    await this.call('Switch.Set', params as unknown as Record<string, unknown>);
  }

  async switchToggle(id: number): Promise<void> {
    await this.call('Switch.Toggle', { id });
  }

  async switchSetConfig(
    id: number,
    config: { name?: string; auto_off?: boolean; auto_off_delay?: number },
  ): Promise<void> {
    await this.call('Switch.SetConfig', { id, config });
  }

  // ── Light ────────────────────────────────────────────────────────────────

  async lightSet(id: number, params: LightSetParams): Promise<void> {
    await this.call('Light.Set', { ...params, id } as Record<string, unknown>);
  }

  // ── RGB ──────────────────────────────────────────────────────────────────

  async rgbSet(id: number, params: RGBSetParams): Promise<void> {
    await this.call('RGB.Set', { ...params, id } as Record<string, unknown>);
  }

  // ── RGBW ─────────────────────────────────────────────────────────────────

  async rgbwSet(id: number, params: RGBWSetParams): Promise<void> {
    await this.call('RGBW.Set', { ...params, id } as Record<string, unknown>);
  }

  // ── Cover ────────────────────────────────────────────────────────────────

  async coverOpen(id: number): Promise<void> {
    await this.call('Cover.Open', { id });
  }

  async coverClose(id: number): Promise<void> {
    await this.call('Cover.Close', { id });
  }

  async coverStop(id: number): Promise<void> {
    await this.call('Cover.Stop', { id });
  }

  async coverGoToPosition(id: number, pos: number): Promise<void> {
    const params: CoverGoToPositionParams = { id, pos };
    await this.call('Cover.GoToPosition', params as unknown as Record<string, unknown>);
  }

  async coverCalibrate(id: number): Promise<void> {
    await this.call('Cover.Calibrate', { id });
  }

  // ── Smoke ────────────────────────────────────────────────────────────────

  async smokeMute(id: number): Promise<void> {
    await this.call('Smoke.Mute', { id });
  }

  // ── Schedules ────────────────────────────────────────────────────────────

  async scheduleList(): Promise<{ jobs: ScheduleJob[] }> {
    return this.call('Schedule.List');
  }

  async scheduleCreate(job: Omit<ScheduleJob, 'id'>): Promise<{ id: number }> {
    return this.call('Schedule.Create', job as Record<string, unknown>);
  }

  async scheduleDelete(id: number): Promise<void> {
    await this.call('Schedule.Delete', { id });
  }
}

/**
 * Verify a candidate IP is a Shelly Gen2+ device by calling GET /shelly.
 * Returns the device info or null if not a Shelly device.
 */
export async function verifyShellyHost(
  ip: string,
  port = 80,
): Promise<{
  type: string;
  mac: string;
  gen: number;
  /** Firmware build ID, e.g. "20210720-153353/0.6.7-gc36674b" */
  fw_id: string;
  /** Firmware version string, e.g. "0.6.7" */
  ver: string;
  auth: boolean;
} | null> {
  try {
    const response = await fetch(`http://${ip}:${port}/shelly`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.mac || data.gen < 2) return null;
    return data;
  } catch {
    return null;
  }
}
