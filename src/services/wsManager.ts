/**
 * WsManager — WebSocket connection pool for Shelly Gen 2/3/4 devices.
 *
 * Each device gets a single persistent WS connection to ws://<ip>/rpc.
 * After the initial handshake (and optional digest auth), the device
 * pushes NotifyStatus / NotifyFullStatus / NotifyEvent frames automatically.
 *
 * Auth flow (WS):
 * 1. Send Shelly.GetStatus without auth.
 * 2. If the response contains { error: { code: 401 }, auth_type: 'digest', auth: {...} }
 *    → compute digest response → resend with auth object in the RPC frame.
 * 3. Store the computed auth object for the session lifetime (nonce doesn't rotate for WS).
 */

import { notifications } from '@mantine/notifications';
import WebSocket from '@tauri-apps/plugin-websocket';
import { useWsStatusStore } from '../store/wsStatusStore';
import type { StoredDevice } from '../types/device';
import { computeDigestAuth } from '../utils/auth';
import { buildRpcFrame } from '../utils/rpc';

interface WsAuthChallenge {
  realm: string;
  nonce: number;
  algorithm?: string;
}

interface ShellyWsFrame {
  id?: number;
  src?: string;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
  auth_type?: string;
  auth?: WsAuthChallenge;
}

interface ShellyNotifyEvent {
  component: string;
  event: string;
  ts?: number;
}

class WsManager {
  /** deviceId → active WebSocket handle */
  private readonly connections: Map<string, WebSocket> = new Map();

  // ── Public API ─────────────────────────────────────────────────────────────

  async connect(device: StoredDevice): Promise<void> {
    // Skip if already connected
    if (this.connections.has(device.id)) return;

    const { updateStatus, setStatus, setConnected } = useWsStatusStore.getState();

    let ws: WebSocket;
    try {
      ws = await WebSocket.connect(`ws://${device.ip}:${device.port}/rpc`);
    } catch {
      setConnected(device.id, false);
      return;
    }

    // Computed once per session after the initial auth handshake
    let sessionAuth: Awaited<ReturnType<typeof computeDigestAuth>> | undefined;

    ws.addListener((event) => {
      if (typeof event.data !== 'string') return;

      let frame: ShellyWsFrame;
      try {
        frame = JSON.parse(event.data) as ShellyWsFrame;
      } catch {
        return;
      }

      // ── Auth challenge ──────────────────────────────────────────────────────
      if (frame.error?.code === 401 && frame.auth_type === 'digest' && frame.auth) {
        if (!device.auth?.password) {
          // No credentials stored — mark as offline
          setConnected(device.id, false);
          return;
        }
        const challenge = frame.auth;
        computeDigestAuth(challenge.realm, challenge.nonce, device.auth.password)
          .then((auth) => {
            sessionAuth = auth;
            const authFrame = buildRpcFrame('Shelly.GetStatus', undefined, auth);
            void ws.send(JSON.stringify(authFrame));
          })
          .catch(() => setConnected(device.id, false));
        return;
      }

      // ── Initial GetStatus response → connected ──────────────────────────────
      if (frame.id !== undefined && frame.result != null) {
        updateStatus(device.id, frame.result);
        setConnected(device.id, true);
        return;
      }

      // ── NotifyFullStatus → full replace; NotifyStatus → deep-merge delta ───
      if (frame.method === 'NotifyFullStatus' && frame.params != null) {
        setStatus(device.id, frame.params);
        return;
      }
      if (frame.method === 'NotifyStatus' && frame.params != null) {
        updateStatus(device.id, frame.params);
        return;
      }

      // ── NotifyEvent → toast notification ────────────────────────────────────
      if (frame.method === 'NotifyEvent' && frame.params != null) {
        const events = frame.params.events as ShellyNotifyEvent[] | undefined;
        if (Array.isArray(events)) {
          for (const ev of events) {
            notifications.show({
              message: `${device.name}: ${ev.component} — ${ev.event}`,
              autoClose: 3000,
            });
          }
        }
        return;
      }

      // ── Connection closed (device disconnected) ─────────────────────────────
      if (event.type === 'Close') {
        setConnected(device.id, false);
        this.connections.delete(device.id);
      }
    });

    this.connections.set(device.id, ws);

    // Send the initial GetStatus to trigger push notification subscription.
    // sessionAuth is still undefined here — auth is resolved on first 401 response.
    const initFrame = buildRpcFrame('Shelly.GetStatus', undefined, sessionAuth);
    try {
      await ws.send(JSON.stringify(initFrame));
    } catch {
      setConnected(device.id, false);
    }
  }

  disconnect(deviceId: string): void {
    const ws = this.connections.get(deviceId);
    if (ws) {
      void ws.disconnect();
      this.connections.delete(deviceId);
      useWsStatusStore.getState().setConnected(deviceId, false);
    }
  }

  isConnected(deviceId: string): boolean {
    return this.connections.has(deviceId);
  }
}

export const wsManager = new WsManager();
