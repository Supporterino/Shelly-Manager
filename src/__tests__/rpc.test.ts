/**
 * Tests for src/utils/rpc.ts
 */
import { describe, it, expect } from 'vitest'
import { buildRpcFrame, parseRpcResponse } from '../utils/rpc'
import type { RpcAuth } from '../utils/rpc'

// Reset the internal ID counter between tests by re-importing via module isolation
// (vitest resets modules per test file by default if using `vi.resetModules`)

describe('buildRpcFrame', () => {
  it('includes required fields', () => {
    const frame = buildRpcFrame('Shelly.GetStatus')
    expect(frame.src).toBe('shelly-manager')
    expect(frame.method).toBe('Shelly.GetStatus')
    expect(typeof frame.id).toBe('number')
  })

  it('auto-increments id across calls', () => {
    const a = buildRpcFrame('A')
    const b = buildRpcFrame('B')
    expect(b.id).toBe(a.id + 1)
  })

  it('includes params when provided', () => {
    const frame = buildRpcFrame('Switch.Set', { id: 0, on: true })
    expect(frame.params).toEqual({ id: 0, on: true })
  })

  it('omits params when not provided', () => {
    const frame = buildRpcFrame('Shelly.Reboot')
    expect(frame.params).toBeUndefined()
  })

  it('includes auth when provided', () => {
    const auth: RpcAuth = {
      realm: 'shellyplus1',
      username: 'admin',
      nonce: 12345,
      cnonce: 67890,
      response: 'abc123',
      algorithm: 'SHA-256',
    }
    const frame = buildRpcFrame('Shelly.GetStatus', undefined, auth)
    expect(frame.auth).toEqual(auth)
  })
})

describe('parseRpcResponse', () => {
  it('returns result on success', () => {
    const result = parseRpcResponse<{ output: boolean }>({
      id: 1,
      src: 'device',
      result: { output: true },
    })
    expect(result).toEqual({ output: true })
  })

  it('throws on RPC error', () => {
    expect(() =>
      parseRpcResponse({ id: 1, src: 'device', error: { code: 404, message: 'Not found' } })
    ).toThrow('Not found')
  })

  it('attaches error code to thrown error', () => {
    try {
      parseRpcResponse({ id: 1, src: 'device', error: { code: 500, message: 'Internal' } })
    } catch (err) {
      expect((err as Error & { code: number }).code).toBe(500)
    }
  })
})
