import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnergyHistoryStore } from './energyHistoryStore';

vi.mock('../services/energyPersistence', () => ({
  loadEnergyHistory: vi.fn().mockResolvedValue({}),
  saveEnergyHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('energyHistoryStore', () => {
  beforeEach(() => {
    useEnergyHistoryStore.setState({ history: {}, isHydrated: true });
  });

  it('adds a reading', () => {
    const now = Date.now();
    useEnergyHistoryStore.getState().addReading('dev1', 'switch', 0, { ts: now, apower: 45 });

    const readings = useEnergyHistoryStore.getState().getReadings('dev1', 'switch', 0);
    expect(readings).toHaveLength(1);
    expect(readings[0].apower).toBe(45);
  });

  it('prunes entries older than 24 hours', () => {
    const now = Date.now();
    const old = now - 25 * 60 * 60 * 1000;

    useEnergyHistoryStore.getState().addReading('dev1', 'switch', 0, { ts: old, apower: 10 });
    useEnergyHistoryStore.getState().addReading('dev1', 'switch', 0, { ts: now, apower: 20 });

    const readings = useEnergyHistoryStore.getState().getReadings('dev1', 'switch', 0);
    expect(readings).toHaveLength(1);
    expect(readings[0].apower).toBe(20);
  });

  it('isolates devices and components', () => {
    const now = Date.now();
    useEnergyHistoryStore.getState().addReading('dev1', 'switch', 0, { ts: now, apower: 10 });
    useEnergyHistoryStore.getState().addReading('dev1', 'switch', 1, { ts: now, apower: 20 });
    useEnergyHistoryStore.getState().addReading('dev2', 'switch', 0, { ts: now, apower: 30 });

    expect(useEnergyHistoryStore.getState().getReadings('dev1', 'switch', 0)).toHaveLength(1);
    expect(useEnergyHistoryStore.getState().getReadings('dev1', 'switch', 1)).toHaveLength(1);
    expect(useEnergyHistoryStore.getState().getReadings('dev2', 'switch', 0)).toHaveLength(1);
  });
});
