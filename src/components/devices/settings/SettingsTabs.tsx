import { Tabs } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useListProfiles } from '../../../hooks/useDeviceSettings';
import { useDeviceStatus } from '../../../hooks/useDeviceStatus';
import { useDeviceStore } from '../../../store/deviceStore';
import type { StoredDevice } from '../../../types/device';
import { APModeSection } from './APModeSection';
import { AuthManagementSection } from './AuthManagementSection';
import { ComponentsTab } from './ComponentsTab';
import { DangerZoneSection } from './DangerZoneSection';
import { DeviceProfileSection } from './DeviceProfileSection';
import { EthernetSection } from './EthernetSection';
import { FirmwareSection } from './FirmwareSection';
import { IntegrationStatusSection } from './IntegrationStatusSection';
import { MethodDiscoverySection } from './MethodDiscoverySection';
import { SystemSettingsSection } from './SystemSettingsSection';
import { WiFiSection } from './WiFiSection';

interface Props {
  deviceId: string;
}

export function SettingsTabs({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const device = useDeviceStore(
    (s: { devices: Record<string, StoredDevice> }) => s.devices[deviceId],
  );
  const { data: status } = useDeviceStatus(
    device ?? {
      id: deviceId,
      ip: '',
      port: 80,
      name: '',
      model: '',
      app: '',
      generation: 'gen2',
      type: 'unknown',
      components: [],
      addedAt: 0,
      lastSeenAt: 0,
    },
  );
  const { data: profileData } = useListProfiles(deviceId);

  const hasEth = status != null && 'eth:0' in status;
  const hasMultipleProfiles = (profileData?.profiles.length ?? 0) > 1;
  const currentVersion =
    ((status?.sys as Record<string, unknown> | undefined)?.fw_id as string | undefined) ??
    device?.model;

  return (
    <Tabs defaultValue="general" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="general">{t('settings.tabs.general')}</Tabs.Tab>
        <Tabs.Tab value="network">{t('settings.tabs.network')}</Tabs.Tab>
        {hasMultipleProfiles && <Tabs.Tab value="profile">{t('settings.tabs.profile')}</Tabs.Tab>}
        <Tabs.Tab value="components">{t('settings.tabs.components')}</Tabs.Tab>
        <Tabs.Tab value="firmware">{t('settings.tabs.firmware')}</Tabs.Tab>
        <Tabs.Tab value="integrations">{t('settings.tabs.integrations')}</Tabs.Tab>
        <Tabs.Tab value="auth">{t('settings.tabs.auth')}</Tabs.Tab>
        <Tabs.Tab value="methods">{t('settings.tabs.methods')}</Tabs.Tab>
        <Tabs.Tab value="advanced">{t('settings.tabs.advanced')}</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general" pt="md">
        <SystemSettingsSection deviceId={deviceId} />
      </Tabs.Panel>

      <Tabs.Panel value="network" pt="md">
        <WiFiSection deviceId={deviceId} />
        {hasEth && <EthernetSection deviceId={deviceId} />}
        <APModeSection deviceId={deviceId} />
      </Tabs.Panel>

      {hasMultipleProfiles && (
        <Tabs.Panel value="profile" pt="md">
          <DeviceProfileSection deviceId={deviceId} />
        </Tabs.Panel>
      )}

      <Tabs.Panel value="components" pt="md">
        <ComponentsTab deviceId={deviceId} />
      </Tabs.Panel>

      <Tabs.Panel value="firmware" pt="md">
        {device && <FirmwareSection device={device} currentVersion={currentVersion} />}
      </Tabs.Panel>

      <Tabs.Panel value="integrations" pt="md">
        <IntegrationStatusSection status={status} />
      </Tabs.Panel>

      <Tabs.Panel value="auth" pt="md">
        <AuthManagementSection deviceId={deviceId} />
      </Tabs.Panel>

      <Tabs.Panel value="methods" pt="md">
        <MethodDiscoverySection deviceId={deviceId} />
      </Tabs.Panel>

      <Tabs.Panel value="advanced" pt="md">
        <DangerZoneSection deviceId={deviceId} />
      </Tabs.Panel>
    </Tabs>
  );
}
