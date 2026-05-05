import {
  Alert,
  Button,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useDetectLocation,
  useListTimezones,
  useSetTime,
  useSysConfig,
  useSysSetConfig,
} from '../../../hooks/useDeviceSettings';
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
  const detectMutation = useDetectLocation(deviceId);
  const { data: tzData } = useListTimezones(deviceId);
  const setTimeMutation = useSetTime(deviceId);

  const [name, setName] = useState('');
  const [ecoMode, setEcoMode] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [timezone, setTimezone] = useState('');
  const [restartNeeded, setRestartNeeded] = useState(false);

  useEffect(() => {
    if (!config) return;
    setName(config.device.name ?? '');
    setEcoMode(config.eco_mode ?? false);
    setDiscoverable(device?.discoverable ?? true);
    setTimezone(config.location?.tz ?? '');
    setRestartNeeded(false);
  }, [config, device?.discoverable]);

  const handleSave = () => {
    const payload: Partial<{
      device: { name: string };
      eco_mode: boolean;
      location: { tz: string };
    }> = {};
    if (name !== (config?.device.name ?? '')) payload.device = { name };
    if (ecoMode !== (config?.eco_mode ?? false)) payload.eco_mode = ecoMode;
    if (timezone !== (config?.location?.tz ?? '')) {
      payload.location = { ...(config?.location ?? {}), tz: timezone };
    }

    sysMutation.mutate(payload, {
      onSuccess: () => {
        if (name !== (config?.device.name ?? '')) {
          updateDevice(deviceId, { name });
        }
        setRestartNeeded(true);
      },
    });
  };

  const handleDetectLocation = () => {
    detectMutation.mutate(undefined, {
      onSuccess: (data) => {
        setTimezone(data.tz);
      },
    });
  };

  const handleSyncTime = () => {
    setTimeMutation.mutate(new Date().toISOString());
  };

  const timezoneOptions =
    tzData?.timezones
      .filter((tz): tz is typeof tz & { name: string } => typeof tz.name === 'string')
      .map((tz) => ({
        value: tz.name,
        label: `${tz.name} (UTC${tz.offset >= 0 ? '+' : ''}${tz.offset})`,
      })) ?? [];

  const timezoneValue = timezoneOptions.some((o) => o.value === timezone) ? timezone : null;

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
        onChange={(e) => setName(e.currentTarget.value)}
      />

      <Switch
        label={t('settings.system.ecoMode')}
        checked={ecoMode}
        onChange={(e) => setEcoMode(e.currentTarget.checked)}
      />

      <Switch
        label={t('settings.system.discoverable')}
        checked={discoverable}
        onChange={(e) => {
          setDiscoverable(e.currentTarget.checked);
          updateDevice(deviceId, { discoverable: e.currentTarget.checked });
        }}
      />

      <Stack gap="xs">
        <Group justify="space-between" align="flex-end">
          <Select
            label={t('settings.system.timezone')}
            value={timezoneValue}
            onChange={(v) => v && setTimezone(v)}
            data={timezoneOptions}
            searchable
            style={{ flex: 1 }}
          />
          <Button
            size="sm"
            variant="light"
            onClick={handleDetectLocation}
            loading={detectMutation.isPending}
          >
            {t('settings.system.detectLocation')}
          </Button>
        </Group>
      </Stack>

      <Group justify="space-between" align="center">
        <Text size="sm">
          {t('settings.system.deviceTime')}: {new Date().toLocaleString()}
        </Text>
        <Button
          size="sm"
          variant="light"
          onClick={handleSyncTime}
          loading={setTimeMutation.isPending}
        >
          {t('settings.system.syncTime')}
        </Button>
      </Group>

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
