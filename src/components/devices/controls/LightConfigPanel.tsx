import {
  Button,
  Collapse,
  Divider,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLightConfig, useLightSetConfig } from '../../../hooks/useDeviceControl';
import type { LightConfig } from '../../../types/shelly';

interface Props {
  deviceId: string;
  lightId: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt={4}>
      {children}
    </Text>
  );
}

export function LightConfigPanel({ deviceId, lightId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading } = useLightConfig(deviceId, lightId);
  const mutation = useLightSetConfig(deviceId, lightId);

  const [name, setName] = useState('');
  const [initialState, setInitialState] = useState<LightConfig['initial_state']>('restore_last');
  const [autoOn, setAutoOn] = useState(false);
  const [autoOnDelay, setAutoOnDelay] = useState(60);
  const [autoOff, setAutoOff] = useState(false);
  const [autoOffDelay, setAutoOffDelay] = useState(60);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [minBrightness, setMinBrightness] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [nightBrightness, setNightBrightness] = useState(0);

  useEffect(() => {
    if (!config) return;
    setName(config.name ?? '');
    setInitialState(config.initial_state);
    setAutoOn(config.auto_on);
    setAutoOnDelay(config.auto_on_delay);
    setAutoOff(config.auto_off);
    setAutoOffDelay(config.auto_off_delay);
    setTransitionDuration(config.transition_duration);
    setMinBrightness(config.min_brightness_on_toggle);
    setNightMode(config.night_mode?.enable ?? false);
    setNightBrightness(config.night_mode?.brightness ?? 0);
  }, [config]);

  function handleSave() {
    const payload: Partial<Omit<LightConfig, 'id'>> = {
      name: name || null,
      initial_state: initialState,
      auto_on: autoOn,
      auto_on_delay: autoOnDelay,
      auto_off: autoOff,
      auto_off_delay: autoOffDelay,
      transition_duration: transitionDuration,
      min_brightness_on_toggle: minBrightness,
    };
    if (nightMode || config?.night_mode) {
      payload.night_mode = {
        enable: nightMode,
        brightness: nightBrightness,
      };
    }
    mutation.mutate(payload);
  }

  if (isLoading || !config) {
    return (
      <Text size="sm" c="dimmed">
        {tc('status.loading')}
      </Text>
    );
  }

  return (
    <Stack gap="md" pb="md">
      <TextInput
        label={t('controls.switch.nameLabel')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />

      <Divider />

      <Select
        label={t('controls.switch.initialState')}
        value={initialState}
        onChange={(v) => v && setInitialState(v as LightConfig['initial_state'])}
        data={[
          { value: 'off', label: t('controls.switch.initialStates.off') },
          { value: 'on', label: t('controls.switch.initialStates.on') },
          { value: 'restore_last', label: t('controls.switch.initialStates.restore_last') },
          { value: 'match_input', label: t('controls.switch.initialStates.match_input') },
        ]}
      />

      <Divider />

      <SectionLabel>{t('controls.switch.timers')}</SectionLabel>
      <Switch
        label={t('controls.switch.autoOn')}
        checked={autoOn}
        onChange={(e) => setAutoOn(e.currentTarget.checked)}
      />
      <Collapse expanded={autoOn}>
        <NumberInput
          label={t('controls.switch.autoOnDelay')}
          min={0}
          value={autoOnDelay}
          onChange={(v) => setAutoOnDelay(Number(v))}
        />
      </Collapse>
      <Switch
        label={t('controls.switch.autoOff')}
        checked={autoOff}
        onChange={(e) => setAutoOff(e.currentTarget.checked)}
      />
      <Collapse expanded={autoOff}>
        <NumberInput
          label={t('controls.switch.autoOffDelay')}
          min={0}
          value={autoOffDelay}
          onChange={(v) => setAutoOffDelay(Number(v))}
        />
      </Collapse>

      <Divider />

      <SectionLabel>{t('config.light.advanced')}</SectionLabel>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        <NumberInput
          label={t('config.light.transitionDuration')}
          min={0}
          value={transitionDuration}
          onChange={(v) => setTransitionDuration(Number(v))}
        />
        <NumberInput
          label={t('config.light.minBrightness')}
          min={0}
          max={100}
          value={minBrightness}
          onChange={(v) => setMinBrightness(Number(v))}
        />
      </SimpleGrid>

      <Switch
        label={t('config.light.nightMode')}
        checked={nightMode}
        onChange={(e) => setNightMode(e.currentTarget.checked)}
      />
      <Collapse expanded={nightMode}>
        <NumberInput
          label={t('config.light.nightBrightness')}
          min={0}
          max={100}
          value={nightBrightness}
          onChange={(v) => setNightBrightness(Number(v))}
        />
      </Collapse>

      <Divider />

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={() => window.location.reload()}>
          {tc('actions.cancel')}
        </Button>
        <Button loading={mutation.isPending} onClick={handleSave}>
          {tc('actions.save')}
        </Button>
      </Group>
    </Stack>
  );
}
