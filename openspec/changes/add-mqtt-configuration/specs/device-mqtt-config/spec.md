## Purpose

Lets a user view and edit a single Shelly device's live MQTT client configuration (broker connection, credentials, identifiers, and RPC/notification behavior) directly from that device's settings page, without needing the device's own web UI.

## ADDED Requirements

### Requirement: View current MQTT configuration
The system SHALL display a device's current MQTT configuration, read live from the device, in the device settings page.

#### Scenario: Loading state while fetching
- **WHEN** the user opens the MQTT section of a device's settings page
- **THEN** the system shows a loading indicator until the device's current MQTT configuration has been retrieved

#### Scenario: Configuration retrieved successfully
- **WHEN** the device responds with its current MQTT configuration
- **THEN** the system displays the values for enable, server, user, client_id, topic_prefix, enable_rpc, rpc_ntf, and status_ntf (password is not echoed back or displayed)

#### Scenario: Device unreachable
- **WHEN** the device does not respond or returns an error while fetching its MQTT configuration
- **THEN** the system shows an error state and does not display stale or partial configuration values

### Requirement: Edit and save MQTT configuration
The system SHALL allow a user to modify a device's MQTT configuration fields and persist the changes to the device.

#### Scenario: Successful save
- **WHEN** the user changes one or more MQTT fields and confirms the save action
- **THEN** the system sends the updated configuration to the device and, on success, reflects the newly saved values in the section

#### Scenario: Save fails
- **WHEN** the device rejects the configuration update or is unreachable during save
- **THEN** the system shows an error notification and preserves the user's unsaved edits in the form

#### Scenario: Discard unsaved changes
- **WHEN** the user cancels an in-progress edit
- **THEN** the system reverts the form to the device's last known saved configuration without sending any request

### Requirement: Full MQTT field set available per device
The system SHALL expose every MQTT configuration field supported by this change on the per-device section, independent of what the global fleet template manages.
Fields: `enable`, `server`, `user`, `pass`, `client_id`, `topic_prefix`, `enable_rpc`, `rpc_ntf`, `status_ntf`.

#### Scenario: Editing a field not covered by the global template
- **WHEN** the user edits `client_id` or `topic_prefix` directly on a device's own MQTT section
- **THEN** the system saves the custom value to that device, independent of the global fleet template's derived value

### Requirement: Password write-only
The system SHALL treat the MQTT broker password as write-only: it MAY be entered or changed by the user, but the system SHALL NOT display a previously saved password back to the user.

#### Scenario: Opening the section with an existing password set
- **WHEN** the device's current configuration includes a non-empty password
- **THEN** the system shows the password field empty (or masked with no retrievable value) rather than the actual stored value
