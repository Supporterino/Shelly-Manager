/**
 * Tests for src/utils/formatters.ts
 */
import { describe, expect, it } from 'vitest';
import {
  formatCurrent,
  formatEnergy,
  formatPower,
  formatTemperature,
  formatUptime,
  formatVoltage,
} from '../utils/formatters';

describe('formatPower', () => {
  it('formats watts with W suffix', () => {
    expect(formatPower(123.4, 'en')).toBe('123.4 W');
  });

  it('formats zero watts', () => {
    expect(formatPower(0, 'en')).toBe('0 W');
  });

  it('rounds to 1 decimal place', () => {
    expect(formatPower(100.567, 'en')).toBe('100.6 W');
  });
});

describe('formatEnergy', () => {
  it('formats kWh with suffix', () => {
    expect(formatEnergy(1.234, 'en')).toBe('1.234 kWh');
  });
});

describe('formatVoltage', () => {
  it('formats volts with V suffix', () => {
    expect(formatVoltage(230.1, 'en')).toBe('230.1 V');
  });
});

describe('formatCurrent', () => {
  it('formats amps with suffix', () => {
    expect(formatCurrent(2.5, 'en')).toBe('2.5 A');
  });
});

describe('formatTemperature', () => {
  it('returns Celsius by default', () => {
    expect(formatTemperature(20, 'en', 'C')).toBe('20 °C');
  });

  it('converts to Fahrenheit', () => {
    // 0°C = 32°F
    expect(formatTemperature(0, 'en', 'F')).toBe('32 °F');
    // 100°C = 212°F
    expect(formatTemperature(100, 'en', 'F')).toBe('212 °F');
  });

  it('rounds to 1 decimal in Fahrenheit', () => {
    // 20°C = 68°F exactly
    expect(formatTemperature(20, 'en', 'F')).toBe('68 °F');
  });
});

describe('formatUptime', () => {
  it('shows seconds only for < 1 minute', () => {
    expect(formatUptime(45)).toBe('45s');
  });

  it('shows minutes and seconds for < 1 hour', () => {
    expect(formatUptime(125)).toBe('2m 5s');
  });

  it('shows hours and minutes for < 1 day', () => {
    expect(formatUptime(3661)).toBe('1h 1m');
  });

  it('shows days for >= 1 day', () => {
    expect(formatUptime(90061)).toBe('1d 1h 1m');
  });
});
