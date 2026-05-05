import { fetch } from '@tauri-apps/plugin-http';
import type { StoredDevice } from '../types/device';
import type {
  APClient,
  BTHomeStatus,
  CoverConfig,
  CoverGoToPositionParams,
  CoverSetConfigResult,
  EM1DataStatus,
  EMDataStatus,
  EthConfig,
  EthStatus,
  HTTPClientStatus,
  InputConfig,
  InputSetConfigResult,
  KVSKey,
  KVSValue,
  LightConfig,
  LightSetConfigResult,
  LightSetParams,
  PM1DataStatus,
  PresenceStatus,
  PresenceZoneStatus,
  RGBCCTConfig,
  RGBCCTSetConfigResult,
  RGBCCTSetParams,
  RGBConfig,
  RGBSetConfigResult,
  RGBSetParams,
  RGBWConfig,
  RGBWSetConfigResult,
  RGBWSetParams,
  ScheduleJob,
  ScriptEntry,
  ShellyGetDeviceInfoResult,
  ShellyGetStatusResult,
  ShellyListMethodsResult,
  ShellyProfile,
  SwitchConfig,
  SwitchSetConfigResult,
  SwitchSetParams,
  SysConfig,
  TimezoneInfo,
  WebhookHook,
  WebhookSupportedEvent,
  WiFiConfig,
  WiFiScanResult,
  WiFiSTA1Config,
  WiFiStatus,
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
    config: Partial<Omit<SwitchConfig, 'id'>>,
  ): Promise<SwitchSetConfigResult> {
    return this.call<SwitchSetConfigResult>('Switch.SetConfig', { id, config });
  }

  async switchGetConfig(id: number): Promise<SwitchConfig> {
    return this.call<SwitchConfig>('Switch.GetConfig', { id });
  }

  // ── Light ────────────────────────────────────────────────────────────────

  async lightSet(id: number, params: LightSetParams): Promise<void> {
    await this.call('Light.Set', { ...params, id } as Record<string, unknown>);
  }

  async lightGetConfig(id: number): Promise<LightConfig> {
    return this.call<LightConfig>('Light.GetConfig', { id });
  }

  async lightSetConfig(
    id: number,
    config: Partial<Omit<LightConfig, 'id'>>,
  ): Promise<LightSetConfigResult> {
    return this.call<LightSetConfigResult>('Light.SetConfig', { id, config });
  }

  // ── RGB ──────────────────────────────────────────────────────────────────

  async rgbSet(id: number, params: RGBSetParams): Promise<void> {
    await this.call('RGB.Set', { ...params, id } as Record<string, unknown>);
  }

  async rgbGetConfig(id: number): Promise<RGBConfig> {
    return this.call<RGBConfig>('RGB.GetConfig', { id });
  }

  async rgbSetConfig(
    id: number,
    config: Partial<Omit<RGBConfig, 'id'>>,
  ): Promise<RGBSetConfigResult> {
    return this.call<RGBSetConfigResult>('RGB.SetConfig', { id, config });
  }

  // ── RGBW ─────────────────────────────────────────────────────────────────

  async rgbwSet(id: number, params: RGBWSetParams): Promise<void> {
    await this.call('RGBW.Set', { ...params, id } as Record<string, unknown>);
  }

  async rgbwGetConfig(id: number): Promise<RGBWConfig> {
    return this.call<RGBWConfig>('RGBW.GetConfig', { id });
  }

  async rgbwSetConfig(
    id: number,
    config: Partial<Omit<RGBWConfig, 'id'>>,
  ): Promise<RGBWSetConfigResult> {
    return this.call<RGBWSetConfigResult>('RGBW.SetConfig', { id, config });
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

  async coverGetConfig(id: number): Promise<CoverConfig> {
    return this.call<CoverConfig>('Cover.GetConfig', { id });
  }

  async coverSetConfig(
    id: number,
    config: Partial<Omit<CoverConfig, 'id'>>,
  ): Promise<CoverSetConfigResult> {
    return this.call<CoverSetConfigResult>('Cover.SetConfig', { id, config });
  }

  // ── Input ────────────────────────────────────────────────────────────────

  async inputGetConfig(id: number): Promise<InputConfig> {
    return this.call<InputConfig>('Input.GetConfig', { id });
  }

  async inputSetConfig(
    id: number,
    config: Partial<Omit<InputConfig, 'id'>>,
  ): Promise<InputSetConfigResult> {
    return this.call<InputSetConfigResult>('Input.SetConfig', { id, config });
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

  async scheduleUpdate(id: number, config: Partial<Omit<ScheduleJob, 'id'>>): Promise<void> {
    await this.call('Schedule.Update', { id, config } as Record<string, unknown>);
  }

  async scheduleDeleteAll(): Promise<void> {
    await this.call('Schedule.DeleteAll');
  }

  // ── WiFi ─────────────────────────────────────────────────────────────────

  async wifiGetConfig(): Promise<{
    sta: WiFiConfig;
    sta1?: WiFiSTA1Config;
    ap: { ssid: string | null; pass: string | null; enable: boolean };
  }> {
    return this.call('WiFi.GetConfig');
  }

  async wifiSetConfig(config: {
    sta?: Partial<WiFiConfig>;
    sta1?: Partial<WiFiSTA1Config>;
    ap?: Partial<{ ssid: string | null; pass: string | null; enable: boolean }>;
  }): Promise<void> {
    await this.call('WiFi.SetConfig', { config });
  }

  async wifiGetStatus(): Promise<WiFiStatus> {
    return this.call('WiFi.GetStatus');
  }

  async wifiScan(): Promise<{ results?: WiFiScanResult[]; start?: boolean }> {
    return this.call('WiFi.Scan');
  }

  async wifiListAPClients(): Promise<{ ap_clients: APClient[] }> {
    return this.call('WiFi.ListAPClients');
  }

  // ── Ethernet ─────────────────────────────────────────────────────────────

  async ethGetConfig(): Promise<EthConfig> {
    return this.call('Eth.GetConfig');
  }

  async ethSetConfig(config: Partial<EthConfig>): Promise<void> {
    await this.call('Eth.SetConfig', { config });
  }

  async ethGetStatus(): Promise<EthStatus> {
    return this.call('Eth.GetStatus');
  }

  // ── Device Profile ───────────────────────────────────────────────────────

  async listProfiles(): Promise<{ profiles: ShellyProfile[] }> {
    return this.call('Shelly.ListProfiles');
  }

  async setProfile(name: string): Promise<void> {
    await this.call('Shelly.SetProfile', { name });
  }

  // ── System ───────────────────────────────────────────────────────────────

  async sysGetConfig(): Promise<SysConfig> {
    return this.call('Sys.GetConfig');
  }

  async sysSetConfig(config: Partial<SysConfig>): Promise<void> {
    await this.call('Sys.SetConfig', { config });
  }

  async sysSetTime(time: string): Promise<void> {
    await this.call('Sys.SetTime', { time });
  }

  async detectLocation(): Promise<{ tz: string; lat: number; lon: number }> {
    return this.call('Shelly.DetectLocation');
  }

  async listTimezones(): Promise<{ timezones: TimezoneInfo[] }> {
    return this.call('Shelly.ListTimezones');
  }

  // ── Webhook ──────────────────────────────────────────────────────────────

  async webhookList(): Promise<{ hooks: WebhookHook[] }> {
    return this.call('Webhook.List');
  }

  async webhookListAllSupported(): Promise<{ events: WebhookSupportedEvent[] }> {
    return this.call('Webhook.ListAllSupported');
  }

  async webhookCreate(config: Omit<WebhookHook, 'id'>): Promise<{ id: number }> {
    return this.call('Webhook.Create', config as Record<string, unknown>);
  }

  async webhookUpdate(id: number, config: Partial<Omit<WebhookHook, 'id'>>): Promise<void> {
    await this.call('Webhook.Update', { id, config } as Record<string, unknown>);
  }

  async webhookDelete(id: number): Promise<void> {
    await this.call('Webhook.Delete', { id });
  }

  async webhookDeleteAll(): Promise<void> {
    await this.call('Webhook.DeleteAll');
  }

  // ── KVS ──────────────────────────────────────────────────────────────────

  async kvsList(): Promise<{ items: KVSKey[] }> {
    return this.call('KVS.List');
  }

  async kvsGet(key: string): Promise<KVSValue> {
    return this.call('KVS.Get', { key });
  }

  async kvsGetMany(keys: string[]): Promise<{ items: KVSValue[] }> {
    return this.call('KVS.GetMany', { keys });
  }

  async kvsSet(key: string, value: unknown, etag?: string): Promise<void> {
    const params: Record<string, unknown> = { key, value };
    if (etag !== undefined) params.etag = etag;
    await this.call('KVS.Set', params);
  }

  async kvsDelete(key: string): Promise<void> {
    await this.call('KVS.Delete', { key });
  }

  // ── Script ───────────────────────────────────────────────────────────────

  async scriptList(): Promise<{ scripts: ScriptEntry[] }> {
    return this.call('Script.List');
  }

  async scriptCreate(name: string): Promise<{ id: number }> {
    return this.call('Script.Create', { name });
  }

  async scriptDelete(id: number): Promise<void> {
    await this.call('Script.Delete', { id });
  }

  async scriptStart(id: number): Promise<void> {
    await this.call('Script.Start', { id });
  }

  async scriptStop(id: number): Promise<void> {
    await this.call('Script.Stop', { id });
  }

  async scriptGetCode(id: number): Promise<{ data: string }> {
    return this.call('Script.GetCode', { id });
  }

  async scriptPutCode(id: number, code: string, chunkSize = 4096): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < code.length; i += chunkSize) {
      chunks.push(code.slice(i, i + chunkSize));
    }
    for (let i = 0; i < chunks.length; i++) {
      await this.call('Script.PutCode', {
        id,
        code: chunks[i],
        append: i > 0,
      });
    }
  }

  async scriptEval(id: number, code: string): Promise<{ result?: unknown; error?: string }> {
    return this.call('Script.Eval', { id, code });
  }

  // ── Energy Data ──────────────────────────────────────────────────────────

  async emDataGetStatus(id: number): Promise<EMDataStatus> {
    return this.call<EMDataStatus>('EMData.GetStatus', { id });
  }

  async emDataResetTotals(id: number): Promise<void> {
    await this.call('EMData.ResetTotals', { id });
  }

  async em1DataGetStatus(id: number): Promise<EM1DataStatus> {
    return this.call<EM1DataStatus>('EM1Data.GetStatus', { id });
  }

  async em1DataResetTotals(id: number): Promise<void> {
    await this.call('EM1Data.ResetTotals', { id });
  }

  async pm1DataGetStatus(id: number): Promise<PM1DataStatus> {
    return this.call<PM1DataStatus>('PM1Data.GetStatus', { id });
  }

  async pm1DataResetTotals(id: number): Promise<void> {
    await this.call('PM1Data.ResetTotals', { id });
  }

  // ── RGBCCT ───────────────────────────────────────────────────────────────

  async rgbccctSet(id: number, params: RGBCCTSetParams): Promise<void> {
    await this.call('RGBCCT.Set', { ...params, id } as Record<string, unknown>);
  }

  async rgbccctGetConfig(id: number): Promise<RGBCCTConfig> {
    return this.call<RGBCCTConfig>('RGBCCT.GetConfig', { id });
  }

  async rgbccctSetConfig(
    id: number,
    config: Partial<Omit<RGBCCTConfig, 'id'>>,
  ): Promise<RGBCCTSetConfigResult> {
    return this.call<RGBCCTSetConfigResult>('RGBCCT.SetConfig', { id, config });
  }

  // ── Presence ─────────────────────────────────────────────────────────────

  async presenceGetStatus(id: number): Promise<PresenceStatus> {
    return this.call<PresenceStatus>('Presence.GetStatus', { id });
  }

  // ── PresenceZone ─────────────────────────────────────────────────────────

  async presenceZoneGetStatus(id: number): Promise<PresenceZoneStatus> {
    return this.call<PresenceZoneStatus>('PresenceZone.GetStatus', { id });
  }

  // ── BTHome ───────────────────────────────────────────────────────────────

  async bthomeGetStatus(id: number): Promise<BTHomeStatus> {
    return this.call<BTHomeStatus>('BTHome.GetStatus', { id });
  }

  // ── HTTP Client ──────────────────────────────────────────────────────────

  async httpGetStatus(id: number): Promise<HTTPClientStatus> {
    return this.call<HTTPClientStatus>('HTTP.GetStatus', { id });
  }

  // ── Generic component helpers ────────────────────────────────────────────

  async genericGetStatus(component: string, id: number): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>(`${component}.GetStatus`, { id });
  }

  // ── Method Discovery ─────────────────────────────────────────────────────

  async listMethods(): Promise<ShellyListMethodsResult> {
    return this.call<ShellyListMethodsResult>('Shelly.ListMethods');
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
