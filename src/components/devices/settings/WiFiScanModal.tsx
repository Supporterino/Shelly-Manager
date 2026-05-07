import { Button, Group, Loader, Modal, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconLock, IconWifi } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWiFiScan } from '../../../hooks/useDeviceSettings';
import { WiFiConnectModal } from './WiFiConnectModal';

interface Props {
  deviceId: string;
  opened: boolean;
  onClose: () => void;
}

const authLabels: Record<number, string> = {
  0: 'Open',
  1: 'WEP',
  2: 'WPA',
  3: 'WPA2',
  4: 'WPA/WPA2',
  5: 'WPA3',
};

export function WiFiScanModal({ deviceId, opened, onClose }: Props) {
  const { t } = useTranslation('devices');
  const { data: results, isFetching, error, refetch } = useWiFiScan(deviceId);
  const [selectedNetwork, setSelectedNetwork] = useState<{ ssid: string; auth: number } | null>(
    null,
  );

  useEffect(() => {
    if (opened) {
      void refetch();
    }
  }, [opened, refetch]);

  useEffect(() => {
    if (!opened) {
      setSelectedNetwork(null);
    }
  }, [opened]);

  const rows = results?.map((net) => (
    <Table.Tr key={net.bssid}>
      <Table.Td>
        <Group gap="xs">
          <IconWifi size={16} />
          <Text size="sm">{net.ssid}</Text>
          {net.auth > 0 && <IconLock size={14} />}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{net.rssi} dBm</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{authLabels[net.auth] ?? 'Unknown'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{net.channel}</Text>
      </Table.Td>
      <Table.Td>
        <Button
          size="xs"
          variant="light"
          onClick={() => setSelectedNetwork({ ssid: net.ssid, auth: net.auth })}
        >
          {t('settings.wifi.connect')}
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('settings.wifi.scan')}
        size="100%"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {isFetching && !results && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                {t('settings.wifi.scanning')}
              </Text>
            </Group>
          )}

          {error && (
            <Text size="sm" c="red">
              {(error as Error).message}
            </Text>
          )}

          {results && results.length > 0 && (
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>SSID</Table.Th>
                    <Table.Th>Signal</Table.Th>
                    <Table.Th>Security</Table.Th>
                    <Table.Th>Channel</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}

          {results && results.length === 0 && !isFetching && (
            <Text size="sm" c="dimmed">
              No networks found.
            </Text>
          )}
        </Stack>
      </Modal>

      {selectedNetwork && (
        <WiFiConnectModal
          deviceId={deviceId}
          ssid={selectedNetwork.ssid}
          needsPassword={selectedNetwork.auth > 0}
          opened={!!selectedNetwork}
          onClose={() => setSelectedNetwork(null)}
        />
      )}
    </>
  );
}
