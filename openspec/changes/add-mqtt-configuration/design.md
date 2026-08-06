## Context

See proposal.md - Why. Relevant existing patterns this design builds on:

- Per-device config sections (`WiFiSection.tsx`, `EthernetSection.tsx`) each follow: `useXConfig`/`useXSetConfig` TanStack Query hooks reading/writing a domain-specific RPC pair (`X.GetConfig`/`X.SetConfig`) via `ShellyClient`, local form state synced from the query result, save/cancel buttons.
- `IntegrationStatusSection.tsx` already reads `mqtt.enabled`/`mqtt.connected` from `Shelly.GetStatus` for the read-only badge — this is reused as-is for the fleet dashboard's status column.
- `firmware.tsx` + `useFirmwareManager.ts` is the existing bulk-operation template: multi-select with "select all", per-device state map keyed by device id, sequential (not parallel) execution for LAN stability, mobile-list/desktop-table UI split.
- `appStore.preferences.defaultUpdateTrack` is the existing "global default" pattern, persisted via `tauri-plugin-store` (plaintext JSON) through `devicePersistence.ts`.
- No `MQTTConfig` type or `Mqtt.GetConfig`/`Mqtt.SetConfig` calls exist yet anywhere in the codebase; this is new surface area, not a modification.

## Goals / Non-Goals

**Goals:**
- Reuse the existing per-domain config-section pattern for the per-device MQTT editor, so it's consistent with WiFi/Ethernet/System sections.
- Reuse the existing bulk-operation pattern (firmware manager) for the fleet template apply flow, including its sequential-push-for-LAN-stability decision.
- Keep the "live device config is the single source of truth" model: the app does not persist a separate override flag distinguishing "templated" vs "manually customized" devices — it diffs live state against the template on demand instead.

**Non-Goals:**
- No TLS/certificate support (`use_client_cert`, `ssl_ca`) in this change.
- No scheme-aware broker address handling (`mqtt://` vs `mqtts://`, port 1883 vs 8883) — `server` is a plain `host:port` string.
- No automatic application of the global template to newly discovered/added devices — applying is always an explicit user action from the `/mqtt` panel.
- No secure credential storage (OS keychain, encryption at rest) — the broker password is persisted the same way other preferences are today (plaintext JSON via `tauri-plugin-store`).

## Decisions

### 1. Two capabilities, one underlying RPC surface
`device-mqtt-config` and `mqtt-fleet-management` are modeled as separate capabilities because they have independent user-facing behavior (a single-device editor vs. a fleet bulk tool), but they share the same `ShellyClient.mqttGetConfig`/`mqttSetConfig` methods and the same `MQTTConfig` type. The fleet panel is effectively a driver of many per-device operations, not a separate protocol.

**Alternative considered:** one combined capability. Rejected because the per-device spec (view/edit one device) and fleet spec (template, diff, collision detection, bulk push) have genuinely different scenarios and failure modes; splitting keeps each spec file focused and independently testable.

### 2. No persisted "override" flag — diff-on-demand
Rather than storing per-device state like `mqttSource: 'template' | 'custom'`, the fleet panel always fetches each selected device's live `Mqtt.GetConfig` immediately before showing the apply preview, and diffs it against the resolved template in memory.

**Rationale:** MQTT config lives on the device, not in the app's local store (unlike `updateTrack`, which is a pure app-side preference with no device-side equivalent). Persisting a separate "is this templated" flag would drift from reality the moment someone edits the device directly (e.g., via the device's native web UI, outside this app entirely) and silently mislead the user. Diffing live state is slightly more expensive (one extra `GetConfig` round-trip per selected device before applying) but is always correct.

**Alternative considered:** cache the last-applied template hash per device in `deviceStore` to skip the diff fetch for devices "known" to match. Rejected for this change as premature optimization — correctness over the caching gain, revisit only if bulk-apply latency across large fleets proves to be a real problem.

### 3. Sequential apply, not parallel
Following `useFirmwareManager.ts`'s existing precedent, the bulk apply pushes to devices one at a time rather than via `Promise.all`.

**Rationale:** consistency with the established rationale in that hook ("safer for LAN stability") — many Shelly devices on constrained home WiFi can struggle with concurrent request bursts. Status/diff reads (which are less state-changing) may still be parallelized, mirroring `checkAll`/`checkSelected` in the firmware hook, but the actual `Mqtt.SetConfig` writes are sequential.

### 4. Template placeholders limited to `{mac}` and `{name}`
Only fields already available on `StoredDevice` are exposed as placeholders. `{ip}` is deliberately excluded because it is DHCP-assigned and can change, which would make a previously-applied `client_id`/`topic_prefix` derived from it silently stale and misleading if re-resolved later.

### 5. Global template fields vs. per-device-only fields
The global template manages the fields needed for a device to successfully connect and behave uniformly on the broker: `enable`, `server`, `user`, `pass`, `client_id` (templated), `topic_prefix` (templated), `enable_rpc`, `rpc_ntf`, `status_ntf`. The per-device section exposes this same full set for direct editing — there are no fields present on one surface but not the other in this change (TLS fields are deferred entirely, not split between surfaces).

## Risks / Trade-offs

- **[Risk] Diff preview requires an extra `GetConfig` round-trip per selected device before every apply.** → Mitigation: acceptable at expected fleet sizes (tens of devices, matching this app's existing local-network scope); status/diff reads can be parallelized even though writes are sequential.
- **[Risk] Broker password stored in plaintext JSON on disk.** → Mitigation: consistent with this app's existing threat model (local-only LAN tool, no other secret currently gets special handling); explicitly called out in the proposal as an accepted trade-off, not an oversight.
- **[Risk] A device edited outside the app (native web UI) between fleet-panel page loads could show a stale diff if the panel caches a previous fetch.** → Mitigation: the diff is always computed from a fresh `GetConfig` fetch triggered at apply-preview time, not from a cached read.
- **[Risk] Collision detection is template-based (name/mac collisions), not broker-based.** → Mitigation: this is explicitly a pre-flight sanity check, not a guarantee — the broker itself remains the final authority; two devices could still collide via manually-entered `client_id` values outside the template. Out of scope to solve fully here.

## Open Questions

- Whether newly discovered/added devices should default to "selected" in the fleet panel to nudge users toward including them — a UX nicety, not a spec-level behavior change, deferrable to implementation review.
