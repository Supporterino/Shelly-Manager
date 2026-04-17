import type {
  DeviceType,
  ShellyComponentSummary,
  ShellyComponentType,
} from '../types/device'
import type { ShellyGetStatusResult } from '../types/shelly'

// Maps GetStatus key prefixes to internal ShellyComponentType
const NS_TO_COMPONENT_TYPE: Record<string, ShellyComponentType> = {
  switch: 'switch',
  light: 'light',
  rgb: 'rgb',
  rgbw: 'rgbw',
  cover: 'cover',
  input: 'input',
  temperature: 'temperature',
  humidity: 'humidity',
  flood: 'flood',
  smoke: 'smoke',
  illuminance: 'illuminance',
  motion: 'motion',
  devicepower: 'devicepower',
  voltmeter: 'voltmeter',
  em: 'em',
  em1: 'em1',
  pm1: 'pm1',
}

// Sort priority: actuators first, sensors last, energy in-between
const COMPONENT_SORT_ORDER: Record<ShellyComponentType, number> = {
  switch: 0,
  light: 1,
  light_cct: 1,
  rgb: 2,
  rgbw: 3,
  cover: 4,
  em: 5,
  em1: 6,
  pm1: 7,
  temperature: 8,
  humidity: 9,
  flood: 10,
  smoke: 11,
  illuminance: 12,
  motion: 13,
  devicepower: 14,
  voltmeter: 15,
  input: 16,
}

function componentSortOrder(
  a: ShellyComponentSummary,
  b: ShellyComponentSummary
): number {
  const aPriority = COMPONENT_SORT_ORDER[a.type] ?? 99
  const bPriority = COMPONENT_SORT_ORDER[b.type] ?? 99
  if (aPriority !== bPriority) return aPriority - bPriority
  return a.id - b.id
}

function namespaceToComponentType(
  ns: string
): ShellyComponentType | null {
  return (NS_TO_COMPONENT_TYPE[ns] as ShellyComponentType) ?? null
}

/**
 * Given the result of Shelly.GetStatus, extract an ordered list of
 * component summaries (type + id) that the device exposes.
 */
export function extractComponents(
  status: ShellyGetStatusResult,
  app: string
): ShellyComponentSummary[] {
  const isCCT =
    app.toLowerCase().includes('cct') ||
    app.toLowerCase().includes('duo') ||
    Object.keys(status).some(
      (k) =>
        k.startsWith('light:') &&
        typeof (status[k] as Record<string, unknown>)?.temp === 'number'
    )

  const components: ShellyComponentSummary[] = []
  for (const key of Object.keys(status)) {
    const colonIndex = key.indexOf(':')
    if (colonIndex === -1) continue
    const ns = key.slice(0, colonIndex)
    const idStr = key.slice(colonIndex + 1)
    const id = Number(idStr)
    if (isNaN(id)) continue

    let type = namespaceToComponentType(ns)
    if (type === 'light' && isCCT) type = 'light_cct'
    if (type) components.push({ type, id })
  }

  return components.sort(componentSortOrder)
}

/**
 * Derive the top-level DeviceType from the component list and the
 * Shelly `app` string.
 */
export function deriveDeviceType(
  app: string,
  components: ShellyComponentSummary[]
): DeviceType {
  const appLower = app.toLowerCase()

  if (appLower.includes('rgb') && appLower.includes('w')) return 'rgbw'
  if (appLower.includes('rgb')) return 'rgb'
  if (appLower.includes('cover')) return 'cover'
  if (appLower.includes('dimmer') || appLower.includes('light')) {
    const hasCCT =
      components.some((c) => c.type === 'light_cct') ||
      appLower.includes('cct')
    return hasCCT ? 'cct' : 'dimmer'
  }
  if (appLower.includes('switch') || appLower.includes('plug')) return 'switch'
  if (appLower.includes('em') || appLower.includes('pm')) return 'energy'
  if (
    appLower.includes('sensor') ||
    appLower.includes('ht') ||
    appLower.includes('flood') ||
    appLower.includes('smoke') ||
    appLower.includes('motion') ||
    appLower.includes('presence') ||
    appLower.includes('door') ||
    appLower.includes('window')
  )
    return 'sensor'
  if (appLower.includes('input') || appLower.includes('button')) return 'input'

  // Fallback: infer from components
  const types = new Set(components.map((c) => c.type))
  if (types.has('rgb')) return 'rgb'
  if (types.has('rgbw')) return 'rgbw'
  if (types.has('light') || types.has('light_cct')) return 'dimmer'
  if (types.has('cover')) return 'cover'
  if (types.has('switch')) return 'switch'
  if (types.has('em') || types.has('em1') || types.has('pm1')) return 'energy'
  return 'unknown'
}
