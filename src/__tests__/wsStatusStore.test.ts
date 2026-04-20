/**
 * Tests for src/store/wsStatusStore.ts — deep merge logic.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useWsStatusStore } from '../store/wsStatusStore';

beforeEach(() => {
  // Reset store to initial state between tests
  useWsStatusStore.setState({ statuses: {}, connected: {} });
});

describe('updateStatus', () => {
  it('stores a new status entry', () => {
    useWsStatusStore.getState().updateStatus('dev1', { 'switch:0': { output: true } });
    expect(useWsStatusStore.getState().statuses.dev1).toEqual({
      'switch:0': { output: true },
    });
  });

  it('merges a partial delta into existing status', () => {
    useWsStatusStore.getState().updateStatus('dev1', {
      'switch:0': { output: false, apower: 0 },
    });
    // Delta — update output only
    useWsStatusStore.getState().updateStatus('dev1', {
      'switch:0': { output: true },
    });
    expect(useWsStatusStore.getState().statuses.dev1['switch:0']).toEqual({
      output: true,
      apower: 0,
    });
  });

  it('adds a new key without disturbing existing keys', () => {
    useWsStatusStore.getState().updateStatus('dev1', { 'switch:0': { output: false } });
    useWsStatusStore.getState().updateStatus('dev1', { sys: { uptime: 100 } });
    const s = useWsStatusStore.getState().statuses.dev1;
    expect(s['switch:0']).toEqual({ output: false });
    expect(s.sys).toEqual({ uptime: 100 });
  });

  it('deep-merges nested objects', () => {
    useWsStatusStore.getState().updateStatus('dev1', {
      'light:0': { output: true, brightness: 50, rgb: [255, 0, 0] },
    });
    useWsStatusStore.getState().updateStatus('dev1', {
      'light:0': { brightness: 80 },
    });
    expect(
      (useWsStatusStore.getState().statuses.dev1['light:0'] as Record<string, unknown>).brightness,
    ).toBe(80);
    expect(
      (useWsStatusStore.getState().statuses.dev1['light:0'] as Record<string, unknown>).output,
    ).toBe(true);
  });

  it('replaces arrays (not merging them)', () => {
    useWsStatusStore.getState().updateStatus('dev1', {
      'light:0': { rgb: [255, 0, 0] },
    });
    useWsStatusStore.getState().updateStatus('dev1', {
      'light:0': { rgb: [0, 255, 0] },
    });
    expect(
      (useWsStatusStore.getState().statuses.dev1['light:0'] as Record<string, unknown>).rgb,
    ).toEqual([0, 255, 0]);
  });
});

describe('setConnected', () => {
  it('marks device as connected', () => {
    useWsStatusStore.getState().setConnected('dev1', true);
    expect(useWsStatusStore.getState().connected.dev1).toBe(true);
  });

  it('marks device as disconnected', () => {
    useWsStatusStore.getState().setConnected('dev1', true);
    useWsStatusStore.getState().setConnected('dev1', false);
    expect(useWsStatusStore.getState().connected.dev1).toBe(false);
  });
});

describe('clearDevice', () => {
  it('removes device status and connection', () => {
    useWsStatusStore.getState().updateStatus('dev1', { sys: { uptime: 1 } });
    useWsStatusStore.getState().setConnected('dev1', true);
    useWsStatusStore.getState().clearDevice('dev1');
    expect(useWsStatusStore.getState().statuses.dev1).toBeUndefined();
    expect(useWsStatusStore.getState().connected.dev1).toBeUndefined();
  });
});
