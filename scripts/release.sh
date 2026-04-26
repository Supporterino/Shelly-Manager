#!/usr/bin/env bash
# release.sh — Bump version, build iOS + macOS, upload to App Store Connect.
#
# Usage:
#   ./scripts/release.sh [--major | --minor | --patch] --mac-cert "<identity>"
#
# Flags:
#   --patch          Bump the patch component (default)
#   --minor          Bump the minor component, reset patch to 0
#   --major          Bump the major component, reset minor and patch to 0
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
#
# ─── App Store Disclaimers ────────────────────────────────────────────────────
#
# ENGLISH:
#   Disclaimer: This app is an independent, unofficial third-party tool and is
#   not affiliated with, endorsed by, sponsored by, or in any way connected to
#   Allterco Robotics Ltd. or its subsidiaries. "Shelly®" is a registered
#   trademark of Allterco Robotics Ltd. All product names, logos, and brands
#   mentioned are property of their respective owners and are used solely for
#   identification purposes. This app communicates with devices using their
#   publicly documented, open JSON-RPC 2.0 API.
#
# DEUTSCH:
#   Haftungsausschluss: Diese App ist ein unabhängiges, inoffizielles
#   Drittanbieter-Werkzeug und steht in keiner Verbindung zu Allterco Robotics
#   Ltd. oder dessen Tochtergesellschaften. Sie wird von Allterco Robotics Ltd.
#   weder unterstützt noch gesponsert oder anderweitig autorisiert. „Shelly®"
#   ist eine eingetragene Marke der Allterco Robotics Ltd. Alle genannten
#   Produktnamen, Logos und Marken sind Eigentum ihrer jeweiligen Inhaber und
#   werden ausschließlich zur Identifikation verwendet. Diese App kommuniziert
#   mit Geräten über deren öffentlich dokumentierte, offene JSON-RPC 2.0 API.
#
# FRANÇAIS:
#   Avertissement : Cette application est un outil tiers indépendant et non
#   officiel, sans aucune affiliation avec Allterco Robotics Ltd. ou ses
#   filiales. Elle n'est ni approuvée, ni sponsorisée, ni autorisée par
#   Allterco Robotics Ltd. « Shelly® » est une marque déposée d'Allterco
#   Robotics Ltd. Tous les noms de produits, logos et marques mentionnés sont
#   la propriété de leurs détenteurs respectifs et sont utilisés uniquement à
#   des fins d'identification. Cette application communique avec les appareils
#   via leur API JSON-RPC 2.0 ouverte et publiquement documentée.

set -euo pipefail

# ─── Colour helpers ───────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; RESET='\033[0m'

info() { echo -e "${BOLD}[release]${RESET} $*"; }
ok()   { echo -e "${GREEN}[release]${RESET} $*"; }
warn() { echo -e "${YELLOW}[release] WARN:${RESET} $*"; }
die()  { echo -e "${RED}[release] ERROR:${RESET} $*" >&2; exit 1; }

# ─── Locate project root ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Parse flags ──────────────────────────────────────────────────────────────
BUMP="patch"
MAC_CERT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --major) BUMP="major" ;;
    --minor) BUMP="minor" ;;
    --patch) BUMP="patch" ;;
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

# ─── Compute new semver ───────────────────────────────────────────────────────
NEW_VERSION=$(CURRENT_VERSION="$CURRENT_VERSION" BUMP="$BUMP" python3 <<'PYEOF'
import os
parts = os.environ["CURRENT_VERSION"].split(".")
major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
bump = os.environ["BUMP"]
if   bump == "major": major += 1; minor = 0; patch = 0
elif bump == "minor": minor += 1; patch = 0
else:                 patch += 1
print(f"{major}.{minor}.{patch}")
PYEOF
)

info "New version:     ${BOLD}${NEW_VERSION}${RESET}  (${BUMP} bump)"

# ─── 1. package.json ──────────────────────────────────────────────────────────
info "Updating package.json…"
NEW_VERSION="$NEW_VERSION" python3 <<'PYEOF'
import os, re
v = os.environ["NEW_VERSION"]
path = "package.json"
content = open(path).read()
content = re.sub(r'"version":\s*"[^"]+"', f'"version": "{v}"', content, count=1)
open(path, "w").write(content)
PYEOF

# ─── 2. src-tauri/tauri.conf.json ─────────────────────────────────────────────
info "Updating src-tauri/tauri.conf.json…"
NEW_VERSION="$NEW_VERSION" python3 <<'PYEOF'
import os, re
v = os.environ["NEW_VERSION"]
path = "src-tauri/tauri.conf.json"
content = open(path).read()
content = re.sub(r'"version":\s*"[^"]+"', f'"version": "{v}"', content, count=1)
open(path, "w").write(content)
PYEOF

# ─── 3. src-tauri/Cargo.toml ──────────────────────────────────────────────────
info "Updating src-tauri/Cargo.toml…"
NEW_VERSION="$NEW_VERSION" python3 <<'PYEOF'
import os, re
v = os.environ["NEW_VERSION"]
path = "src-tauri/Cargo.toml"
content = open(path).read()
# Find the [package] section (ends at the next section header)
# and only replace the standalone version line within it.
def replace_package_version(text, new_ver):
    # Match [package] block up to (but not including) the next [section]
    m = re.search(r'(\[package\])(.*?)(\n\[)', text, re.DOTALL)
    if not m:
        raise ValueError("[package] section not found in Cargo.toml")
    before = text[:m.start()]
    pkg    = m.group(1) + m.group(2)
    after  = m.group(3) + text[m.end():]
    pkg    = re.sub(r'^(version\s*=\s*)"[^"]+"', rf'\g<1>"{new_ver}"', pkg, flags=re.MULTILINE)
    return before + pkg + after
content = replace_package_version(content, v)
open(path, "w").write(content)
PYEOF

# ─── 4. src-tauri/gen/apple/shelly-manager_iOS/Info.plist ────────────────────
info "Updating Info.plist…"
PLIST="src-tauri/gen/apple/shelly-manager_iOS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${NEW_VERSION}" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${NEW_VERSION}"            "$PLIST"

# ─── 5. src-tauri/gen/apple/project.yml ──────────────────────────────────────
info "Updating project.yml…"
NEW_VERSION="$NEW_VERSION" python3 <<'PYEOF'
import os, re
v = os.environ["NEW_VERSION"]
path = "src-tauri/gen/apple/project.yml"
content = open(path).read()
# CFBundleShortVersionString: 0.1.0   (unquoted)
content = re.sub(r'(CFBundleShortVersionString:\s*)[\d.]+', rf'\g<1>{v}', content)
# CFBundleVersion: "0.1.0"            (quoted)
content = re.sub(r'(CFBundleVersion:\s*)["\']?[\d.]+["\']?', rf'\g<1>"{v}"', content)
open(path, "w").write(content)
PYEOF

ok "All version files updated to ${NEW_VERSION}."

# ─── Git commit + tag ─────────────────────────────────────────────────────────
info "Creating git commit and tag…"
git add -A
git commit -m "chore: 🔖 Bump version to v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
ok "Tagged v${NEW_VERSION}."

# ─── iOS build ────────────────────────────────────────────────────────────────
info "Building iOS (export-method: app-store-connect)…"
bun run tauri ios build --export-method app-store-connect
ok "iOS build complete."

IPA="src-tauri/gen/apple/build/arm64/ShellMan.ipa"
[[ -f "$IPA" ]] || die "IPA not found at expected path: ${IPA}"

# ─── macOS build ──────────────────────────────────────────────────────────────
#info "Building macOS (universal binary)…"
#
#APPSTORE_CONF="src-tauri/tauri.appstore.conf.json"
#BUNDLE_EXTRA_ARGS=()
#if [[ -f "$APPSTORE_CONF" ]]; then
#  info "Merging App Store config: ${APPSTORE_CONF}"
#  BUNDLE_EXTRA_ARGS=(--config "$APPSTORE_CONF")
#else
#  warn "${APPSTORE_CONF} not found — building without App Sandbox entitlements."
#  warn "The submission may be rejected by Apple. See: https://v2.tauri.app/distribute/app-store/#macos"
#fi
#
#bun run tauri build --no-bundle
#bun run tauri bundle --bundles app --target universal-apple-darwin "${BUNDLE_EXTRA_ARGS[@]+"${BUNDLE_EXTRA_ARGS[@]}"}"
#
#APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/ShellMan.app"
#[[ -d "$APP_PATH" ]] || die ".app bundle not found at: ${APP_PATH}"
#
#PKG="${ROOT}/ShellMan.pkg"
#
#info "Signing and packaging .pkg…"
#xcrun productbuild \
#  --sign "$MAC_CERT" \
#  --component "$APP_PATH" \
#  /Applications \
#  "$PKG"
#ok "macOS .pkg created."

# ─── Upload iOS ───────────────────────────────────────────────────────────────
info "Uploading iOS IPA to App Store Connect…"
xcrun altool \
  --upload-app \
  --type ios \
  --file "$IPA" \
  --apiKey    "$APPLE_API_KEY" \
  --apiIssuer "$APPLE_API_ISSUER"
ok "iOS upload complete."

# ─── Upload macOS ─────────────────────────────────────────────────────────────
#info "Uploading macOS PKG to App Store Connect…"
#xcrun altool \
#  --upload-app \
#  --type macos \
#  --file "$PKG" \
#  --apiKey    "$APPLE_API_KEY" \
#  --apiIssuer "$APPLE_API_ISSUER"
#ok "macOS upload complete."

# ─── Cleanup ──────────────────────────────────────────────────────────────────
#rm -f "$PKG"
#ok "Cleaned up temporary .pkg."

echo ""
echo -e "${GREEN}${BOLD}Release v${NEW_VERSION} submitted successfully.${RESET}"
echo "Both builds are now processing in App Store Connect / TestFlight."
