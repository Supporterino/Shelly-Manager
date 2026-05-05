// ── Device info ────────────────────────────────────────────────────────────
export interface ShellyGetDeviceInfoResult {
  name: string;
  id: string; // e.g. "shellyplus2pm-aabbccddee"
  mac: string;
  model: string; // e.g. "SNSW-002P16EU"
  gen: number; // 2, 3, or 4
  fw_id: string;
  ver: string; // firmware version string
  app: string; // "Switch" | "Cover" | "RGB" | "RGBW" | "Dimmer" | …
  profile?: string; // only on multi-profile devices (e.g. "switch" | "cover")
  auth_en: boolean;
  auth_domain: string | null;
  discoverable?: boolean; // absent means true; false = hidden from discovery
}

// ── Shared sub-types ───────────────────────────────────────────────────────
export interface AEnergy {
  total: number; // Wh total since last reset
  by_minute: number[]; // Wh for last 3 minutes
  minute_ts: number; // Unix timestamp of the oldest minute slot
}

export interface Temperature {
  tC: number;
  tF: number;
}

// ── Switch (relay, smart plug) ─────────────────────────────────────────────

export type SwitchInMode = 'momentary' | 'follow' | 'flip' | 'detached' | 'activate';
export type SwitchInitialState = 'off' | 'on' | 'restore_last' | 'match_input';

export interface SwitchConfig {
  id: number;
  name: string | null;
  in_mode: SwitchInMode;
  in_locked: boolean;
  initial_state: SwitchInitialState;
  auto_on: boolean;
  auto_on_delay: number;
  auto_off: boolean;
  auto_off_delay: number;
  // protection limits — device-specific, may be absent
  power_limit?: number | null;
  voltage_limit?: number | null;
  undervoltage_limit?: number | null;
  current_limit?: number | null;
}

export interface SwitchSetConfigResult {
  restart_required: boolean;
}

export interface SwitchStatus {
  id: number;
  source: string;
  output: boolean;
  timer_started_at?: number;
  timer_duration?: number;
  apower?: number;
  voltage?: number;
  current?: number;
  pf?: number;
  freq?: number;
  aenergy?: AEnergy;
  ret_aenergy?: AEnergy;
  temperature?: Temperature;
  errors?: string[];
}

export interface SwitchSetParams {
  id: number;
  on: boolean;
  toggle_after?: number;
}

// ── Light (dimmer, tunable white, CCT) ────────────────────────────────────
export interface LightStatus {
  id: number;
  source: string;
  output: boolean;
  brightness: number;
  white?: number;
  temp?: number;
  apower?: number;
  voltage?: number;
  current?: number;
  aenergy?: AEnergy;
  temperature?: Temperature;
  errors?: string[];
}

export interface LightConfig {
  id: number;
  name: string | null;
  initial_state: 'off' | 'on' | 'restore_last' | 'match_input';
  auto_on: boolean;
  auto_on_delay: number;
  auto_off: boolean;
  auto_off_delay: number;
  transition_duration: number;
  min_brightness_on_toggle: number;
  night_mode?: {
    enable: boolean;
    brightness: number;
    active_between?: [string, string];
  };
}

export interface LightSetConfigResult {
  restart_required: boolean;
}

export interface LightSetParams {
  id: number;
  on?: boolean;
  brightness?: number;
  white?: number;
  temp?: number;
  transition_duration?: number;
}

// ── RGB ──────────────────────────────────────────────────────────────────
export interface RGBStatus {
  id: number;
  source: string;
  output: boolean;
  brightness: number;
  rgb: [number, number, number];
  apower?: number;
  voltage?: number;
  current?: number;
  aenergy?: AEnergy;
  errors?: string[];
}

export interface RGBConfig {
  id: number;
  name: string | null;
  initial_state: 'off' | 'on' | 'restore_last' | 'match_input';
  auto_on: boolean;
  auto_on_delay: number;
  auto_off: boolean;
  auto_off_delay: number;
  transition_duration: number;
  default: {
    brightness: number;
    rgb: [number, number, number];
  };
  night_mode?: {
    enable: boolean;
    brightness: number;
    active_between?: [string, string];
  };
}

export interface RGBSetConfigResult {
  restart_required: boolean;
}

export interface RGBSetParams {
  id: number;
  on?: boolean;
  brightness?: number;
  rgb?: [number, number, number];
  transition_duration?: number;
}

// ── RGBW ─────────────────────────────────────────────────────────────────
export interface RGBWStatus {
  id: number;
  source: string;
  output: boolean;
  brightness: number;
  rgb: [number, number, number];
  white: number;
  apower?: number;
  voltage?: number;
  current?: number;
  aenergy?: AEnergy;
  errors?: string[];
}

export interface RGBWConfig {
  id: number;
  name: string | null;
  initial_state: 'off' | 'on' | 'restore_last' | 'match_input';
  auto_on: boolean;
  auto_on_delay: number;
  auto_off: boolean;
  auto_off_delay: number;
  transition_duration: number;
  default: {
    brightness: number;
    rgb: [number, number, number];
    white: number;
  };
  night_mode?: {
    enable: boolean;
    brightness: number;
    active_between?: [string, string];
  };
}

export interface RGBWSetConfigResult {
  restart_required: boolean;
}

export interface RGBWSetParams {
  id: number;
  on?: boolean;
  brightness?: number;
  rgb?: [number, number, number];
  white?: number;
  transition_duration?: number;
}

// ── Cover ─────────────────────────────────────────────────────────────────
export interface CoverStatus {
  id: number;
  source: string;
  state: 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'calibrating';
  apower?: number;
  voltage?: number;
  current?: number;
  pf?: number;
  freq?: number;
  aenergy?: AEnergy;
  current_pos?: number;
  target_pos?: number;
  move_timeout?: number;
  move_started_at?: number;
  pos_control: boolean;
  last_direction?: 'open' | 'close';
  temperature?: Temperature;
  errors?: string[];
}

export interface CoverMotorConfig {
  idle_power_thr?: number;
  idle_confirm_period?: number;
}

export interface CoverConfig {
  id: number;
  name: string | null;
  motor?: CoverMotorConfig;
  maxtime_open: number;
  maxtime_close: number;
  initial_state: 'open' | 'closed' | 'stopped';
  invert_directions: boolean;
  in_mode: 'one_button' | 'two_button' | 'detached';
  swap_inputs: boolean;
  obstacle_detection: boolean;
  obstacle_action: 'stop' | 'reverse';
  obstacle_power: number;
  obstacle_delay: number;
  safety_switch: boolean;
  safety_action: 'stop' | 'reverse' | 'open';
  safety_allowed_dp: number;
  power_limit?: number | null;
  voltage_limit?: number | null;
  current_limit?: number | null;
  slew_rate?: number | null;
}

export interface CoverSetConfigResult {
  restart_required: boolean;
}

export interface CoverGoToPositionParams {
  id: number;
  pos: number;
}

// ── Input ─────────────────────────────────────────────────────────────────
export interface InputStatus {
  id: number;
  state: boolean | null;
  percent?: number;
  errors?: string[];
}

export type InputType = 'switch' | 'button' | 'analog' | 'count';

export interface InputXTransform {
  expr: string | null; // JS expression using 'x', e.g. "x*0.1"
  unit: string | null; // display unit, e.g. "m/s"
}

export interface InputConfig {
  id: number;
  name: string | null;
  type: InputType;
  enable: boolean;
  // switch + button only
  invert?: boolean;
  factory_reset?: boolean;
  // analog only
  report_thr?: number; // 1.0–50.0 %
  range_map?: [number, number] | null; // [min, max]
  xpercent?: InputXTransform;
  // count only
  count_rep_thr?: number; // 1–2147483647
  freq_window?: number; // 1–3600 s
  freq_rep_thr?: number; // 0–10000 %
  xcounts?: InputXTransform;
  xfreq?: InputXTransform;
}

export interface InputSetConfigResult {
  restart_required: boolean;
}

// ── Temperature sensor ────────────────────────────────────────────────────
export interface TemperatureStatus {
  id: number;
  tC: number | null;
  tF: number | null;
  errors?: string[];
}

// ── Humidity sensor ───────────────────────────────────────────────────────
export interface HumidityStatus {
  id: number;
  rh: number | null;
  errors?: string[];
}

// ── Flood ─────────────────────────────────────────────────────────────────
export interface FloodStatus {
  id: number;
  flood: boolean;
  errors?: string[];
}

// ── Smoke ─────────────────────────────────────────────────────────────────
export interface SmokeStatus {
  id: number;
  alarm: boolean;
  mute: boolean;
  errors?: string[];
}

// ── Illuminance ───────────────────────────────────────────────────────────
export interface IlluminanceStatus {
  id: number;
  lux: number | null;
  illuminance: 'dark' | 'twilight' | 'bright' | null;
  errors?: string[];
}

// ── Motion ────────────────────────────────────────────────────────────────
export interface MotionStatus {
  id: number;
  motion: boolean;
  motion_ts?: number;
  errors?: string[];
}

// ── Device power (battery) ────────────────────────────────────────────────
export interface DevicePowerStatus {
  id: number;
  battery: {
    V: number;
    percent: number | null;
  };
  external?: {
    present: boolean;
  };
  errors?: string[];
}

// ── Energy monitor — dual clamp (EM) ─────────────────────────────────────
export interface EMStatus {
  id: number;
  a_current: number;
  a_voltage: number;
  a_act_power: number;
  a_aprt_power: number;
  a_pf: number;
  a_freq: number;
  b_current: number;
  b_voltage: number;
  b_act_power: number;
  b_aprt_power: number;
  b_pf: number;
  b_freq: number;
  total_current: number;
  total_act_power: number;
  total_aprt_power: number;
  errors?: string[];
}

export interface EMDataStatus {
  id: number;
  total_act: number;
  total_aprt: number;
  a_total_act: number;
  a_total_aprt: number;
  b_total_act: number;
  b_total_aprt: number;
  period: number;
  errors?: string[];
}

// ── Energy monitor — single clamp (EM1) ──────────────────────────────────
export interface EM1Status {
  id: number;
  current: number;
  voltage: number;
  act_power: number;
  aprt_power: number;
  pf: number;
  freq: number;
  errors?: string[];
}

export interface EM1DataStatus {
  id: number;
  total_act: number;
  total_aprt: number;
  period: number;
  errors?: string[];
}

// ── Power meter (PM1) ─────────────────────────────────────────────────────
export interface PM1Status {
  id: number;
  apower: number;
  voltage: number;
  current: number;
  pf: number;
  freq: number;
  aenergy: AEnergy;
  ret_aenergy?: AEnergy;
  errors?: string[];
}

export interface PM1DataStatus {
  id: number;
  total_act: number;
  period: number;
  errors?: string[];
}

// ── Voltmeter ─────────────────────────────────────────────────────────────
export interface VoltmeterStatus {
  id: number;
  voltage: number | null;
  errors?: string[];
}

// ── Schedule job ──────────────────────────────────────────────────────────
export interface ScheduleJob {
  id: number;
  enable: boolean;
  timespec: string;
  calls: Array<{ method: string; params?: Record<string, unknown> }>;
}

// ── WiFi ──────────────────────────────────────────────────────────────────
export interface WiFiConfig {
  ssid: string | null;
  pass: string | null;
  ip: string | null;
  netmask: string | null;
  gw: string | null;
  nameserver: string | null;
  enable: boolean;
}

export interface WiFiSTA1Config {
  ssid: string | null;
  pass: string | null;
  ip: string | null;
  netmask: string | null;
  gw: string | null;
  nameserver: string | null;
  enable: boolean;
}

export interface WiFiStatus {
  ssid: string | null;
  ip: string | null;
  rssi: number;
}

export interface WiFiScanResult {
  ssid: string;
  bssid: string;
  auth: number;
  rssi: number;
  channel: number;
}

export interface APClient {
  mac: string;
  ip: string;
  ip_static: boolean;
  mport: number;
  since: number;
}

// ── Ethernet ──────────────────────────────────────────────────────────────
export interface EthConfig {
  enable: boolean;
  ipv4mode: 'dhcp' | 'static';
  ip: string | null;
  netmask: string | null;
  gw: string | null;
  nameserver: string | null;
}

export interface EthStatus {
  ip: string | null;
}

// ── Device Profile ────────────────────────────────────────────────────────
export interface ShellyProfile {
  name: string;
  current: boolean;
}

// ── System ────────────────────────────────────────────────────────────────
export interface SysConfig {
  device: { name: string };
  location?: { tz: string; lat?: number; lon?: number };
  eco_mode?: boolean;
}

export interface SysStatus {
  mac: string;
  ram_free: number;
  uptime: number;
  time: string | null;
}

export interface TimezoneInfo {
  name: string;
  offset: number;
}

// ── RGBCCT (5-channel light: RGB + Warm White + Cold White) ───────────────
export interface RGBCCTStatus {
  id: number;
  source: string;
  output: boolean;
  brightness: number;
  rgb: [number, number, number];
  white: number;
  temp: number;
  apower?: number;
  voltage?: number;
  current?: number;
  aenergy?: AEnergy;
  errors?: string[];
}

export interface RGBCCTConfig {
  id: number;
  name: string | null;
  initial_state: 'off' | 'on' | 'restore_last' | 'match_input';
  auto_on: boolean;
  auto_on_delay: number;
  auto_off: boolean;
  auto_off_delay: number;
  transition_duration: number;
  default: {
    brightness: number;
    rgb: [number, number, number];
    white: number;
    temp: number;
  };
  night_mode?: {
    enable: boolean;
    brightness: number;
    active_between?: [string, string];
  };
}

export interface RGBCCTSetConfigResult {
  restart_required: boolean;
}

export interface RGBCCTSetParams {
  id: number;
  on?: boolean;
  brightness?: number;
  rgb?: [number, number, number];
  white?: number;
  temp?: number;
  transition_duration?: number;
}

// ── Presence sensor ────────────────────────────────────────────────────────
export interface PresenceStatus {
  id: number;
  presence: boolean;
  motion?: boolean;
  timestamp?: number;
  errors?: string[];
}

// ── PresenceZone sensor ────────────────────────────────────────────────────
export interface PresenceZoneStatus {
  id: number;
  presence: boolean;
  zones?: Record<string, boolean>;
  errors?: string[];
}

// ── BTHome sensor (BLE-bridged) ────────────────────────────────────────────
export interface BTHomeStatus {
  id: number;
  rssi?: number;
  packet_id?: number;
  battery?: number;
  temperature?: number;
  humidity?: number;
  illuminance?: number;
  motion?: boolean;
  window?: boolean;
  button?: number;
  errors?: string[];
}

// ── HTTP client ────────────────────────────────────────────────────────────
export interface HTTPClientStatus {
  id: number;
  connected: boolean;
  errors?: string[];
}

// ── Generic component placeholders (Matter, Serial, Modbus, DALI, XMOD, Zigbee)
export interface GenericComponentStatus {
  id: number;
  [key: string]: unknown;
  errors?: string[];
}

// ── Integration status sub-types ───────────────────────────────────────────
export interface CloudStatus {
  connected: boolean;
  enabled: boolean;
}

export interface MQTTStatus {
  connected: boolean;
  enabled: boolean;
}

export interface OutboundWsStatus {
  connected: boolean;
  enabled: boolean;
}

export interface BLEStatus {
  enabled: boolean;
}

// ── Aggregate status ──────────────────────────────────────────────────────
// Shelly.GetStatus returns an object whose keys are component namespaces:
//   { "switch:0": SwitchStatus, "switch:1": SwitchStatus, ... }
export type ShellyGetStatusResult = Record<string, unknown>;

// ── Method Discovery ───────────────────────────────────────────────────────
export interface ShellyMethodInfo {
  name: string;
}

export interface ShellyListMethodsResult {
  methods: ShellyMethodInfo[];
}

// ── Webhook ───────────────────────────────────────────────────────────────
export interface WebhookHook {
  id: number;
  enable: boolean;
  event: string;
  name?: string;
  urls?: string[];
  active?: boolean;
  condition?: Record<string, unknown>;
  repeat_period?: number;
  window_start?: string;
  window_end?: string;
}

export interface WebhookSupportedEvent {
  event: string;
  name?: string;
  description?: string;
}

// ── KVS ───────────────────────────────────────────────────────────────────
export interface KVSKey {
  key: string;
  etag: string;
}

export interface KVSValue {
  key: string;
  value: unknown;
  etag: string;
}

// ── Script ────────────────────────────────────────────────────────────────
export interface ScriptEntry {
  id: number;
  name: string;
  enable: boolean;
  running: boolean;
  mem_used?: number;
  mem_size?: number;
  cpu_avg?: number;
}

export interface ScriptCodeChunk {
  id: number;
  data: string;
  append: boolean;
}
