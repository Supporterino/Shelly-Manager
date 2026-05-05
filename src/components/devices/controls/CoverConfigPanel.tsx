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
import { useCoverConfig, useCoverSetConfig } from '../../../hooks/useDeviceControl';
import type { CoverConfig } from '../../../types/shelly';

interface Props {
  deviceId: string;
  coverId: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt={4}>
      {children}
    </Text>
  );
}

export function CoverConfigPanel({ deviceId, coverId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading } = useCoverConfig(deviceId, coverId);
  const mutation = useCoverSetConfig(deviceId, coverId);

  const [name, setName] = useState('');
  const [maxtimeOpen, setMaxtimeOpen] = useState(0);
  const [maxtimeClose, setMaxtimeClose] = useState(0);
  const [initialState, setInitialState] = useState<CoverConfig['initial_state']>('stopped');
  const [invertDirections, setInvertDirections] = useState(false);
  const [inMode, setInMode] = useState<CoverConfig['in_mode']>('one_button');
  const [swapInputs, setSwapInputs] = useState(false);
  const [obstacleDetection, setObstacleDetection] = useState(false);
  const [obstacleAction, setObstacleAction] = useState<CoverConfig['obstacle_action']>('stop');
  const [obstaclePower, setObstaclePower] = useState(0);
  const [obstacleDelay, setObstacleDelay] = useState(0);
  const [safetySwitch, setSafetySwitch] = useState(false);
  const [safetyAction, setSafetyAction] = useState<CoverConfig['safety_action']>('stop');
  const [safetyAllowedDp, setSafetyAllowedDp] = useState(0);

  useEffect(() => {
    if (!config) return;
    setName(config.name ?? '');
    setMaxtimeOpen(config.maxtime_open);
    setMaxtimeClose(config.maxtime_close);
    setInitialState(config.initial_state);
    setInvertDirections(config.invert_directions);
    setInMode(config.in_mode);
    setSwapInputs(config.swap_inputs);
    setObstacleDetection(config.obstacle_detection);
    setObstacleAction(config.obstacle_action);
    setObstaclePower(config.obstacle_power);
    setObstacleDelay(config.obstacle_delay);
    setSafetySwitch(config.safety_switch);
    setSafetyAction(config.safety_action);
    setSafetyAllowedDp(config.safety_allowed_dp);
  }, [config]);

  function handleSave() {
    mutation.mutate({
      name: name || null,
      maxtime_open: maxtimeOpen,
      maxtime_close: maxtimeClose,
      initial_state: initialState,
      invert_directions: invertDirections,
      in_mode: inMode,
      swap_inputs: swapInputs,
      obstacle_detection: obstacleDetection,
      obstacle_action: obstacleAction,
      obstacle_power: obstaclePower,
      obstacle_delay: obstacleDelay,
      safety_switch: safetySwitch,
      safety_action: safetyAction,
      safety_allowed_dp: safetyAllowedDp,
    });
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

      <SectionLabel>{t('config.cover.movement')}</SectionLabel>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        <NumberInput
          label={t('config.cover.maxtimeOpen')}
          min={0}
          value={maxtimeOpen}
          onChange={(v) => setMaxtimeOpen(Number(v))}
        />
        <NumberInput
          label={t('config.cover.maxtimeClose')}
          min={0}
          value={maxtimeClose}
          onChange={(v) => setMaxtimeClose(Number(v))}
        />
      </SimpleGrid>

      <Select
        label={t('config.cover.initialState')}
        value={initialState}
        onChange={(v) => v && setInitialState(v as CoverConfig['initial_state'])}
        data={[
          { value: 'open', label: t('controls.state.open') },
          { value: 'closed', label: t('controls.state.closed') },
          { value: 'stopped', label: t('controls.state.stopped') },
        ]}
      />

      <Switch
        label={t('config.cover.invertDirections')}
        checked={invertDirections}
        onChange={(e) => setInvertDirections(e.currentTarget.checked)}
      />

      <Divider />

      <SectionLabel>{t('config.cover.inputMapping')}</SectionLabel>
      <Select
        label={t('config.cover.inMode')}
        value={inMode}
        onChange={(v) => v && setInMode(v as CoverConfig['in_mode'])}
        data={[
          { value: 'one_button', label: t('config.cover.inModes.oneButton') },
          { value: 'two_button', label: t('config.cover.inModes.twoButton') },
          { value: 'detached', label: t('controls.switch.inModes.detached') },
        ]}
      />
      <Switch
        label={t('config.cover.swapInputs')}
        checked={swapInputs}
        onChange={(e) => setSwapInputs(e.currentTarget.checked)}
      />

      <Divider />

      <SectionLabel>{t('config.cover.obstacleDetection')}</SectionLabel>
      <Switch
        label={t('config.cover.obstacleDetectionEnable')}
        checked={obstacleDetection}
        onChange={(e) => setObstacleDetection(e.currentTarget.checked)}
      />
      <Collapse expanded={obstacleDetection}>
        <Stack gap="sm">
          <Select
            label={t('config.cover.obstacleAction')}
            value={obstacleAction}
            onChange={(v) => v && setObstacleAction(v as CoverConfig['obstacle_action'])}
            data={[
              { value: 'stop', label: t('controls.stop') },
              { value: 'reverse', label: t('config.cover.reverse') },
            ]}
          />
          <NumberInput
            label={t('config.cover.obstaclePower')}
            min={0}
            value={obstaclePower}
            onChange={(v) => setObstaclePower(Number(v))}
          />
          <NumberInput
            label={t('config.cover.obstacleDelay')}
            min={0}
            value={obstacleDelay}
            onChange={(v) => setObstacleDelay(Number(v))}
          />
        </Stack>
      </Collapse>

      <Divider />

      <SectionLabel>{t('config.cover.safetySwitch')}</SectionLabel>
      <Switch
        label={t('config.cover.safetySwitchEnable')}
        checked={safetySwitch}
        onChange={(e) => setSafetySwitch(e.currentTarget.checked)}
      />
      <Collapse expanded={safetySwitch}>
        <Stack gap="sm">
          <Select
            label={t('config.cover.safetyAction')}
            value={safetyAction}
            onChange={(v) => v && setSafetyAction(v as CoverConfig['safety_action'])}
            data={[
              { value: 'stop', label: t('controls.stop') },
              { value: 'reverse', label: t('config.cover.reverse') },
              { value: 'open', label: t('controls.open') },
            ]}
          />
          <NumberInput
            label={t('config.cover.safetyAllowedDp')}
            min={0}
            max={100}
            value={safetyAllowedDp}
            onChange={(v) => setSafetyAllowedDp(Number(v))}
          />
        </Stack>
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
