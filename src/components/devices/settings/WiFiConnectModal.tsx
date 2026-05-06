import {
  Button,
  Collapse,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWiFiSetConfig } from '../../../hooks/useDeviceSettings';

interface Props {
  deviceId: string;
  ssid: string;
  needsPassword: boolean;
  opened: boolean;
  onClose: () => void;
}

export function WiFiConnectModal({ deviceId, ssid, needsPassword, opened, onClose }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const mutation = useWiFiSetConfig(deviceId);

  const [password, setPassword] = useState('');
  const [useStaticIp, setUseStaticIp] = useState(false);
  const [ip, setIp] = useState('');
  const [netmask, setNetmask] = useState('');
  const [gateway, setGateway] = useState('');
  const [nameserver, setNameserver] = useState('');

  const handleConnect = () => {
    const staConfig: Parameters<typeof mutation.mutate>[0]['sta'] = {
      ssid,
      enable: true,
    };
    if (needsPassword) staConfig.pass = password || null;
    if (useStaticIp) {
      staConfig.ip = ip || null;
      staConfig.netmask = netmask || null;
      staConfig.gw = gateway || null;
      staConfig.nameserver = nameserver || null;
    }

    mutation.mutate({ sta: staConfig }, { onSuccess: onClose });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t('settings.wifi.connect')} — ${ssid}`}
      size="md"
    >
      <Stack gap="md">
        {needsPassword && (
          <PasswordInput
            label={t('settings.wifi.password')}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
        )}

        <Switch
          label={t('settings.wifi.staticIp')}
          checked={useStaticIp}
          onChange={(e) => setUseStaticIp(e.currentTarget.checked)}
        />

        <Collapse expanded={useStaticIp}>
          <Stack gap="xs">
            <TextInput
              label={t('settings.wifi.ip')}
              value={ip}
              onChange={(e) => setIp(e.currentTarget.value)}
            />
            <TextInput
              label={t('settings.wifi.netmask')}
              value={netmask}
              onChange={(e) => setNetmask(e.currentTarget.value)}
            />
            <TextInput
              label={t('settings.wifi.gateway')}
              value={gateway}
              onChange={(e) => setGateway(e.currentTarget.value)}
            />
            <TextInput
              label={t('settings.wifi.dns')}
              value={nameserver}
              onChange={(e) => setNameserver(e.currentTarget.value)}
            />
          </Stack>
        </Collapse>

        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          <Button variant="default" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button loading={mutation.isPending} onClick={handleConnect}>
            {t('settings.wifi.connect')}
          </Button>
        </SimpleGrid>
      </Stack>
    </Modal>
  );
}
