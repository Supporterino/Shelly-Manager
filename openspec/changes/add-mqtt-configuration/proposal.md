## Why

Shelly Manager currently only displays MQTT connection status (enabled/connected) as a read-only badge; there is no way to configure MQTT on a device from the app. Users who want to integrate their fleet with a home automation broker (Home Assistant, Node-RED, etc.) must currently use each device's native web UI one at a time, which defeats the purpose of a fleet manager. This change adds both a per-device MQTT settings editor and a global panel to configure and push MQTT settings to many devices at once.

## What Changes

- Add a per-device MQTT configuration section (`MqttSection.tsx`) to the device settings page, alongside the existing WiFi/Ethernet/System sections. It reads and writes the device's live MQTT config via `Mqtt.GetConfig`/`Mqtt.SetConfig`, exposing the full field set: `enable`, `server`, `user`, `pass`, `client_id`, `topic_prefix`, `enable_rpc`, `rpc_ntf`, `status_ntf`.
- Add a new top-level route (`/mqtt`) with a global MQTT panel:
  - A template form for broker settings shared across the fleet: `enable`, `server`, `user`, `pass`, `enable_rpc`, `rpc_ntf`, `status_ntf`, plus per-device-unique `client_id`/`topic_prefix` templates supporting `{mac}`/`{name}` placeholders (defaulting to `shelly-{mac}` / `shellies/{mac}`).
  - A status-aware dashboard table listing all stored devices with their current MQTT enabled/connected state and a selection checkbox (mirroring the existing `/firmware` page's list/table pattern).
  - An "Apply to Selected" / "Apply to All" bulk action that fetches each selected device's current live MQTT config, resolves the template per device, shows a diff preview (flagging fields that will change, including cases where a manual per-device customization would be overwritten) and a collision warning if two devices resolve to the same `client_id`/`topic_prefix`, then pushes sequentially and reports per-device success/failure.
- The global MQTT template (broker, credentials, flags, client_id/topic_prefix templates) is persisted in `appStore.preferences` for reuse across sessions.
- TLS/certificate fields (`use_client_cert`, `ssl_ca`) and broker scheme/port validation (`mqtt://` vs `mqtts://`) are explicitly out of scope for this change and deferred to a future change.

## Capabilities

### New Capabilities
- `device-mqtt-config`: Per-device MQTT configuration — viewing and editing a single device's live MQTT client settings (broker, credentials, client id, topic prefix, RPC/notification flags) from its settings page.
- `mqtt-fleet-management`: Global MQTT template panel — defining a fleet-wide MQTT configuration template, viewing MQTT status across all devices, and bulk-applying the template to selected or all devices with diff preview and collision detection.

### Modified Capabilities
(none — no existing specs cover MQTT behavior today; the current read-only status badge has no formal spec and is unaffected in behavior)

## Impact

- **New types**: `MQTTConfig` in `src/types/shelly.ts`.
- **New RPC methods**: `mqttGetConfig`/`mqttSetConfig` in `src/services/shellyClient.ts` (`Mqtt.GetConfig`/`Mqtt.SetConfig`).
- **New hooks**: `useMqttConfig`/`useMqttSetConfig` in `src/hooks/useDeviceSettings.ts`; a new bulk-apply hook (e.g. `useMqttFleetManager.ts`) modeled on `useFirmwareManager.ts`.
- **New components**: `src/components/devices/settings/MqttSection.tsx`; `src/components/mqtt/*` (template form, fleet status table/list, diff preview modal) mirroring `src/components/firmware/*`.
- **New route**: `src/routes/mqtt.tsx`, plus a new nav entry (sidebar/bottom-nav) alongside `/firmware`.
- **Store changes**: `appStore.preferences` gains an `mqttTemplate` field (persisted via `tauri-plugin-store`, including the broker password in plaintext — consistent with existing preference storage).
- **i18n**: New keys added to `devices.json` (per-device section labels) and a new or extended namespace for the global panel, across all 6 locales (en/de/fr/es/zh/ja).
- **No Rust changes**: MQTT config communication goes through the existing `@tauri-apps/plugin-http` → device `/rpc` path, consistent with all other device config domains.
