## 1. Core types and RPC layer

- [ ] 1.1 Add `MQTTConfig` interface to `src/types/shelly.ts` (`enable`, `server`, `user`, `pass`, `client_id`, `topic_prefix`, `enable_rpc`, `rpc_ntf`, `status_ntf`)
- [ ] 1.2 Add `mqttGetConfig()` / `mqttSetConfig(config)` methods to `ShellyClient` in `src/services/shellyClient.ts`, calling `Mqtt.GetConfig` / `Mqtt.SetConfig`
- [ ] 1.3 Add unit tests for the new `ShellyClient` methods (request shape, auth retry behavior reused from existing methods)

## 2. Per-device MQTT settings (device-mqtt-config)

- [ ] 2.1 Add `useMqttConfig(deviceId)` / `useMqttSetConfig(deviceId)` hooks to `src/hooks/useDeviceSettings.ts` (query key `['device', deviceId, 'mqtt', 'config']`, invalidate on successful mutation, error notification on failure)
- [ ] 2.2 Create `src/components/devices/settings/MqttSection.tsx` following the `EthernetSection.tsx` pattern: loading state, local form state synced from query, save/cancel actions
- [ ] 2.3 Ensure the password field is never pre-filled with a previously saved value (write-only field)
- [ ] 2.4 Register `MqttSection` in `SettingsTabs.tsx`'s `system` tab, alongside `IntegrationStatusSection`
- [ ] 2.5 Add i18n keys for the section (labels, field hints, save/cancel, error messages) to `devices.json` in all 6 locales (en/de/fr/es/zh/ja)
- [ ] 2.6 Write component tests for `MqttSection.tsx` covering: load, edit, save success, save failure, cancel/discard

## 3. Global MQTT template state

- [ ] 3.1 Add `mqttTemplate` field to `AppPreferences` in `src/store/appStore.ts` (`enable`, `server`, `user`, `pass`, `enable_rpc`, `rpc_ntf`, `status_ntf`, `clientIdTemplate` default `shelly-{mac}`, `topicPrefixTemplate` default `shellies/{mac}`)
- [ ] 3.2 Extend `devicePersistence.ts` load/save preferences to include `mqttTemplate`, matching the existing `tauri-plugin-store` pattern
- [ ] 3.3 Add `setMqttTemplate` action to `appStore.ts`
- [ ] 3.4 Write a pure `resolveMqttTemplate(template, device)` utility (in `src/utils/` or `src/services/`) that substitutes `{mac}`/`{name}` placeholders and rejects unknown placeholders
- [ ] 3.5 Write a pure `diffMqttConfig(current, resolved)` utility that returns which managed fields differ
- [ ] 3.6 Write a pure `detectMqttCollisions(resolvedByDevice)` utility that finds devices sharing a resolved `client_id` or `topic_prefix`
- [ ] 3.7 Unit test all three utilities, including edge cases (unknown placeholder, no-op diff, multi-way collisions)

## 4. Global MQTT panel route and UI

- [ ] 4.1 Create `src/routes/mqtt.tsx` as a new top-level route, following `firmware.tsx`'s page structure
- [ ] 4.2 Add a nav entry for `/mqtt` in the app's sidebar/bottom-nav components, alongside the existing `/firmware` entry
- [ ] 4.3 Create the template form component (broker, credentials, flags, client_id/topic_prefix template inputs) bound to `appStore.preferences.mqttTemplate`
- [ ] 4.4 Create the fleet status table/list components (`src/components/mqtt/MqttFleetTable.tsx` desktop + `MqttFleetList.tsx` mobile, or equivalent), reusing existing MQTT status read logic from `IntegrationStatusSection`
- [ ] 4.5 Implement device selection state (`Set<string>`) with "select all" toggle, mirroring `firmware.tsx`
- [ ] 4.6 Add i18n keys for the panel (form labels, table columns, buttons, empty states) to a new or extended locale namespace, in all 6 locales

## 5. Bulk apply flow

- [ ] 5.1 Create `useMqttFleetManager.ts` hook modeled on `useFirmwareManager.ts`: per-device status map (`idle|checking|applying|done|failed`)
- [ ] 5.2 Implement "fetch current config for selected devices" step (parallel reads, matching `checkAll`/`checkSelected` precedent)
- [ ] 5.3 Implement preview computation: resolve template per device, diff against current config, run collision detection across the selected set
- [ ] 5.4 Create the diff/preview modal UI: per-device field-level changes, explicit flag when a manual `client_id`/`topic_prefix` customization would be overwritten, collision warnings requiring acknowledgment
- [ ] 5.5 Implement sequential apply of confirmed devices (`for...of` + `await`, not `Promise.all`), skipping devices marked no-op in the preview
- [ ] 5.6 Report per-device success/failure after the bulk operation completes, with a summary notification
- [ ] 5.7 Write tests for `useMqttFleetManager.ts` covering: all succeed, partial failure, no-op skip, collision blocks confirmation until acknowledged

## 6. Validation

- [ ] 6.1 Run `bun run test` and confirm all new and existing tests pass
- [ ] 6.2 Manually verify against a real or simulated Gen2+ device: per-device save round-trip, fleet template apply to multiple devices, collision warning trigger
- [ ] 6.3 Run `openspec validate add-mqtt-configuration --strict` before archiving
