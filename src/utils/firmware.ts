import { verifyShellyHost } from '../services/shellyClient';

/** Exponential backoff delays in ms — total ~68 s max wait */
export const POLL_DELAYS_MS = [3000, 5000, 8000, 10000, 12000, 15000, 15000];

/** Cumulative elapsed time (ms) at the end of each poll step */
export const CUMULATIVE_MS = POLL_DELAYS_MS.reduce<number[]>((acc, d) => {
  acc.push((acc.at(-1) ?? 0) + d);
  return acc;
}, []);

export const TOTAL_MS = CUMULATIVE_MS.at(-1) ?? 0;

/**
 * Poll interval (ms) for the "wait for offline" phase.
 * Firmware download can take 30–180 s depending on device and network.
 */
export const OFFLINE_POLL_INTERVAL_MS = 5000;

/**
 * Maximum number of offline-poll attempts before giving up.
 * 36 × 5 000 ms = 180 s total.
 */
export const OFFLINE_MAX_ATTEMPTS = 36;

/**
 * Poll the device until it stops responding (goes offline), which indicates
 * the firmware has been downloaded and the device is applying it / rebooting.
 *
 * Must be called immediately after `Shelly.Update` returns.  The device stays
 * fully reachable during the download phase, so this phase MUST complete
 * before `pollUntilOnline` is called — otherwise the device will still be
 * online and `pollUntilOnline` will report false success.
 *
 * Calls `onStep(i + 1)` after each wait so the caller can track progress.
 * Returns `true` when the device goes offline, `false` if it never did within
 * the allowed window.
 */
export async function pollUntilOffline(
  ip: string,
  port: number,
  onStep?: (step: number) => void,
): Promise<boolean> {
  for (let i = 0; i < OFFLINE_MAX_ATTEMPTS; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, OFFLINE_POLL_INTERVAL_MS));
    onStep?.(i + 1);
    const result = await verifyShellyHost(ip, port);
    if (!result) return true;
  }
  return false;
}

/**
 * Poll the device with exponential backoff until it responds online or all
 * attempts are exhausted.  Calls `onStep(stepIndex)` after each wait so the
 * caller can drive a progress bar.
 */
export async function pollUntilOnline(
  ip: string,
  port: number,
  onStep?: (step: number) => void,
): Promise<boolean> {
  for (let i = 0; i < POLL_DELAYS_MS.length; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_DELAYS_MS[i]));
    onStep?.(i + 1);
    const result = await verifyShellyHost(ip, port);
    if (result) return true;
  }
  return false;
}

/**
 * Calculate a 0-100 progress value from the current poll step index.
 * `step` is 1-indexed (0 = not started).
 */
export function pollProgress(step: number): number {
  if (step === 0) return 0;
  return (CUMULATIVE_MS[step - 1] / TOTAL_MS) * 100;
}
