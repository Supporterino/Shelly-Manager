import {
  Alert,
  Button,
  Collapse,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  ScrollArea,
  SegmentedControl,
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
import { useSwitchConfig, useSwitchSetConfig } from '../../../hooks/useDeviceControl';
import type { SwitchInMode, SwitchInitialState } from '../../../types/shelly';

interface Props {
  opened: boolean;
  onClose: () => void;
  deviceId: string;
  switchId: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt={4}>
      {children}
    </Text>
  );
}

export function SwitchConfigPanel({ opened, onClose, deviceId, switchId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading, isError } = useSwitchConfig(deviceId, switchId);
  const mutation = useSwitchSetConfig(deviceId, switchId);

  // ── local form state ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [inMode, setInMode] = useState<SwitchInMode>('detached');
  const [inLocked, setInLocked] = useState(false);
  const [initialState, setInitialState] = useState<SwitchInitialState>('restore_last');
  // timers
  const [autoOn, setAutoOn] = useState(false);
  const [autoOnDelay, setAutoOnDelay] = useState<number>(60);
  const [autoOff, setAutoOff] = useState(false);
  const [autoOffDelay, setAutoOffDelay] = useState<number>(60);
  // protection — undefined means not present on device
  const [powerLimit, setPowerLimit] = useState<number | null | undefined>(undefined);
  const [voltageLimit, setVoltageLimit] = useState<number | null | undefined>(undefined);
  const [undervoltageLimit, setUndervoltageLimit] = useState<number | null | undefined>(undefined);
  const [currentLimit, setCurrentLimit] = useState<number | null | undefined>(undefined);

  const [restartNeeded, setRestartNeeded] = useState(false);

  useEffect(() => {
    if (!config) return;
    setName(config.name ?? '');
    setInMode(config.in_mode);
    setInLocked(config.in_locked);
    setInitialState(config.initial_state);
    setAutoOn(config.auto_on);
    setAutoOnDelay(config.auto_on_delay);
    setAutoOff(config.auto_off);
    setAutoOffDelay(config.auto_off_delay);
    setPowerLimit('power_limit' in config ? config.power_limit ?? null : undefined);
    setVoltageLimit('voltage_limit' in config ? config.voltage_limit ?? null : undefined);
    setUndervoltageLimit(
      'undervoltage_limit' in config ? config.undervoltage_limit ?? null : undefined,
    );
    setCurrentLimit('current_limit' in config ? config.current_limit ?? null : undefined);
    setRestartNeeded(false);
  }, [config]);

  function handleSave() {
    const payload: Parameters<typeof mutation.mutate>[0] = {
      name: name || null,
      in_mode: inMode,
      in_locked: inLocked,
      initial_state: initialState,
      auto_on: autoOn,
      auto_on_delay: autoOnDelay,
      auto_off: autoOff,
      auto_off_delay: autoOffDelay,
    };

    if (powerLimit !== undefined) payload.power_limit = powerLimit;
    if (voltageLimit !== undefined) payload.voltage_limit = voltageLimit;
    if (undervoltageLimit !== undefined) payload.undervoltage_limit = undervoltageLimit;
    if (currentLimit !== undefined) payload.current_limit = currentLimit;

    mutation.mutate(payload, {
      onSuccess: (result) => {
        if (result.restart_required) {
          setRestartNeeded(true);
        } else {
          onClose();
        }
      },
    });
  }

  const hasProtection =
    powerLimit !== undefined ||
    voltageLimit !== undefined ||
    undervoltageLimit !== undefined ||
    currentLimit !== undefined;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('controls.switch.configTitle')}
      size="md"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {isLoading && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      )}

      {isError && <Alert color="red">{tc('errors.networkUnreachable')}</Alert>}

      {config && (
        <Stack gap="md" pb="md">
          {/* ── Channel name ─────────────────────────────────────────── */}
          <TextInput
            label={t('controls.switch.nameLabel')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <Divider />

          {/* ── Input → Output mode ──────────────────────────────────── */}
          <Stack gap={6}>
            <SectionLabel>{t('controls.switch.inMode')}</SectionLabel>
            <SegmentedControl
              fullWidth
              size="xs"
              value={inMode}
              onChange={(v) => setInMode(v as SwitchInMode)}
              data={[
                { value: 'momentary', label: t('controls.switch.inModes.momentary') },
                { value: 'follow', label: t('controls.switch.inModes.follow') },
                { value: 'flip', label: t('controls.switch.inModes.flip') },
                { value: 'detached', label: t('controls.switch.inModes.detached') },
                { value: 'activate', label: t('controls.switch.inModes.activate') },
              ]}
            />
          </Stack>

          {/* ── Lock + initial state ─────────────────────────────────── */}
          <Switch
            label={t('controls.switch.inLocked')}
            description={t('controls.switch.inLockedDesc')}
            checked={inLocked}
            onChange={(e) => setInLocked(e.currentTarget.checked)}
          />

          <Select
            label={t('controls.switch.initialState')}
            value={initialState}
            onChange={(v) => v && setInitialState(v as SwitchInitialState)}
            data={[
              { value: 'off', label: t('controls.switch.initialStates.off') },
              { value: 'on', label: t('controls.switch.initialStates.on') },
              { value: 'restore_last', label: t('controls.switch.initialStates.restore_last') },
              { value: 'match_input', label: t('controls.switch.initialStates.match_input') },
            ]}
          />

          <Divider />

          {/* ── Timers ───────────────────────────────────────────────── */}
          <Stack gap="sm">
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
          </Stack>

          {/* ── Protection limits (only if device exposes them) ───────── */}
          {hasProtection && (
            <>
              <Divider />
              <Stack gap="sm">
                <SectionLabel>{t('controls.switch.protection')}</SectionLabel>
                <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                  {powerLimit !== undefined && (
                    <NumberInput
                      label={t('controls.switch.powerLimit')}
                      min={0}
                      value={powerLimit ?? ''}
                      onChange={(v) => setPowerLimit(v === '' ? null : Number(v))}
                    />
                  )}
                  {currentLimit !== undefined && (
                    <NumberInput
                      label={t('controls.switch.currentLimit')}
                      min={0}
                      value={currentLimit ?? ''}
                      onChange={(v) => setCurrentLimit(v === '' ? null : Number(v))}
                    />
                  )}
                  {voltageLimit !== undefined && (
                    <NumberInput
                      label={t('controls.switch.voltageLimit')}
                      min={0}
                      value={voltageLimit ?? ''}
                      onChange={(v) => setVoltageLimit(v === '' ? null : Number(v))}
                    />
                  )}
                  {undervoltageLimit !== undefined && (
                    <NumberInput
                      label={t('controls.switch.undervoltageLimit')}
                      min={0}
                      value={undervoltageLimit ?? ''}
                      onChange={(v) => setUndervoltageLimit(v === '' ? null : Number(v))}
                    />
                  )}
                </SimpleGrid>
              </Stack>
            </>
          )}

          {/* ── Restart info alert ────────────────────────────────────── */}
          {restartNeeded && (
            <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
              {t('info.restartRequired')}
            </Alert>
          )}

          {/* ── Actions ───────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            <Button variant="default" fullWidth onClick={onClose}>
              {tc('actions.cancel')}
            </Button>
            <Button fullWidth loading={mutation.isPending} onClick={handleSave}>
              {tc('actions.save')}
            </Button>
          </SimpleGrid>
        </Stack>
      )}
    </Modal>
  );
}
