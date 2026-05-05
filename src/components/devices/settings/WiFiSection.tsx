import { Button, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { IconRefresh, IconWifi } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWiFiConfig, useWiFiStatus } from '../../../hooks/useDeviceSettings';
import { WiFiScanModal } from './WiFiScanModal';

interface Props {
  deviceId: string;
}

export function WiFiSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { data: config, isLoading: configLoading } = useWiFiConfig(deviceId);
  const { data: status, isLoading: statusLoading } = useWiFiStatus(deviceId);
  const [scanOpen, setScanOpen] = useState(false);

  const isLoading = configLoading || statusLoading;

  return (
    <Stack gap="md">
      <Text fw={600}>{t('settings.wifi.title')}</Text>

      {isLoading ? (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      ) : (
        <>
          <Card withBorder>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <IconWifi size={20} />
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {status?.ssid
                      ? t('settings.wifi.connectedTo', { ssid: status.ssid })
                      : t('settings.wifi.notConnected')}
                  </Text>
                  {status?.ip && (
                    <Text size="xs" c="dimmed">
                      IP: {status.ip}
                      {status.rssi != null && ` · ${status.rssi} dBm`}
                    </Text>
                  )}
                </Stack>
              </Group>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={() => setScanOpen(true)}
              >
                {t('settings.wifi.scan')}
              </Button>
            </Group>
          </Card>

          {config?.sta1?.enable && (
            <Card withBorder>
              <Text size="sm" fw={500}>
                {t('settings.wifi.sta1')}
              </Text>
              <Text size="xs" c="dimmed">
                SSID: {config.sta1.ssid ?? '—'}
              </Text>
            </Card>
          )}
        </>
      )}

      <WiFiScanModal deviceId={deviceId} opened={scanOpen} onClose={() => setScanOpen(false)} />
    </Stack>
  );
}
