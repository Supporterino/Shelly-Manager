# Shelly Manager

> **This project is currently under active development and is not yet ready for use.**

A local-network manager for Shelly smart devices, built as a cross-platform desktop and mobile app.

## Target

Shelly Manager lets you discover, monitor, and control Shelly Gen 2/3/4 devices on your local network — no cloud required. All communication happens directly over your LAN using the Shelly JSON-RPC 2.0 API.

**Supported platforms:** iOS · Android · macOS · Windows · Linux

**Supported devices:** Shelly Gen 2, Gen 3, Gen 4 (JSON-RPC 2.0)

Features planned:

- Automatic device discovery via mDNS and subnet scan
- Manual device addition by IP
- Real-time status updates via WebSocket
- Control of switches, dimmers, RGB/RGBW lights, covers, and sensors
- Energy monitoring
- Firmware update management
- Schedules
- Multi-language UI (English, German, French, Spanish, Chinese, Japanese)

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | Tauri v2 |
| Frontend | React 19 + TypeScript |
| UI | Mantine v9 + Tabler icons |
| Routing | TanStack Router |
| State | Zustand + TanStack Query |
| i18n | react-i18next |

## Status

Under development. See [PLAN.md](./PLAN.md) for the full build plan and phase progress.
