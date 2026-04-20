// ── Device info ────────────────────────────────────────────────────────────
export interface ShellyGetDeviceInfoResult {
  name: string
  id: string       // e.g. "shellyplus2pm-aabbccddee"
  mac: string
  model: string    // e.g. "SNSW-002P16EU"
  gen: number      // 2, 3, or 4
  fw_id: string
  ver: string      // firmware version string
  app: string      // "Switch" | "Cover" | "RGB" | "RGBW" | "Dimmer" | …
  profile?: string // only on multi-profile devices (e.g. "switch" | "cover")
  auth_en: boolean
  auth_domain: string | null
  discoverable?: boolean // absent means true; false = hidden from discovery
}

// ── Shared sub-types ───────────────────────────────────────────────────────
export interface AEnergy {
  total: number         // Wh total since last reset
  by_minute: number[]  // Wh for last 3 minutes
  minute_ts: number    // Unix timestamp of the oldest minute slot
}

export interface Temperature {
  tC: number
  tF: number
}

// ── Switch (relay, smart plug) ─────────────────────────────────────────────
export interface SwitchStatus {
  id: number
  source: string
  output: boolean
  timer_started_at?: number
  timer_duration?: number
  apower?: number
  voltage?: number
  current?: number
  pf?: number
  freq?: number
  aenergy?: AEnergy
  ret_aenergy?: AEnergy
  temperature?: Temperature
  errors?: string[]
}

export interface SwitchSetParams {
  id: number
  on: boolean
  toggle_after?: number
}

// ── Light (dimmer, tunable white, CCT) ────────────────────────────────────
export interface LightStatus {
  id: number
  source: string
  output: boolean
  brightness: number
  white?: number
  temp?: number
  apower?: number
  voltage?: number
  current?: number
  aenergy?: AEnergy
  temperature?: Temperature
  errors?: string[]
}

export interface LightSetParams {
  id: number
  on?: boolean
  brightness?: number
  white?: number
  temp?: number
  transition_duration?: number
}

// ── RGB ──────────────────────────────────────────────────────────────────
export interface RGBStatus {
  id: number
  source: string
  output: boolean
  brightness: number
  rgb: [number, number, number]
  apower?: number
  voltage?: number
  current?: number
  aenergy?: AEnergy
  errors?: string[]
}

export interface RGBSetParams {
  id: number
  on?: boolean
  brightness?: number
  rgb?: [number, number, number]
  transition_duration?: number
}

// ── RGBW ─────────────────────────────────────────────────────────────────
export interface RGBWStatus {
  id: number
  source: string
  output: boolean
  brightness: number
  rgb: [number, number, number]
  white: number
  apower?: number
  voltage?: number
  current?: number
  aenergy?: AEnergy
  errors?: string[]
}

export interface RGBWSetParams {
  id: number
  on?: boolean
  brightness?: number
  rgb?: [number, number, number]
  white?: number
  transition_duration?: number
}

// ── Cover ─────────────────────────────────────────────────────────────────
export interface CoverStatus {
  id: number
  source: string
  state: 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'calibrating'
  apower?: number
  voltage?: number
  current?: number
  pf?: number
  freq?: number
  aenergy?: AEnergy
  current_pos?: number
  target_pos?: number
  move_timeout?: number
  move_started_at?: number
  pos_control: boolean
  last_direction?: 'open' | 'close'
  temperature?: Temperature
  errors?: string[]
}

export interface CoverGoToPositionParams {
  id: number
  pos: number
}

// ── Input ─────────────────────────────────────────────────────────────────
export interface InputStatus {
  id: number
  state: boolean | null
  percent?: number
  errors?: string[]
}

// ── Temperature sensor ────────────────────────────────────────────────────
export interface TemperatureStatus {
  id: number
  tC: number | null
  tF: number | null
  errors?: string[]
}

// ── Humidity sensor ───────────────────────────────────────────────────────
export interface HumidityStatus {
  id: number
  rh: number | null
  errors?: string[]
}

// ── Flood ─────────────────────────────────────────────────────────────────
export interface FloodStatus {
  id: number
  flood: boolean
  errors?: string[]
}

// ── Smoke ─────────────────────────────────────────────────────────────────
export interface SmokeStatus {
  id: number
  alarm: boolean
  mute: boolean
  errors?: string[]
}

// ── Illuminance ───────────────────────────────────────────────────────────
export interface IlluminanceStatus {
  id: number
  lux: number | null
  illuminance: 'dark' | 'twilight' | 'bright' | null
  errors?: string[]
}

// ── Motion ────────────────────────────────────────────────────────────────
export interface MotionStatus {
  id: number
  motion: boolean
  motion_ts?: number
  errors?: string[]
}

// ── Device power (battery) ────────────────────────────────────────────────
export interface DevicePowerStatus {
  id: number
  battery: {
    V: number
    percent: number | null
  }
  external?: {
    present: boolean
  }
  errors?: string[]
}

// ── Energy monitor — dual clamp (EM) ─────────────────────────────────────
export interface EMStatus {
  id: number
  a_current: number
  a_voltage: number
  a_act_power: number
  a_aprt_power: number
  a_pf: number
  a_freq: number
  b_current: number
  b_voltage: number
  b_act_power: number
  b_aprt_power: number
  b_pf: number
  b_freq: number
  total_current: number
  total_act_power: number
  total_aprt_power: number
  errors?: string[]
}

// ── Energy monitor — single clamp (EM1) ──────────────────────────────────
export interface EM1Status {
  id: number
  current: number
  voltage: number
  act_power: number
  aprt_power: number
  pf: number
  freq: number
  errors?: string[]
}

// ── Power meter (PM1) ─────────────────────────────────────────────────────
export interface PM1Status {
  id: number
  apower: number
  voltage: number
  current: number
  pf: number
  freq: number
  aenergy: AEnergy
  ret_aenergy?: AEnergy
  errors?: string[]
}

// ── Voltmeter ─────────────────────────────────────────────────────────────
export interface VoltmeterStatus {
  id: number
  voltage: number | null
  errors?: string[]
}

// ── Schedule job ──────────────────────────────────────────────────────────
export interface ScheduleJob {
  id: number
  enable: boolean
  timespec: string
  calls: Array<{ method: string; params?: Record<string, unknown> }>
}

// ── Aggregate status ──────────────────────────────────────────────────────
// Shelly.GetStatus returns an object whose keys are component namespaces:
//   { "switch:0": SwitchStatus, "switch:1": SwitchStatus, ... }
export type ShellyGetStatusResult = Record<string, unknown>
