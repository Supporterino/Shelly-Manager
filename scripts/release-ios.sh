#!/usr/bin/env bash
# release-ios.sh — Bump version, build iOS, upload to App Store Connect.
#
# Usage:
#   ./scripts/release-ios.sh [--major | --minor | --patch]
#
# Flags:
#   --patch          Bump the patch component (default)
#   --minor          Bump the minor component, reset patch to 0
#   --major          Bump the major component, reset minor and patch to 0
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

info() { echo -e "${BOLD}[release]${RESET} $*"; }
ok()   { echo -e "${GREEN}[release]${RESET} $*"; }
warn() { echo -e "${YELLOW}[release] WARN:${RESET} $*"; }
die()  { echo -e "${RED}[release] ERROR:${RESET} $*" >&2; exit 1; }

# ─── Locate project root ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Parse flags ──────────────────────────────────────────────────────────────
BUMP="patch"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --major) BUMP="major" ;;
    --minor) BUMP="minor" ;;
    --patch) BUMP="patch" ;;
    *) die "Unknown argument: $1" ;;
  esac
  shift
done

# ─── Preflight checks ─────────────────────────────────────────────────────────
info "Running preflight checks…"
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
PLIST="src-tauri/gen/apple/shellman_iOS/Info.plist"
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

# ─── Upload iOS ───────────────────────────────────────────────────────────────
info "Uploading iOS IPA to App Store Connect…"
xcrun altool \
  --upload-app \
  --type ios \
  --file "$IPA" \
  --apiKey    "$APPLE_API_KEY" \
  --apiIssuer "$APPLE_API_ISSUER"
ok "iOS upload complete."

echo ""
echo -e "${GREEN}${BOLD}iOS release v${NEW_VERSION} submitted successfully.${RESET}"
echo "Build is now processing in App Store Connect / TestFlight."
