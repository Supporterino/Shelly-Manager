export type DeviceGeneration = 'gen2' | 'gen3' | 'gen4'

/**
 * The primary functional category of a device.
 * Determined once at add-time from Shelly.GetStatus component keys.
 * Stored in StoredDevice so the dashboard can render the right icon
 * and inline control without re-fetching status.
 */
export type DeviceType =
  | 'switch'   // Switch.* — relay, smart plug (no dimming)
  | 'dimmer'   // Light.* with brightness only (no colour)
  | 'cct'      // Light.* with brightness + colour temperature
  | 'rgb'      // Light.* in RGB mode (RGB.*)
  | 'rgbw'     // Light.* in RGBW mode (RGBW.*)
  | 'cover'    // Cover.* — blinds, shutters, garage doors
  | 'sensor'   // Read-only: temperature, humidity, flood, smoke, motion…
  | 'energy'   // EM.* / EM1.* / PM1.* — energy monitoring only, no relay
  | 'input'    // Input.* — button / contact input with no output
  | 'unknown'  // Fallback; shows raw JSON status

export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'error'

export interface StoredDevice {
  id: string             // MAC address (no colons, uppercase) — stable primary key
  name: string           // User-given label or device-reported name
  ip: string
  port: number           // default 80
  generation: DeviceGeneration
  model: string          // Shelly model string, e.g. "Plus2PM", "Pro4PM"
  app: string            // Shelly app string, e.g. "Switch", "Cover", "RGB"
  type: DeviceType       // Derived once at add-time — see deviceTypeMap.ts
  components: ShellyComponentSummary[]
  auth?: { username: string; password: string }
  addedAt: number        // unix ms
  lastSeenAt: number     // unix ms
}

/**
 * Lightweight summary of a single RPC component stored alongside the device.
 * Used to know which controls to render without a live status fetch.
 */
export interface ShellyComponentSummary {
  type: ShellyComponentType  // 'switch' | 'light' | 'cover' | ...
  id: number                 // Component instance index (0, 1, 2, …)
  name?: string              // Optional user-set name for the channel
}

export type ShellyComponentType =
  | 'switch'
  | 'light'
  | 'light_cct'
  | 'rgb'
  | 'rgbw'
  | 'cover'
  | 'input'
  | 'temperature'
  | 'humidity'
  | 'flood'
  | 'smoke'
  | 'illuminance'
  | 'motion'
  | 'devicepower'
  | 'voltmeter'
  | 'em'
  | 'em1'
  | 'pm1'

// Note: 'light_cct' is an internal sub-type — Shelly's GetStatus key is always 'light:N'
// for both plain dimmers and CCT devices. The distinction is stored in
// ShellyComponentSummary.type so ComponentList can dispatch correctly.
// The status lookup key is always derived as: type === 'light_cct' ? `light:${id}` : `${type}:${id}`
