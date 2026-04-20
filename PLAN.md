# Shelly Manager — Bug Fix Plan

> This document tracks all known bugs, their root causes, and the exact fix plan for each.
> Bugs are independent and can be worked in any order.

---

## Table of Contents

1. [Bug 1 — Online pill wraps to second row](#bug-1--online-pill-wraps-to-second-row)
2. [Bug 2 — Sort select visually larger than siblings](#bug-2--sort-select-visually-larger-than-siblings)
3. [Bug 3 — "Add Selected" is a huge button](#bug-3--add-selected-is-a-huge-button)
4. [Bug 4 — Settings page arbitrary width cap and left-aligned](#bug-4--settings-page-arbitrary-width-cap-and-left-aligned)
5. [Bug 5 — Correct color scheme only applied when opening settings](#bug-5--correct-color-scheme-only-applied-when-opening-settings)
6. [Bug 6 — Language toggle does nothing](#bug-6--language-toggle-does-nothing)
7. [Bug 7 — Version field is empty](#bug-7--version-field-is-empty)
8. [Bug 8 — mDNS does not work on iOS](#bug-8--mdns-does-not-work-on-ios)
9. [Bug 9 — Subnet scan returns no devices for large CIDRs](#bug-9--subnet-scan-returns-no-devices-for-large-cidrs)
10. [Bug 10 — Stepper stacks steps vertically on mobile](#bug-10--stepper-stacks-steps-vertically-on-mobile)

---

## Bug 1 — Online pill wraps to second row

**Status:** Open  
**File:** `src/components/devices/DeviceCard.tsx`

### Root cause

The top `Group` (`justify="space-between"`) has no `wrap="nowrap"` constraint. When the device name is long, the flex container wraps and `DeviceStatusBadge` drops to a second line.

### Fix

- Add `wrap="nowrap"` to the outer `Group` so the badge always stays on the same row.
- Add `style={{ flexShrink: 0 }}` to the `DeviceStatusBadge` element so it is never compressed.
- Add `style={{ minWidth: 0 }}` to the inner `Group` (icon + name/model stack) so `lineClamp={1}` can actually truncate the name text rather than forcing the badge out.

```diff
- <Group justify="space-between" align="flex-start">
-   <Group gap="xs" align="center">
+ <Group justify="space-between" align="flex-start" wrap="nowrap">
+   <Group gap="xs" align="center" style={{ minWidth: 0 }}>
      ...
    </Group>
-   <DeviceStatusBadge status={connectionStatus} />
+   <DeviceStatusBadge status={connectionStatus} style={{ flexShrink: 0 }} />
  </Group>
```

---

## Bug 2 — Sort select visually larger than siblings

**Status:** Open  
**File:** `src/routes/index.tsx`

### Root cause

The `<Select>` in the filter toolbar has a `label={t('sort.label')}` prop. This renders a text label above the input field, making the whole control taller than the adjacent `Chip.Group` and `TextInput` which have no labels.

### Fix

Remove the `label` prop from the `Select`. The intent ("Sort by") is self-evident from the options. Optionally surface it as a `Tooltip` if needed for accessibility.

```diff
  <Select
    data={[...]}
    value={sortKey}
    onChange={(v) => setSortKey((v as SortKey) ?? 'name')}
    allowDeselect={false}
    size="sm"
    w={130}
-   label={t('sort.label')}
  />
```

---

## Bug 3 — "Add Selected" is a huge button

**Status:** Open  
**File:** `src/components/discovery/FoundDevicesList.tsx`

### Root cause

A full-width `<Button>` with verbose translated text is used at the bottom of the device list.

### Fix

- Replace the `Button` with a Mantine `ActionIcon` (`variant="filled"`, `size="lg"`, `color="blue"`) containing `IconCheck`.
- Overlay a `Badge` showing the selected count using Mantine's `Indicator` component (top-right corner of the ActionIcon).
- Add a `Tooltip` with label `t('addSelected')` for screen-reader and hover accessibility.
- Place it right-aligned via `Group justify="flex-end"`.

```tsx
<Group justify="flex-end" mt="xs">
  <Tooltip label={`${t('addSelected')} (${selected.size})`}>
    <Indicator label={String(selected.size)} size={16} disabled={selected.size === 0}>
      <ActionIcon
        variant="filled"
        size="lg"
        color="blue"
        disabled={selected.size === 0}
        onClick={handleAdd}
        aria-label={t('addSelected')}
      >
        <IconCheck size={18} />
      </ActionIcon>
    </Indicator>
  </Tooltip>
</Group>
```

---

## Bug 4 — Settings page arbitrary width cap and left-aligned

**Status:** Open  
**File:** `src/routes/settings.tsx`

### Root cause

The root `<Stack>` has `maw={520}` which caps the width and, having no centering wrapper, causes the content to be anchored to the left edge on wide viewports.

### Fix

- Remove `maw={520}` from the `Stack`.
- Wrap the `Stack` in a Mantine `<Container size="md">`. `Container` automatically centers its content and applies a responsive max-width that scales with breakpoints — matching the rest of the app's layout conventions.

```diff
+ <Container size="md">
-   <Stack gap="lg" p="md" maw={520}>
+   <Stack gap="lg" p="md">
      ...
    </Stack>
+ </Container>
```

---

## Bug 5 — Correct color scheme only applied when opening settings

**Status:** Open  
**File:** `src/routes/__root.tsx`  
**Secondary:** `src/routes/settings.tsx` (cleanup)

### Root cause

`setColorScheme` (Mantine) is only called inside `settings.tsx` in a `useEffect` on that page's mount. The stored theme preference is never applied to Mantine when the app first launches — Mantine defaults to `'light'` until the user opens Settings.

### Fix

In `RootLayout` (`__root.tsx`), subscribe to `isHydrated` and `preferences.theme` from `appStore`, then call `setColorScheme` once the store has been hydrated from disk:

```tsx
const { setColorScheme } = useMantineColorScheme()
const isHydrated = useAppStore(s => s.isHydrated)
const theme = useAppStore(s => s.preferences.theme)

useEffect(() => {
  if (isHydrated) {
    setColorScheme(theme === 'system' ? 'auto' : theme)
  }
}, [isHydrated, theme, setColorScheme])
```

After this change, remove the duplicate `useEffect` from `settings.tsx` that does the same sync on page mount (it becomes redundant).

---

## Bug 6 — Language toggle does nothing

**Status:** Open  
**File:** `src/components/settings/LanguageSelect.tsx`

### Root cause

`value={i18n.language}` is used as the Select's controlled value. When the browser locale is a regional tag like `'en-US'`, `i18n.language` returns `'en-US'` which does not match any option in `SUPPORTED_LOCALES` (which uses bare codes like `'en'`). The Select renders with no selected item. Users interact with it, `setLocale` is called, `i18next.changeLanguage` runs, but subsequent renders still read the (now correct) `i18n.language` directly — bypassing the Zustand store, which is the actual reactive source of truth.

### Fix

Use `appStore`'s `preferences.locale` (reactive Zustand state) as the primary value source, falling back to the normalized `i18n.language` for the initial browser-detected language:

```tsx
const locale = useAppStore(s => s.preferences.locale)
const value = locale || i18n.language.split('-')[0]

<Select
  data={SUPPORTED_LOCALES}
  value={value}
  onChange={(val) => void (val && setLocale(val))}
  allowDeselect={false}
  w={180}
/>
```

---

## Bug 7 — Version field is empty

**Status:** Open  
**Files:** `src-tauri/capabilities/default.json`, `src-tauri/capabilities/mobile.json`

### Root cause

Tauri v2 uses a capability-based permission model. `getVersion()` from `@tauri-apps/api/app` calls the Tauri core `app > version` command under the hood. Without `"core:app:default"` (or the narrower `"core:app:allow-version"`) listed in the capability manifest, the call is silently denied and returns an empty string. The `.catch()` handler in `settings.tsx` is never hit because the promise resolves — just with `''`.

### Fix

Add `"core:app:default"` to the `permissions` array in **both** capability files:

**`src-tauri/capabilities/default.json`**
```json
"permissions": [
  "core:app:default",
  { "identifier": "http:default", "allow": [{ "url": "http://*/*" }] },
  "websocket:default",
  "store:default"
]
```

**`src-tauri/capabilities/mobile.json`** — same change.

---

## Bug 8 — mDNS does not work on iOS

**Status:** Open  
**File:** `src-tauri/src/lib.rs`

### Root cause

iOS sandboxes UDP multicast (port 5353). Before `mdns-sd` can successfully bind the multicast socket, iOS must have shown the _Local Network Usage_ permission dialog and the user must have accepted it. This dialog is only triggered by an actual TCP or UDP connection attempt to a local-network address — not by the raw socket bind that happens inside the Rust `ServiceDaemon`. The app never triggers the prompt, so permission is never granted, and the daemon silently finds nothing.

`NSLocalNetworkUsageDescription` and `NSBonjourServices` in `Info.plist` are already correctly set (required but not sufficient on their own).

### Fix — Permission primer

Add a `#[cfg(target_os = "ios")]` block at the start of `discover_mdns` that fires a short-timeout TCP connection attempt to a common LAN gateway address. The connection is expected to fail; its sole purpose is to cause iOS to show the permission dialog before `ServiceDaemon::new()` attempts to bind the multicast socket.

```rust
#[cfg(target_os = "ios")]
{
    // Trigger the iOS Local Network Usage permission dialog.
    // This connection is expected to fail; we only need the attempt to
    // cause iOS to show the local-network permission prompt.
    let _ = tokio::time::timeout(
        Duration::from_millis(200),
        tokio::net::TcpStream::connect("192.168.1.1:80"),
    )
    .await;
    // Allow iOS a moment to process the permission prompt before we bind
    // the multicast socket.
    tokio::time::sleep(Duration::from_millis(500)).await;
}
```

Additionally, in the discovery UI (`src/routes/discover.tsx` or `src/components/discovery/DiscoveryProgress.tsx`), show a dismissible `Alert` (color `"yellow"`) on iOS when mDNS returns zero results, instructing the user to:
1. Open iOS Settings → Privacy → Local Network and enable access for Shelly Manager.
2. Alternatively, use Subnet Scan or Manual Add.

---

## Bug 9 — Subnet scan returns no devices for large CIDRs

**Status:** Open  
**Files:** `src-tauri/src/lib.rs`, `src/components/discovery/DiscoveryMethodSelect.tsx`

### Root cause

A `/16` CIDR expands to 65 534 host addresses. The current code immediately spawns **all 65 534 Tokio tasks** into a single `JoinSet`, then limits concurrency with a semaphore of 50. Even though the tasks are lightweight, this causes:

1. **Memory pressure** — ~65k task handles allocated at once.
2. **Extreme scan time** — `65 534 / 50 × timeout_ms` ≈ 11 minutes at 500 ms/host. The frontend likely times out or the user gives up.
3. **File-descriptor exhaustion** — each in-flight task holds an open TCP socket.

### Fix — Two-part

#### Part A — Rust: chunked batch processing

Instead of a single `JoinSet` over all IPs, process hosts in chunks of 256. Each chunk is fully resolved before the next is spawned. This bounds in-flight task count and file-descriptor usage without changing the overall algorithm or adding new crates.

Also:
- Raise the semaphore to 100 for better throughput on small CIDRs.
- Add a hard cap: if `expand_cidr` yields more than **8 192** hosts (prefix < `/19`), return an early `Err` with the message `"CIDR too large — maximum supported range is /19 (8192 hosts). Use a narrower subnet."`.

```rust
// Hard cap
if ips.len() > 8192 {
    return Err("CIDR too large — maximum supported range is /19 (8192 hosts). Use a narrower subnet.".to_string());
}

// Chunked scan — process 256 IPs at a time
for chunk in ips.chunks(256) {
    let mut join_set: JoinSet<Option<DiscoveredHost>> = JoinSet::new();
    for ip in chunk {
        let sem = semaphore.clone();
        let ip_str = ip.clone();
        join_set.spawn(async move {
            let _permit = sem.acquire().await.ok()?;
            // ... TCP connect as before
        });
    }
    while let Some(result) = join_set.join_next().await {
        if let Ok(Some(host)) = result {
            results.push(host);
        }
    }
}
```

#### Part B — UI: proactive validation

In `DiscoveryMethodSelect.tsx`, parse the CIDR on input change and show:
- A Mantine `Alert` (color `"orange"`) when prefix length < 21 (> 2 048 hosts): "Large subnet detected — scanning may take several minutes. Consider narrowing to /24."
- A Mantine `Alert` (color `"red"`) when prefix length < 19 (> 8 192 hosts): "Subnet too large — maximum supported is /19. Please use a narrower range."  This matches the Rust-side hard cap so the user sees the validation before the scan starts.

---

## Bug 10 — Stepper stacks steps vertically on mobile

**Status:** Open  
**File:** `src/routes/discover.tsx`

### Root cause

Mantine's `Stepper` renders all step labels and content stacked vertically on narrow viewports. With three steps, this wastes significant vertical space and is visually confusing on small screens.

### Fix — Responsive step indicator

Extract each step's body into named sub-components (`StepChooseMethod`, `StepSearching`, `StepReview`) that receive the same props. Then render two separate layout variants using `hiddenFrom` / `visibleFrom`:

**Mobile (`base`, hidden from `sm`):**
- A `Group justify="space-between"` containing the current step title (`Text fw={600}`) and a `Badge variant="outline"` showing "N / 3".
- A thin `Progress` bar below: `value={(step / 2) * 100}`, `size="xs"`, `animated` when `step === 1`.
- The active step's sub-component renders below the bar — no other step content is mounted.

**Desktop (`sm+`, visible from `sm`):**
- The existing `Stepper` unchanged, using the same sub-components as children.

```tsx
{/* Mobile */}
<Box hiddenFrom="sm">
  <Group justify="space-between" mb={4}>
    <Text fw={600}>{stepTitles[step]}</Text>
    <Badge variant="outline">{step + 1} / 3</Badge>
  </Group>
  <Progress value={(step / 2) * 100} size="xs" animated={step === 1} mb="md" />
  {step === 0 && <StepChooseMethod {...stepProps} />}
  {step === 1 && <StepSearching {...stepProps} />}
  {step === 2 && <StepReview {...stepProps} />}
</Box>

{/* Desktop */}
<Box visibleFrom="sm">
  <Stepper active={step} color="blue" allowNextStepsSelect={false}>
    <Stepper.Step label={t('steps.chooseMethod')}>
      <StepChooseMethod {...stepProps} />
    </Stepper.Step>
    <Stepper.Step label={t('steps.searching')} loading={status === 'running'}>
      <StepSearching {...stepProps} />
    </Stepper.Step>
    <Stepper.Step label={t('steps.review')}>
      <StepReview {...stepProps} />
    </Stepper.Step>
  </Stepper>
</Box>
```
