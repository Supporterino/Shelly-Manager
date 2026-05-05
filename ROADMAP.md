# Shelly Manager — Feature Roadmap

> Generated from API gap analysis against Shelly Gen 2/3/4 JSON-RPC documentation.
> This file tracks planned features grouped by implementation priority.

---

## Phase 1 — Core Device Management [x]

**Goal:** High-value features for device setup, provisioning, and system tuning.

| # | Feature | Description | API Methods |
|---|---|---|---|
| [x] 1.1 | **WiFi Configuration** | View current SSID, signal strength (RSSI), IP. Scan nearby networks, switch SSIDs, configure static IP, fallback STA (`sta1`), roaming thresholds. | `WiFi.GetConfig`, `WiFi.SetConfig`, `WiFi.GetStatus`, `WiFi.Scan` |
| [x] 1.2 | **Ethernet Configuration** | For Pro devices — link status, IP config, enable/disable. | `Eth.GetConfig`, `Eth.SetConfig`, `Eth.GetStatus` |
| [x] 1.3 | **AP Mode Management** | Configure device access point SSID/password. View connected clients. | `WiFi.ListAPClients` |
| [x] 1.4 | **Device Profile Switcher** | Show current profile (switch/cover). List available profiles. Switch with confirmation (warns about webhook/schedule deletion). Auto-refresh components after change. | `Shelly.ListProfiles`, `Shelly.SetProfile` |
| [x] 1.5 | **System Settings Panel** | Eco mode toggle, discoverable toggle, location/timezone auto-detect & manual picker, device time display & sync, restart-required indicator. | `Sys.GetConfig`, `Sys.SetConfig`, `Sys.SetTime`, `Shelly.DetectLocation`, `Shelly.ListTimezones` |

---

## Phase 2 — Power-User Automation [x]

**Goal:** Differentiating features that go beyond basic control — automation, scripting, and debugging tools.

| # | Feature | Description | API Methods |
|---|---|---|---|
| [x] 2.1 | **Webhook Manager** | Full CRUD UI: list existing webhooks, create from supported event types (`ListAllSupported`), edit conditions/repeat periods/active windows, enable/disable toggle, delete individual or all. | `Webhook.List`, `Webhook.ListAllSupported`, `Webhook.Create`, `Webhook.Update`, `Webhook.Delete`, `Webhook.DeleteAll` |
| [x] 2.2 | **KVS Editor** | List stored keys with etags, view/edit JSON values, pattern search, add/delete keys. | `KVS.List`, `KVS.Get`, `KVS.GetMany`, `KVS.Set`, `KVS.Delete` |
| [x] 2.3 | **Script Manager (Basic)** | List scripts with running status, memory usage, CPU %. Start/Stop/Delete. View code. Basic code upload (chunked). Eval expressions in running scripts. | `Script.List`, `Script.Create`, `Script.Delete`, `Script.Start`, `Script.Stop`, `Script.PutCode`, `Script.GetCode`, `Script.Eval` |

---

## Phase 3 — Control Completeness [x]

**Goal:** Fill gaps in existing component workflows so every supported component type has full read/write config support.

| # | Feature | Description | API Methods |
|---|---|---|---|
| [x] 3.1 | **Cover Config Editor** | Movement timeouts, position limits, input mapping. | `Cover.GetConfig`, `Cover.SetConfig` |
| [x] 3.2 | **Light/Dimmer Config Editor** | Transition defaults, min/max brightness. | `Light.GetConfig`, `Light.SetConfig` |
| [x] 3.3 | **RGB/RGBW Config Editor** | Default colors, transition settings. | `RGB.GetConfig`, `RGB.SetConfig`, `RGBW.GetConfig`, `RGBW.SetConfig` |
| [x] 3.4 | **Schedule Enhancements** | Update existing schedules (`Schedule.Update`), delete all schedules (`Schedule.DeleteAll`), better timespec validation/helper UI. | `Schedule.Update`, `Schedule.DeleteAll` |
| [x] 3.5 | **Energy Data & Totals Reset** | Reset energy totals for EM/EM1/PM1. Optional historical data views. | `EMData.ResetTotals`, `EM1Data.ResetTotals`, `EMData.GetStatus`, `EM1Data.GetStatus` |

---

## Phase 4 — Polish, Integration & Future-Proofing [x]

**Goal:** Connectivity dashboards, security hardening, diagnostics, and support for newer component types.

| # | Feature | Description | API Methods |
|---|---|---|---|
| [x] 4.1 | **Cloud & Integration Status Panel** | Read-only connectivity overview: Cloud, MQTT, Outbound WebSocket, BLE status. | Read from `Shelly.GetStatus` |
| [x] 4.2 | **Proper Auth Management** | `Shelly.SetAuth` with correct digest `ha1` computation. Enable/disable auth toggle. Warn when auth enabled without stored password. | `Shelly.SetAuth` |
| [x] 4.3 | **Device Method Discovery** | Call `Shelly.ListMethods` to show supported RPC methods. Useful for debugging and forward compatibility. | `Shelly.ListMethods` |
| [x] 4.4 | **New Sensor/Component Support** | UI for newer component types: Presence/PresenceZone, RGBCCT (5-channel lights), BTHome sensors (via BLE), HTTP client status. | Component-specific `GetStatus` / `GetConfig` |

---

## Current API Coverage Summary

| Category | Implemented | Available | Coverage |
|---|---|---|---|
| Core RPC | GetDeviceInfo, GetStatus, GetConfig, Reboot, FactoryReset, CheckForUpdate, Update, SetAuth, ListProfiles, SetProfile, DetectLocation, ListTimezones, ListMethods | + GetComponents, ResetWiFiConfig | ~80% |
| Switch | Set, Toggle, GetConfig, SetConfig | — | 100% |
| Light / RGB / RGBW / RGBCCT | Set, GetConfig, SetConfig | — | 100% |
| Cover | Open, Close, Stop, GoToPosition, Calibrate, GetConfig, SetConfig | — | 100% |
| Schedule | List, Create, Update, Delete, DeleteAll | — | 100% |
| System | GetConfig, SetConfig, SetTime | — | 100% |
| WiFi | GetConfig, SetConfig, GetStatus, Scan, ListAPClients | — | 100% |
| Ethernet | GetConfig, SetConfig, GetStatus | — | 100% |
| Cloud | GetStatus (read-only) | GetConfig, SetConfig | ~33% |
| MQTT | GetStatus (read-only) | GetConfig, SetConfig | ~33% |
| BLE | GetStatus (read-only) | GetConfig, SetConfig | ~33% |
| Webhook | List, ListAllSupported, Create, Update, Delete, DeleteAll | — | 100% |
| KVS | List, Get, GetMany, Set, Delete | — | 100% |
| Script | List, Create, Delete, Start, Stop, PutCode, GetCode, Eval | — | 100% |
| Energy Data | GetStatus, ResetTotals | — | 100% |
| Presence / PresenceZone | GetStatus | GetConfig, SetConfig | ~33% |
| BTHome | GetStatus | GetConfig, SetConfig | ~33% |
| HTTP Client | GetStatus | GetConfig, SetConfig | ~33% |
| Other | — | Matter, Serial, Modbus, DALI, XMOD, Zigbee | 0% |

---

## Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Completed

Update this file as features are implemented.
