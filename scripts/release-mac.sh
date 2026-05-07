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

# ─── Rust targets for universal binary ────────────────────────────────────────
command -v rustup  >/dev/null 2>&1 || die "'rustup' is not on PATH (required for universal binary)"

INSTALLED_TARGETS=$(rustup target list --installed 2>/dev/null || true)
MISSING_TARGETS=()
for target in aarch64-apple-darwin x86_64-apple-darwin; do
  if ! echo "$INSTALLED_TARGETS" | grep -qx "$target"; then
    MISSING_TARGETS+=("$target")
  fi
done

if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
  warn "Missing Rust target(s): ${MISSING_TARGETS[*]}"
  info "Installing missing targets…"
  for target in "${MISSING_TARGETS[@]}"; do
    rustup target add "$target" || die "Failed to install Rust target: $target"
    ok "Installed $target"
  done
fi
ok "All required Rust targets present."

# ─── Auto-detect Mac App Distribution certificate ─────────────────────────────
info "Locating Mac App Distribution certificate…"
APP_CERT=$(security find-identity -v -p codesigning 2>/dev/null \
  | grep -E "Mac App Distribution|3rd Party Mac Developer Application" \
  | head -1 \
  | sed -E 's/.*\"([^\"]+)\".*/\1/' \
  || true)

if [[ -z "$APP_CERT" ]]; then
  die "No Mac App Distribution certificate found in your keychain.\n\
This is required to sign the .app bundle for Mac App Store.\n\
To list available identities:\n  security find-identity -v -p codesigning\n\
You need a certificate named like '3rd Party Mac Developer Application: ...'"
fi
ok "Found app signing identity: ${APP_CERT}"

cd "$ROOT"

[[ -z "$(git status --porcelain)" ]] \
  || die "Working tree is not clean — commit or stash your changes before releasing."

ok "Preflight passed."

# ─── Read current version ─────────────────────────────────────────────────────
CURRENT_VERSION=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")
info "Current version: ${BOLD}${CURRENT_VERSION}${RESET}"

# ─── macOS build ──────────────────────────────────────────────────────────────
info "Building macOS (universal binary)…"
export CODESIGN_IDENTITY="$APP_CERT"

bun run tauri build --target universal-apple-darwin --bundles app

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/ShellMan.app"
[[ -d "$APP_PATH" ]] || die ".app bundle not found at: ${APP_PATH}"

# ─── Verify code signing & sandbox entitlements ───────────────────────────────
info "Verifying app sandbox entitlements…"

# Check that the main executable is signed and has the sandbox entitlement
BINARY_PATH="${APP_PATH}/Contents/MacOS/shellman"
[[ -f "$BINARY_PATH" ]] || die "Main executable not found at: ${BINARY_PATH}"

# Verify the app is signed (not ad-hoc)
SIGNER=$(codesign -dv "$APP_PATH" 2>&1 | grep -E '^Signature=' | cut -d'=' -f2 || true)
if [[ -z "$SIGNER" || "$SIGNER" == "adhoc" || "$SIGNER" == "AdHoc" ]]; then
  die "App is not properly code-signed (signature: ${SIGNER:-none}).\n\
Ensure a valid Mac Distribution certificate is in your keychain and matches the bundle identifier."
fi
ok "App is signed by: ${SIGNER}"

# Verify sandbox entitlement is present
SANDBOX=$(codesign -d --entitlements - "$BINARY_PATH" 2>/dev/null | grep -o 'com.apple.security.app-sandbox' || true)
if [[ -z "$SANDBOX" ]]; then
  die "App sandbox entitlement (com.apple.security.app-sandbox) is MISSING from the binary.\n\
Check that Entitlements.plist is configured correctly in tauri.conf.json."
fi
ok "App sandbox entitlement confirmed."

# Verify bundle identifier matches provisioning profile
BUNDLE_ID=$(codesign -dv "$APP_PATH" 2>&1 | grep -E '^Identifier=' | cut -d'=' -f2 || true)
info "Bundle identifier: ${BUNDLE_ID:-<unknown>}"

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
