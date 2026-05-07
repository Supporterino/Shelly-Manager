import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useEnergyHistoryStore } from '../store/energyHistoryStore';
import { useWsStatusStore } from '../store/wsStatusStore';

function extractEnergyReading(status: unknown): { apower?: number } | undefined {
  if (status == null || typeof status !== 'object') return undefined;
  const s = status as Record<string, unknown>;
  const apower = s.apower;
  if (typeof apower !== 'number') return undefined;
  return { apower };
}

/** Hook that subscribes to wsStatusStore and records energy readings for all components. */
export function useEnergyCollector() {
  const devices = useDeviceStore((state) => state.devices);
  const addReading = useEnergyHistoryStore((state) => state.addReading);

  // Keep stable refs to avoid re-subscribing on every render
  const devicesRef = useRef(devices);
  const addReadingRef = useRef(addReading);
  devicesRef.current = devices;
  addReadingRef.current = addReading;

  useEffect(() => {
    // Subscribe to wsStatusStore changes
    const unsubscribe = useWsStatusStore.subscribe(
      (state) => state.statuses,
      (statuses) => {
        const now = Date.now();
        const currentDevices = devicesRef.current;
        const currentAdd = addReadingRef.current;

        for (const deviceId of Object.keys(currentDevices)) {
          const deviceStatus = statuses[deviceId];
          if (!deviceStatus) continue;

          const device = currentDevices[deviceId];
          if (!device) continue;

          for (const comp of device.components) {
            const statusKey =
              comp.type === 'light_cct' ? `light:${comp.id}` : `${comp.type}:${comp.id}`;
            const compStatus = deviceStatus[statusKey];
            const reading = extractEnergyReading(compStatus);
            if (reading) {
              currentAdd(deviceId, comp.type, comp.id, { ts: now, apower: reading.apower });
            }
          }
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);
}

/** Component wrapper for useEnergyCollector. Mount once in the app root. */
export function EnergyCollector() {
  useEnergyCollector();
  return null;
}
