import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface WsStatusStore {
  /** deviceId → full or partial component statuses */
  statuses: Record<string, Record<string, unknown>>
  /** deviceId → connection state */
  connected: Record<string, boolean>
  updateStatus: (
    deviceId: string,
    delta: Record<string, unknown>
  ) => void
  setConnected: (deviceId: string, value: boolean) => void
  clearDevice: (deviceId: string) => void
}

function deepMerge(
  target: Record<string, unknown>,
  delta: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }
  for (const [key, value] of Object.entries(delta)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      result[key] = value
    }
  }
  return result
}

export const useWsStatusStore = create<WsStatusStore>()(
  subscribeWithSelector((set) => ({
    statuses: {},
    connected: {},

    updateStatus: (deviceId, delta) => {
      set((state) => {
        const existing = state.statuses[deviceId] ?? {}
        return {
          statuses: {
            ...state.statuses,
            [deviceId]: deepMerge(existing, delta),
          },
        }
      })
    },

    setConnected: (deviceId, value) => {
      set((state) => ({
        connected: { ...state.connected, [deviceId]: value },
      }))
    },

    clearDevice: (deviceId) => {
      set((state) => {
        const { [deviceId]: _s, ...statuses } = state.statuses
        const { [deviceId]: _c, ...connected } = state.connected
        return { statuses, connected }
      })
    },
  }))
)
