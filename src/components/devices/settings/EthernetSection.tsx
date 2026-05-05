import {
  Button,
  Collapse,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEthConfig, useEthSetConfig, useEthStatus } from '../../../hooks/useDeviceSettings';

interface Props {
  deviceId: string;
}

export function EthernetSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading: configLoading } = useEthConfig(deviceId);
  const { data: status, isLoading: statusLoading } = useEthStatus(deviceId);
  const mutation = useEthSetConfig(deviceId);

  const [enable, setEnable] = useState(false);
  const [ipv4mode, setIpv4mode] = useState<'dhcp' | 'static'>('dhcp');
  const [ip, setIp] = useState('');
  const [netmask, setNetmask] = useState('');
  const [gateway, setGateway] = useState('');
  const [nameserver, setNameserver] = useState('');

  useEffect(() => {
    if (!config) return;
    setEnable(config.enable);
    setIpv4mode(config.ipv4mode);
    setIp(config.ip ?? '');
    setNetmask(config.netmask ?? '');
    setGateway(config.gw ?? '');
    setNameserver(config.nameserver ?? '');
  }, [config]);

  const handleSave = () => {
    const payload: Parameters<typeof mutation.mutate>[0] = {
      enable,
      ipv4mode,
    };
    if (ipv4mode === 'static') {
      payload.ip = ip || null;
      payload.netmask = netmask || null;
      payload.gw = gateway || null;
      payload.nameserver = nameserver || null;
    }
    mutation.mutate(payload);
  };

  if (configLoading || statusLoading) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <Stack gap="md" mt="md">
      <Text fw={600}>{t('settings.ethernet.title')}</Text>

      {status?.ip && (
        <Text size="sm" c="dimmed">
          IP: {status.ip}
        </Text>
      )}

      <Switch
        label={t('settings.ethernet.enable')}
        checked={enable}
        onChange={(e) => setEnable(e.currentTarget.checked)}
      />

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {t('settings.ethernet.mode')}
        </Text>
        <SegmentedControl
          fullWidth
          size="sm"
          value={ipv4mode}
          onChange={(v) => setIpv4mode(v as 'dhcp' | 'static')}
          data={[
            { value: 'dhcp', label: 'DHCP' },
            { value: 'static', label: t('settings.wifi.staticIp') },
          ]}
        />
      </Stack>

      <Collapse expanded={ipv4mode === 'static'}>
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
        <Button variant="default">{tc('actions.cancel')}</Button>
        <Button loading={mutation.isPending} onClick={handleSave}>
          {tc('actions.save')}
        </Button>
      </SimpleGrid>
    </Stack>
  );
}
