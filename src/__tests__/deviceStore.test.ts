/**
 * Tests for src/store/deviceStore.ts
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useDeviceStore } from '../store/deviceStore';
import type { StoredDevice } from '../types/device';

const makeDevice = (id: string): StoredDevice => ({
  id,
  ip: `192.168.1.${id}`,
  port: 80,
  name: `Device ${id}`,
  model: 'SHSW-1',
  app: 'Switch',
  generation: 'gen2',
  type: 'switch',
  components: [],
  addedAt: Date.now(),
  lastSeenAt: Date.now(),
});

beforeEach(() => {
  // Reset to initial state; keep isHydrated false so auto-persist does not fire
  useDeviceStore.setState({ devices: {}, isHydrated: false });
});

describe('addDevice', () => {
  it('adds a device to the store', () => {
    const device = makeDevice('1');
    useDeviceStore.getState().addDevice(device);
    expect(useDeviceStore.getState().devices['1']).toEqual(device);
  });
});

describe('removeDevice', () => {
  it('removes only the specified device', () => {
    useDeviceStore.getState().addDevice(makeDevice('1'));
    useDeviceStore.getState().addDevice(makeDevice('2'));
    useDeviceStore.getState().removeDevice('1');
    expect(useDeviceStore.getState().devices['1']).toBeUndefined();
    expect(useDeviceStore.getState().devices['2']).toBeDefined();
  });
});

describe('clearAllDevices', () => {
  it('removes all devices from state', () => {
    useDeviceStore.getState().addDevice(makeDevice('1'));
    useDeviceStore.getState().addDevice(makeDevice('2'));
    useDeviceStore.getState().addDevice(makeDevice('3'));
    expect(Object.keys(useDeviceStore.getState().devices)).toHaveLength(3);

    useDeviceStore.getState().clearAllDevices();

    expect(useDeviceStore.getState().devices).toEqual({});
  });

  it('is a no-op when the store is already empty', () => {
    expect(() => useDeviceStore.getState().clearAllDevices()).not.toThrow();
    expect(useDeviceStore.getState().devices).toEqual({});
  });
});

describe('updateDevice', () => {
  it('merges a patch into an existing device', () => {
    useDeviceStore.getState().addDevice(makeDevice('1'));
    useDeviceStore.getState().updateDevice('1', { name: 'Updated' });
    expect(useDeviceStore.getState().devices['1'].name).toBe('Updated');
  });

  it('is a no-op for an unknown id', () => {
    const before = useDeviceStore.getState().devices;
    useDeviceStore.getState().updateDevice('ghost', { name: 'x' });
    expect(useDeviceStore.getState().devices).toEqual(before);
  });
});
