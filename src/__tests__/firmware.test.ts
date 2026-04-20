/**
 * Tests for src/utils/firmware.ts — polling constants and utilities.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '../test/mocks/tauri'

// Mock shellyClient before importing firmware (firmware imports verifyShellyHost)
vi.mock('../services/shellyClient', () => ({
  ShellyClient: vi.fn(),
  verifyShellyHost: vi.fn(),
}))

import {
  pollProgress,
  pollUntilOnline,
  pollUntilOffline,
  POLL_DELAYS_MS,
  CUMULATIVE_MS,
  TOTAL_MS,
  OFFLINE_POLL_INTERVAL_MS,
  OFFLINE_MAX_ATTEMPTS,
} from '../utils/firmware'
import { verifyShellyHost } from '../services/shellyClient'

const mockVerify = vi.mocked(verifyShellyHost)

// Reusable stub values matching the actual Shelly /shelly response shape
const onlineDevice = { type: 'SHSW', mac: 'AABB', gen: 2, fw_id: '20240101-120000/1.0.0', ver: '1.0.0', auth: false }
const updatedDevice = { type: 'SHSW', mac: 'AABB', gen: 2, fw_id: '20240601-090000/1.1.0', ver: '1.1.0', auth: false }

// ── POLL_DELAYS_MS / CUMULATIVE_MS / TOTAL_MS ──────────────────────────────

describe('polling constants', () => {
  it('CUMULATIVE_MS has the same length as POLL_DELAYS_MS', () => {
    expect(CUMULATIVE_MS).toHaveLength(POLL_DELAYS_MS.length)
  })

  it('each CUMULATIVE_MS entry equals the running sum of POLL_DELAYS_MS', () => {
    let running = 0
    POLL_DELAYS_MS.forEach((d, i) => {
      running += d
      expect(CUMULATIVE_MS[i]).toBe(running)
    })
  })

  it('TOTAL_MS equals the last entry in CUMULATIVE_MS', () => {
    expect(TOTAL_MS).toBe(CUMULATIVE_MS[CUMULATIVE_MS.length - 1])
  })

  it('TOTAL_MS is positive', () => {
    expect(TOTAL_MS).toBeGreaterThan(0)
  })

  it('OFFLINE_POLL_INTERVAL_MS is a positive number', () => {
    expect(OFFLINE_POLL_INTERVAL_MS).toBeGreaterThan(0)
  })

  it('OFFLINE_MAX_ATTEMPTS is a positive number', () => {
    expect(OFFLINE_MAX_ATTEMPTS).toBeGreaterThan(0)
  })
})

// ── pollProgress ──────────────────────────────────────────────────────────

describe('pollProgress', () => {
  it('returns 0 for step 0 (not yet started)', () => {
    expect(pollProgress(0)).toBe(0)
  })

  it('returns a positive value less than 100 for intermediate steps', () => {
    for (let s = 1; s < POLL_DELAYS_MS.length; s++) {
      const p = pollProgress(s)
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(100)
    }
  })

  it('returns exactly 100 at the final step', () => {
    expect(pollProgress(POLL_DELAYS_MS.length)).toBeCloseTo(100)
  })

  it('is monotonically increasing across steps', () => {
    for (let s = 1; s < POLL_DELAYS_MS.length; s++) {
      expect(pollProgress(s + 1)).toBeGreaterThan(pollProgress(s))
    }
  })
})

// ── pollUntilOnline ────────────────────────────────────────────────────────

describe('pollUntilOnline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockVerify.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true and stops after the first successful poll', async () => {
    mockVerify.mockResolvedValue(onlineDevice)

    const promise = pollUntilOnline('192.168.1.100', 80)
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[0])
    const result = await promise

    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalledTimes(1)
    expect(mockVerify).toHaveBeenCalledWith('192.168.1.100', 80)
  })

  it('returns false when all poll attempts are exhausted', async () => {
    mockVerify.mockResolvedValue(null)

    const promise = pollUntilOnline('192.168.1.100', 80)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
    expect(mockVerify).toHaveBeenCalledTimes(POLL_DELAYS_MS.length)
  })

  it('calls onStep with 1-indexed step numbers for each attempt', async () => {
    mockVerify.mockResolvedValue(null)
    const onStep = vi.fn()

    const promise = pollUntilOnline('192.168.1.100', 80, onStep)
    await vi.runAllTimersAsync()
    await promise

    expect(onStep).toHaveBeenCalledTimes(POLL_DELAYS_MS.length)
    POLL_DELAYS_MS.forEach((_, i) => {
      expect(onStep).toHaveBeenNthCalledWith(i + 1, i + 1)
    })
  })

  it('returns true after several failures when device eventually responds', async () => {
    mockVerify
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(updatedDevice)

    const promise = pollUntilOnline('192.168.1.100', 80)
    // Advance past the first two delays, then the third
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[0])
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[1])
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[2])
    const result = await promise

    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalledTimes(3)
  })

  it('does not call onStep after a successful early return', async () => {
    mockVerify.mockResolvedValue(onlineDevice)
    const onStep = vi.fn()

    const promise = pollUntilOnline('192.168.1.100', 80, onStep)
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[0])
    await promise

    // Only one step should have been reported
    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onStep).toHaveBeenCalledWith(1)
  })
})

// ── pollUntilOffline ───────────────────────────────────────────────────────

describe('pollUntilOffline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockVerify.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true immediately when the device is already offline on first poll', async () => {
    mockVerify.mockResolvedValue(null)

    const promise = pollUntilOffline('192.168.1.100', 80)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    const result = await promise

    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalledTimes(1)
  })

  it('returns true once the device goes offline after several online polls', async () => {
    mockVerify
      .mockResolvedValueOnce(onlineDevice) // poll 1 — still online
      .mockResolvedValueOnce(onlineDevice) // poll 2 — still online
      .mockResolvedValue(null)             // poll 3 — offline

    const promise = pollUntilOffline('192.168.1.100', 80)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    const result = await promise

    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalledTimes(3)
  })

  it('returns false when the device never goes offline within the allowed attempts', async () => {
    mockVerify.mockResolvedValue(onlineDevice)

    const promise = pollUntilOffline('192.168.1.100', 80)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
    expect(mockVerify).toHaveBeenCalledTimes(OFFLINE_MAX_ATTEMPTS)
  })

  it('calls onStep with 1-indexed step numbers for each attempt', async () => {
    mockVerify.mockResolvedValue(onlineDevice)
    const onStep = vi.fn()

    const promise = pollUntilOffline('192.168.1.100', 80, onStep)
    await vi.runAllTimersAsync()
    await promise

    expect(onStep).toHaveBeenCalledTimes(OFFLINE_MAX_ATTEMPTS)
    for (let i = 0; i < OFFLINE_MAX_ATTEMPTS; i++) {
      expect(onStep).toHaveBeenNthCalledWith(i + 1, i + 1)
    }
  })

  it('does not call onStep after the device goes offline', async () => {
    mockVerify
      .mockResolvedValueOnce(onlineDevice)
      .mockResolvedValue(null)
    const onStep = vi.fn()

    const promise = pollUntilOffline('192.168.1.100', 80, onStep)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    await promise

    expect(onStep).toHaveBeenCalledTimes(2)
  })

  it('uses the correct IP and port when calling verifyShellyHost', async () => {
    mockVerify.mockResolvedValue(null)

    const promise = pollUntilOffline('10.0.0.5', 8080)
    await vi.advanceTimersByTimeAsync(OFFLINE_POLL_INTERVAL_MS)
    await promise

    expect(mockVerify).toHaveBeenCalledWith('10.0.0.5', 8080)
  })
})
