#!/usr/bin/env bash
# release-mac.sh — Build macOS and upload to App Store Connect (no version bump).
#
# Usage:
#   ./scripts/release-mac.sh --mac-cert "<identity>"
#
# Flags:
#   --mac-cert <id>  Mac Installer Distribution signing identity (required)
#                    Find yours: security find-identity -v -p basic
#
# Required env vars:
#   APPLE_API_KEY     App Store Connect API Key ID  (e.g. ABC1234567)
#   APPLE_API_ISSUER  App Store Connect Issuer UUID
#
# The altool .p8 private key must exist in one of:
#   ./private_keys/AuthKey_<APPLE_API_KEY>.p8
#   ~/private_keys/
#   ~/.private_keys/
#   ~/.appstoreconnect/private_keys/

set -euo pipefail

# ─── Colour helpers ───────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; RESET='\033[0m'

info() { echo -e "${BOLD}[release-mac]${RESET} $*"; }
ok()   { echo -e "${GREEN}[release-mac]${RESET} $*"; }
warn() { echo -e "${YELLOW}[release-mac] WARN:${RESET} $*"; }
die()  { echo -e "${RED}[release-mac] ERROR:${RESET} $*" >&2; exit 1; }

# ─── Locate project root ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Parse flags ──────────────────────────────────────────────────────────────
MAC_CERT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mac-cert)
      [[ -z "${2:-}" ]] && die "--mac-cert requires a value"
      MAC_CERT="$2"; shift ;;
    *) die "Unknown argument: $1" ;;
  esac
  shift
done

# ─── Preflight checks ─────────────────────────────────────────────────────────
info "Running preflight checks…"

[[ -n "$MAC_CERT" ]]             || die "--mac-cert is required (Mac Installer Distribution identity)"
[[ -n "${APPLE_API_KEY:-}" ]]    || die "APPLE_API_KEY environment variable is not set"
[[ -n "${APPLE_API_ISSUER:-}" ]] || die "APPLE_API_ISSUER environment variable is not set"

command -v bun     >/dev/null 2>&1 || die "'bun' is not on PATH"
command -v xcrun   >/dev/null 2>&1 || die "'xcrun' is not on PATH"
command -v python3 >/dev/null 2>&1 || die "'python3' is not on PATH"
command -v git     >/dev/null 2>&1 || die "'git' is not on PATH"

cd "$ROOT"

[[ -z "$(git status --porcelain)" ]] \
  || die "Working tree is not clean — commit or stash your changes before releasing."

ok "Preflight passed."

# ─── Read current version ─────────────────────────────────────────────────────
CURRENT_VERSION=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")
info "Current version: ${BOLD}${CURRENT_VERSION}${RESET}"

# ─── macOS build ──────────────────────────────────────────────────────────────
info "Building macOS (universal binary)…"

APPSTORE_CONF="src-tauri/tauri.appstore.conf.json"
BUNDLE_EXTRA_ARGS=()
if [[ -f "$APPSTORE_CONF" ]]; then
  info "Merging App Store config: ${APPSTORE_CONF}"
  BUNDLE_EXTRA_ARGS=(--config "$APPSTORE_CONF")
else
  warn "${APPSTORE_CONF} not found — building without App Sandbox entitlements."
  warn "The submission may be rejected by Apple. See: https://v2.tauri.app/distribute/app-store/#macos"
fi

bun run tauri build --target universal-apple-darwin --bundles app "${BUNDLE_EXTRA_ARGS[@]+"${BUNDLE_EXTRA_ARGS[@]}"}"

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/ShellMan.app"
[[ -d "$APP_PATH" ]] || die ".app bundle not found at: ${APP_PATH}"

PKG="${ROOT}/ShellMan.pkg"

info "Signing and packaging .pkg…"
xcrun productbuild \
  --sign "$MAC_CERT" \
  --component "$APP_PATH" \
  /Applications \
  "$PKG"
ok "macOS .pkg created."

# ─── Upload macOS ─────────────────────────────────────────────────────────────
info "Uploading macOS PKG to App Store Connect…"
xcrun altool \
  --upload-app \
  --type macos \
  --file "$PKG" \
  --apiKey    "$APPLE_API_KEY" \
  --apiIssuer "$APPLE_API_ISSUER"
ok "macOS upload complete."

# ─── Cleanup ──────────────────────────────────────────────────────────────────
rm -f "$PKG"
ok "Cleaned up temporary .pkg."

echo ""
echo -e "${GREEN}${BOLD}macOS release v${CURRENT_VERSION} submitted successfully.${RESET}"
echo "Build is now processing in App Store Connect / TestFlight."
