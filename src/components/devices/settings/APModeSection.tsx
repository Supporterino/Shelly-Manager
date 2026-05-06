import {
  Button,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPClients, useWiFiConfig, useWiFiSetConfig } from '../../../hooks/useDeviceSettings';

interface Props {
  deviceId: string;
}

export function APModeSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading: configLoading } = useWiFiConfig(deviceId);
  const { data: clientsData, isLoading: clientsLoading } = useAPClients(deviceId);
  const setConfigMutation = useWiFiSetConfig(deviceId);
  const [opened, { open, close }] = useDisclosure(false);

  const isLoading = configLoading || clientsLoading;
  const clients = clientsData?.ap_clients ?? [];

  const [apEnabled, setApEnabled] = useState(false);
  const [apSsid, setApSsid] = useState('');
  const [apPass, setApPass] = useState('');

  useEffect(() => {
    if (!config) return;
    setApEnabled(config.ap?.enable ?? false);
    setApSsid(config.ap?.ssid ?? '');
    setApPass(config.ap?.pass ?? '');
  }, [config]);

  const handleSave = () => {
    setConfigMutation.mutate(
      {
        ap: {
          enable: apEnabled,
          ssid: apSsid || null,
          pass: apPass || null,
        },
      },
      {
        onSuccess: () => close(),
      },
    );
  };

  return (
    <Stack gap="md" mt="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>{t('settings.ap.title')}</Text>
        <Button size="xs" variant="light" leftSection={<IconPencil size={14} />} onClick={open}>
          {tc('actions.edit')}
        </Button>
      </Group>

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

      <Modal opened={opened} onClose={close} title={t('settings.ap.editTitle')}>
        <Stack gap="md">
          <Switch
            label={t('settings.ap.enable')}
            checked={apEnabled}
            onChange={(e) => setApEnabled(e.currentTarget.checked)}
          />
          <TextInput
            label={t('settings.ap.ssid')}
            value={apSsid}
            onChange={(e) => setApSsid(e.currentTarget.value)}
            disabled={!apEnabled}
          />
          <PasswordInput
            label={t('settings.ap.password')}
            value={apPass}
            onChange={(e) => setApPass(e.currentTarget.value)}
            disabled={!apEnabled}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={close}>
              {tc('actions.cancel')}
            </Button>
            <Button loading={setConfigMutation.isPending} onClick={handleSave}>
              {tc('actions.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
