## Purpose

Lets a user define one fleet-wide MQTT configuration template and apply it, safely and with visibility into the effect, to many devices at once, instead of configuring MQTT on each device individually.

## ADDED Requirements

### Requirement: Fleet-wide MQTT template definition
The system SHALL provide a single global template for MQTT configuration containing: `enable`, `server`, `user`, `pass`, `enable_rpc`, `rpc_ntf`, `status_ntf`, a `client_id` template, and a `topic_prefix` template.

#### Scenario: Template persists across sessions
- **WHEN** the user fills in the global MQTT template and leaves the panel
- **THEN** the system persists the template (including credentials) so it is available the next time the panel is opened, without requiring re-entry

#### Scenario: Default identifier templates
- **WHEN** the user has not customized the `client_id` or `topic_prefix` templates
- **THEN** the system pre-fills them with `shelly-{mac}` and `shellies/{mac}` respectively

### Requirement: Per-device identifier templating
The system SHALL resolve `client_id` and `topic_prefix` templates per device using placeholders that reference that device's own identity, at minimum `{mac}` and `{name}`.

#### Scenario: Resolving placeholders
- **WHEN** the template `shelly-{mac}` is resolved for a device with MAC `AABBCCDDEEFF`
- **THEN** the resolved value is `shelly-AABBCCDDEEFF`

#### Scenario: Unknown placeholder
- **WHEN** a template contains a placeholder that is not `{mac}` or `{name}`
- **THEN** the system SHALL flag the template as invalid and prevent applying it until corrected

### Requirement: Fleet MQTT status dashboard
The system SHALL display, for every stored device, its current MQTT enabled/connected status and allow the user to select a subset of devices for a bulk action.

#### Scenario: Status shown per device
- **WHEN** the user opens the global MQTT panel
- **THEN** the system shows each device's current enabled and connected state alongside a selection control

#### Scenario: Select all devices
- **WHEN** the user chooses "select all"
- **THEN** every listed device becomes selected for the next bulk action

### Requirement: Preview before applying
The system SHALL show a per-device, per-field preview of what will change before pushing the template to any device, and SHALL NOT modify any device's configuration without explicit confirmation of this preview.

#### Scenario: No-op device
- **WHEN** a selected device's current MQTT configuration already matches the resolved template for every managed field
- **THEN** the preview marks that device as unchanged and it is not sent an update when the user confirms

#### Scenario: Field will change
- **WHEN** a selected device's current configuration differs from the resolved template on one or more managed fields
- **THEN** the preview lists which fields will change for that device before the user confirms

#### Scenario: Overwriting a manual customization
- **WHEN** a selected device's current `client_id` or `topic_prefix` does not match what the template would produce
- **THEN** the preview explicitly flags that applying the template will overwrite this device's existing custom value

### Requirement: Collision detection before applying
The system SHALL detect when the resolved `client_id` or `topic_prefix` for two or more selected devices would be identical, and SHALL warn the user before allowing the apply action to proceed.

#### Scenario: Duplicate resolved topic_prefix
- **WHEN** two selected devices share the same `{name}` and the topic_prefix template relies on `{name}`
- **THEN** the system warns that both devices would resolve to the same topic_prefix and requires the user to acknowledge or adjust the selection/template before proceeding

### Requirement: Bulk apply with per-device result reporting
The system SHALL apply the resolved template to each confirmed device sequentially and report a per-device success or failure result.

#### Scenario: All devices succeed
- **WHEN** the user confirms applying the template to N selected devices and every device accepts the update
- **THEN** the system reports N successes and no further action is required

#### Scenario: Some devices fail
- **WHEN** one or more devices are unreachable or reject the update during a bulk apply
- **THEN** the system continues applying to the remaining devices, and reports which devices failed and which succeeded once the operation completes
