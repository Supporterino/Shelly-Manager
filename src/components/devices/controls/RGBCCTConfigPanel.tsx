import {
  Button,
  Collapse,
  ColorPicker,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRgbccctConfig, useRgbccctSetConfig } from '../../../hooks/useDeviceControl';
import type { RGBCCTConfig } from '../../../types/shelly';

interface Props {
  deviceId: string;
  rgbccctId: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt={4}>
      {children}
    </Text>
  );
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function RgbccctConfigPanel({ deviceId, rgbccctId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading } = useRgbccctConfig(deviceId, rgbccctId);
  const mutation = useRgbccctSetConfig(deviceId, rgbccctId);

  const [name, setName] = useState('');
  const [initialState, setInitialState] = useState<RGBCCTConfig['initial_state']>('restore_last');
  const [autoOn, setAutoOn] = useState(false);
  const [autoOnDelay, setAutoOnDelay] = useState(60);
  const [autoOff, setAutoOff] = useState(false);
  const [autoOffDelay, setAutoOffDelay] = useState(60);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [defaultBrightness, setDefaultBrightness] = useState(100);
  const [defaultColor, setDefaultColor] = useState('#ffffff');
  const [defaultWhite, setDefaultWhite] = useState(0);
  const [defaultTemp, setDefaultTemp] = useState(4000);
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
    setDefaultBrightness(config.default.brightness);
    setDefaultColor(rgbToHex(config.default.rgb));
    setDefaultWhite(config.default.white);
    setDefaultTemp(config.default.temp);
    setNightMode(config.night_mode?.enable ?? false);
    setNightBrightness(config.night_mode?.brightness ?? 0);
  }, [config]);

  function handleSave() {
    const payload: Partial<Omit<RGBCCTConfig, 'id'>> = {
      name: name || null,
      initial_state: initialState,
      auto_on: autoOn,
      auto_on_delay: autoOnDelay,
      auto_off: autoOff,
      auto_off_delay: autoOffDelay,
      transition_duration: transitionDuration,
      default: {
        brightness: defaultBrightness,
        rgb: hexToRgb(defaultColor),
        white: defaultWhite,
        temp: defaultTemp,
      },
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
        onChange={(v) => v && setInitialState(v as RGBCCTConfig['initial_state'])}
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

      <SectionLabel>{t('config.rgb.defaults')}</SectionLabel>
      <NumberInput
        label={t('config.rgb.defaultBrightness')}
        min={0}
        max={100}
        value={defaultBrightness}
        onChange={(v) => setDefaultBrightness(Number(v))}
      />
      <NumberInput
        label={t('config.rgbw.defaultWhite')}
        min={0}
        max={100}
        value={defaultWhite}
        onChange={(v) => setDefaultWhite(Number(v))}
      />
      <NumberInput
        label={t('controls.colorTemperature')}
        min={2700}
        max={6500}
        value={defaultTemp}
        onChange={(v) => setDefaultTemp(Number(v))}
      />
      <ColorPicker
        format="hex"
        value={defaultColor}
        onChange={setDefaultColor}
        size="sm"
        fullWidth
        swatches={[
          '#ff0000',
          '#ff8000',
          '#ffff00',
          '#00ff00',
          '#00ffff',
          '#0000ff',
          '#8000ff',
          '#ff00ff',
          '#ffffff',
        ]}
      />

      <NumberInput
        label={t('config.light.transitionDuration')}
        min={0}
        value={transitionDuration}
        onChange={(v) => setTransitionDuration(Number(v))}
      />

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
