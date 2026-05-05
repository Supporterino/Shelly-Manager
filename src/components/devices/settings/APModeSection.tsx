import { Group, Loader, Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAPClients, useWiFiConfig } from '../../../hooks/useDeviceSettings';

interface Props {
  deviceId: string;
}

export function APModeSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { data: config, isLoading: configLoading } = useWiFiConfig(deviceId);
  const { data: clientsData, isLoading: clientsLoading } = useAPClients(deviceId);

  const isLoading = configLoading || clientsLoading;
  const clients = clientsData?.ap_clients ?? [];

  return (
    <Stack gap="md" mt="md">
      <Text fw={600}>{t('settings.ap.title')}</Text>

      {isLoading ? (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      ) : (
        <>
          <Text size="sm">
            {t('settings.ap.ssid')}: {config?.ap?.ssid ?? '—'}
          </Text>

          <Text size="sm" fw={500}>
            {t('settings.ap.clients')}
          </Text>

          {clients.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('settings.ap.noClients')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('settings.ap.clientMac')}</Table.Th>
                  <Table.Th>{t('settings.ap.clientIp')}</Table.Th>
                  <Table.Th>{t('settings.ap.connectedSince')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clients.map((client) => (
                  <Table.Tr key={client.mac}>
                    <Table.Td>
                      <Text size="sm" ff="mono">
                        {client.mac}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{client.ip}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(client.since * 1000).toLocaleString()}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </Stack>
  );
}
