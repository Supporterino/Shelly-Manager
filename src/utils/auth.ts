import type { RpcAuth } from './rpc'

/**
 * SHA-256 Digest authentication for Shelly Gen 2+ devices (RFC 7616).
 *
 * Flow:
 * 1. Send request without auth
 * 2. If HTTP 401, extract nonce + realm from WWW-Authenticate header
 * 3. Compute ha1 = sha256("admin:<realm>:<password>")
 * 4. Compute ha2 = sha256("dummy_method:dummy_uri")
 * 5. Compute response = sha256("<ha1>:<nonce>:<nc>:<cnonce>:auth:<ha2>")
 * 6. Resend request with auth object
 */

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compute the full auth object for a Shelly Gen2+ digest auth challenge.
 */
export async function computeDigestAuth(
  realm: string,
  nonce: number,
  password: string
): Promise<RpcAuth> {
  const cnonce = Math.floor(Math.random() * 0xffffffff)
  const nc = '00000001'

  const ha1 = await sha256Hex(`admin:${realm}:${password}`)
  const ha2 = await sha256Hex('dummy_method:dummy_uri')
  const response = await sha256Hex(
    `${ha1}:${nonce}:${nc}:${cnonce}:auth:${ha2}`
  )

  return {
    realm,
    username: 'admin',
    nonce,
    cnonce,
    response,
    algorithm: 'SHA-256',
  }
}

/**
 * Parse the WWW-Authenticate header from a Shelly 401 response.
 * Returns { realm, nonce } extracted from the Digest challenge.
 */
export function parseWwwAuthenticate(
  header: string
): { realm: string; nonce: number } | null {
  const realmMatch = header.match(/realm="([^"]+)"/)
  const nonceMatch = header.match(/nonce=(\d+)/)
  if (!realmMatch || !nonceMatch) return null
  return {
    realm: realmMatch[1],
    nonce: parseInt(nonceMatch[1], 10),
  }
}
