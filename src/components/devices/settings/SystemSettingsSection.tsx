import {
  Alert,
  Button,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSysConfig, useSysSetConfig } from '../../../hooks/useDeviceSettings';
import { useDeviceStore } from '../../../store/deviceStore';

interface Props {
  deviceId: string;
}

export function SystemSettingsSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const device = useDeviceStore((s) => s.devices[deviceId]);
  const updateDevice = useDeviceStore((s) => s.updateDevice);
  const { data: config, isLoading } = useSysConfig(deviceId);
  const sysMutation = useSysSetConfig(deviceId);

  const [name, setName] = useState('');
  const [ecoMode, setEcoMode] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [restartNeeded, setRestartNeeded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const hasEcoMode = config != null && 'eco_mode' in config;

  useEffect(() => {
    if (!config || isDirty) return;
    setName(config.device.name ?? '');
    setEcoMode(config.eco_mode ?? false);
    setDiscoverable(device?.discoverable ?? true);
    setRestartNeeded(false);
  }, [config, device?.discoverable, isDirty]);

  const handleSave = () => {
    const payload: Partial<{
      device: { name: string };
      eco_mode: boolean;
    }> = {};
    if (name !== (config?.device.name ?? '')) payload.device = { name };
    if (hasEcoMode && ecoMode !== (config?.eco_mode ?? false)) {
      payload.eco_mode = ecoMode;
    }

    sysMutation.mutate(payload, {
      onSuccess: () => {
        if (name !== (config?.device.name ?? '')) {
          updateDevice(deviceId, { name });
        }
        setRestartNeeded(true);
        setIsDirty(false);
      },
    });
  };

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={600}>{t('settings.system.title')}</Text>

      <TextInput
        label={t('settings.system.name')}
        value={name}
        onChange={(e) => {
          setName(e.currentTarget.value);
          setIsDirty(true);
        }}
      />

      {hasEcoMode && (
        <Switch
          label={t('settings.system.ecoMode')}
          checked={ecoMode}
          onChange={(e) => {
            setEcoMode(e.currentTarget.checked);
            setIsDirty(true);
          }}
        />
      )}

      <Switch
        label={t('settings.system.discoverable')}
        checked={discoverable}
        onChange={(e) => {
          setDiscoverable(e.currentTarget.checked);
          setIsDirty(true);
          updateDevice(deviceId, { discoverable: e.currentTarget.checked });
        }}
      />

      {restartNeeded && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
          {t('settings.system.restartRequired')}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        <Button variant="default" onClick={() => setRestartNeeded(false)}>
          {tc('actions.cancel')}
        </Button>
        <Button loading={sysMutation.isPending} onClick={handleSave}>
          {tc('actions.save')}
        </Button>
      </SimpleGrid>
    </Stack>
  );
}
