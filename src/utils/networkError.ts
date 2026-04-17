/**
 * Classifies a caught network error into one of four kinds so the UI can
 * show the most actionable message and icon.
 *
 * Classification is based on the error message string because Tauri's
 * plugin-http surfaces OS-level errors as plain strings rather than typed
 * error objects.
 */

export type NetworkErrorKind = 'no_network' | 'unreachable' | 'auth' | 'unknown'

/**
 * Patterns whose presence in the error message string indicates the device
 * cannot be reached but the OS still has a network interface up.
 */
const UNREACHABLE_PATTERNS = [
  'connection refused',
  'econnrefused',
  'timed out',
  'etimedout',
  'connect timeout',
  'host unreachable',
  'no route to host',
  'ehostunreach',
  'connection reset',
  'econnreset',
  'network unreachable', // caught below first
]

/**
 * Patterns that indicate no working network interface at all.
 */
const NO_NETWORK_PATTERNS = [
  'enetunreach',
  'network is unreachable',
  'no network',
  'offline',
  'network not available',
  'failed to fetch',          // generic browser-style fetch failure
  'unable to connect',
]

/**
 * Patterns that indicate an authentication failure.
 */
const AUTH_PATTERNS = [
  '401',
  'unauthorized',
  'authentication failed',
  'auth failed',
  'forbidden',
  '403',
]

export function classifyNetworkError(error: unknown): NetworkErrorKind {
  const msg = errorToString(error).toLowerCase()

  if (NO_NETWORK_PATTERNS.some(p => msg.includes(p))) return 'no_network'
  if (UNREACHABLE_PATTERNS.some(p => msg.includes(p))) return 'unreachable'
  if (AUTH_PATTERNS.some(p => msg.includes(p))) return 'auth'
  return 'unknown'
}

function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
