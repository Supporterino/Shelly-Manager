import { invoke } from '@tauri-apps/api/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { StoredDevice } from '../types/device'
import type { DiscoveredHost, DiscoveryMethod, DiscoveryOptions } from '../types/discovery'
import { ShellyClient } from './shellyClient'
import { extractComponents } from '../utils/deviceTypeMap'
import { deriveDeviceType } from '../utils/deviceTypeMap'

interface ShellyInfo {
  type: string
  mac: string
  gen: number
  fw: string
  auth: boolean
}

/**
 * Calls GET /shelly on a candidate IP to confirm it is a Gen2+ Shelly device.
 * Returns device info or null if not a supported Shelly device.
 */
export async function verifyShellyHost(
  ip: string,
  port = 80
): Promise<ShellyInfo | null> {
  try {
    const response = await fetch(`http://${ip}:${port}/shelly`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const data = await response.json() as ShellyInfo
    if (!data.mac || data.gen < 2) return null
    return data
  } catch {
    return null
  }
}

/**
 * Convert a Shelly MAC string to a normalized device ID (no colons, uppercase).
 */
function normalizeMAC(mac: string): string {
  return mac.replace(/:/g, '').toUpperCase()
}

/**
 * Convert Shelly device generation number to our internal generation string.
 */
function genNumberToString(gen: number): StoredDevice['generation'] {
  if (gen === 3) return 'gen3'
  if (gen === 4) return 'gen4'
  return 'gen2'
}

/**
 * Runs the selected discovery methods concurrently, verifies each candidate
 * against the Shelly /shelly endpoint, fetches device info and status,
 * and returns fully constructed StoredDevice objects ready to add.
 *
 * @param methods - Which discovery methods to run
 * @param options - Per-method options (CIDR for scan, timeout, port)
 * @param onProgress - Called as each raw candidate host is found
 */
export async function runDiscovery(
  methods: DiscoveryMethod[],
  options: DiscoveryOptions,
  onProgress: (host: DiscoveredHost) => void
): Promise<StoredDevice[]> {
  const { cidr, timeoutSecs = 5, port = 80 } = options

  // --- Step 1: Run selected methods concurrently ---
  const allHosts: DiscoveredHost[] = []

  const promises: Promise<void>[] = []

  if (methods.includes('mdns')) {
    promises.push(
      invoke<DiscoveredHost[]>('discover_mdns', { timeoutSecs })
        .then((hosts) => {
          for (const h of hosts) {
            onProgress(h)
            allHosts.push(h)
          }
        })
        .catch(console.error)
    )
  }

  if (methods.includes('scan') && cidr) {
    promises.push(
      invoke<DiscoveredHost[]>('scan_subnet', {
        cidr,
        port,
        timeoutMs: 500,
      })
        .then((hosts) => {
          for (const h of hosts) {
            onProgress(h)
            allHosts.push(h)
          }
        })
        .catch(console.error)
    )
  }

  await Promise.all(promises)

  // --- Step 2: Deduplicate by IP (keep first seen) ---
  const seen = new Set<string>()
  const uniqueHosts = allHosts.filter((h) => {
    if (seen.has(h.ip)) return false
    seen.add(h.ip)
    return true
  })

  // --- Steps 3–8: Verify and build StoredDevice for each candidate ---
  const devices: StoredDevice[] = []

  await Promise.all(
    uniqueHosts.map(async (host) => {
      const shellyInfo = await verifyShellyHost(host.ip, host.port)
      if (!shellyInfo) return  // Not a valid Shelly Gen2+ device

      const id = normalizeMAC(shellyInfo.mac)
      const tempDevice: StoredDevice = {
        id,
        name: id,
        ip: host.ip,
        port: host.port,
        generation: genNumberToString(shellyInfo.gen),
        model: '',
        app: '',
        type: 'unknown',
        components: [],
        addedAt: Date.now(),
        lastSeenAt: Date.now(),
      }

      try {
        const client = new ShellyClient(tempDevice)

        // Fetch device info and status in parallel
        const [info, status] = await Promise.all([
          client.getDeviceInfo(),
          client.getStatus(),
        ])

        const components = extractComponents(status, info.app)
        const type = deriveDeviceType(info.app, components)

        devices.push({
          id,
          name: info.name || id,
          ip: host.ip,
          port: host.port,
          generation: genNumberToString(shellyInfo.gen),
          model: info.model,
          app: info.app,
          type,
          components,
          addedAt: Date.now(),
          lastSeenAt: Date.now(),
        })
      } catch (err) {
        console.warn(`Failed to fetch info for device at ${host.ip}:`, err)
      }
    })
  )

  return devices
}

/**
 * Verify a single manually-entered host and build a StoredDevice if valid.
 * Returns null if the host is not a supported Shelly Gen2+ device.
 */
export async function verifyManualHost(
  ip: string,
  port = 80,
  auth?: { username: string; password: string }
): Promise<StoredDevice | null> {
  const shellyInfo = await verifyShellyHost(ip, port)
  if (!shellyInfo) return null

  const id = normalizeMAC(shellyInfo.mac)
  const tempDevice: StoredDevice = {
    id,
    name: id,
    ip,
    port,
    generation: genNumberToString(shellyInfo.gen),
    model: '',
    app: '',
    type: 'unknown',
    components: [],
    ...(auth ? { auth } : {}),
    addedAt: Date.now(),
    lastSeenAt: Date.now(),
  }

  try {
    const client = new ShellyClient(tempDevice)
    const [info, status] = await Promise.all([
      client.getDeviceInfo(),
      client.getStatus(),
    ])
    const components = extractComponents(status, info.app)
    const type = deriveDeviceType(info.app, components)

    return {
      id,
      name: info.name || id,
      ip,
      port,
      generation: genNumberToString(shellyInfo.gen),
      model: info.model,
      app: info.app,
      type,
      components,
      ...(auth ? { auth } : {}),
      addedAt: Date.now(),
      lastSeenAt: Date.now(),
    }
  } catch (err) {
    console.warn(`Failed to fetch info for manual device at ${ip}:`, err)
    return null
  }
}
