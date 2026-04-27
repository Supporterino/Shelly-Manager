import {
  Alert,
  Button,
  Collapse,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInputConfig, useInputSetConfig } from '../../../hooks/useDeviceControl';
import type { InputType } from '../../../types/shelly';

interface Props {
  opened: boolean;
  onClose: () => void;
  deviceId: string;
  inputId: number;
}

// Consistent section header used throughout both config panels
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt={4}>
      {children}
    </Text>
  );
}

export function InputConfigPanel({ opened, onClose, deviceId, inputId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const { data: config, isLoading, isError } = useInputConfig(deviceId, inputId);
  const mutation = useInputSetConfig(deviceId, inputId);

  // ── local form state ──────────────────────────────────────────────────────
  const [type, setType] = useState<InputType>('switch');
  const [name, setName] = useState('');
  const [enable, setEnable] = useState(true);
  const [invert, setInvert] = useState(false);
  const [factoryReset, setFactoryReset] = useState(false);
  // analog
  const [reportThr, setReportThr] = useState<number>(1);
  const [rangeMin, setRangeMin] = useState<number>(0);
  const [rangeMax, setRangeMax] = useState<number>(100);
  const [xExpr, setXExpr] = useState('');
  const [xUnit, setXUnit] = useState('');
  // count
  const [countRepThr, setCountRepThr] = useState<number>(1);
  const [freqWindow, setFreqWindow] = useState<number>(60);
  const [freqRepThr, setFreqRepThr] = useState<number>(0);

  const [restartNeeded, setRestartNeeded] = useState(false);

  useEffect(() => {
    if (!config) return;
    setType(config.type);
    setName(config.name ?? '');
    setEnable(config.enable);
    setInvert(config.invert ?? false);
    setFactoryReset(config.factory_reset ?? false);
    setReportThr(config.report_thr ?? 1);
    setRangeMin(config.range_map?.[0] ?? 0);
    setRangeMax(config.range_map?.[1] ?? 100);
    setXExpr(config.xpercent?.expr ?? '');
    setXUnit(config.xpercent?.unit ?? '');
    setCountRepThr(config.count_rep_thr ?? 1);
    setFreqWindow(config.freq_window ?? 60);
    setFreqRepThr(config.freq_rep_thr ?? 0);
    setRestartNeeded(false);
  }, [config]);

  function handleSave() {
    const shared = { name: name || null, enable };

    const typeSpecific =
      type === 'switch' || type === 'button'
        ? { invert, factory_reset: factoryReset }
        : type === 'analog'
          ? {
              invert,
              report_thr: reportThr,
              range_map: [rangeMin, rangeMax] as [number, number],
              xpercent: { expr: xExpr || null, unit: xUnit || null },
            }
          : {
              count_rep_thr: countRepThr,
              freq_window: freqWindow,
              freq_rep_thr: freqRepThr,
            };

    mutation.mutate(
      { type, ...shared, ...typeSpecific },
      {
        onSuccess: (result) => {
          if (result.restart_required) {
            setRestartNeeded(true);
          } else {
            onClose();
          }
        },
      },
    );
  }

  const isSwitchOrButton = type === 'switch' || type === 'button';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('controls.input.configTitle')}
      size="md"
      scrollAreaComponent={Modal.NativeScrollArea}
    >
      {isLoading && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      )}

      {isError && <Alert color="red">{tc('errors.networkUnreachable')}</Alert>}

      {config && (
        <Stack gap="md" pb="md">
          {/* ── Mode selector ─────────────────────────────────────────── */}
          <Stack gap={6}>
            <SectionLabel>{t('controls.input.mode')}</SectionLabel>
            <SegmentedControl
              fullWidth
              size="xs"
              value={type}
              onChange={(v) => setType(v as InputType)}
              data={[
                { value: 'switch', label: t('controls.input.typeSwitch') },
                { value: 'button', label: t('controls.input.typeButton') },
                { value: 'analog', label: t('controls.input.typeAnalog') },
                { value: 'count', label: t('controls.input.typeCount') },
              ]}
            />
          </Stack>

          <Divider />

          {/* ── Shared fields ─────────────────────────────────────────── */}
          <TextInput
            label={t('controls.input.nameLabel')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Switch
            label={t('controls.input.enable')}
            checked={enable}
            onChange={(e) => setEnable(e.currentTarget.checked)}
          />

          {/* ── Switch + Button fields ────────────────────────────────── */}
          <Collapse in={isSwitchOrButton}>
            <Stack gap="sm">
              <Switch
                label={t('controls.input.invert')}
                checked={invert}
                onChange={(e) => setInvert(e.currentTarget.checked)}
              />
              <Switch
                label={t('controls.input.factoryReset')}
                checked={factoryReset}
                onChange={(e) => setFactoryReset(e.currentTarget.checked)}
              />
            </Stack>
          </Collapse>

          {/* ── Analog fields ─────────────────────────────────────────── */}
          <Collapse in={type === 'analog'}>
            <Stack gap="sm">
              <Switch
                label={t('controls.input.invert')}
                checked={invert}
                onChange={(e) => setInvert(e.currentTarget.checked)}
              />
              <NumberInput
                label={t('controls.input.reportThreshold')}
                min={1}
                max={50}
                decimalScale={1}
                value={reportThr}
                onChange={(v) => setReportThr(Number(v))}
              />
              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                <NumberInput
                  label={t('controls.input.rangeMin')}
                  value={rangeMin}
                  onChange={(v) => setRangeMin(Number(v))}
                />
                <NumberInput
                  label={t('controls.input.rangeMax')}
                  value={rangeMax}
                  onChange={(v) => setRangeMax(Number(v))}
                />
              </SimpleGrid>
              <TextInput
                label={t('controls.input.transformExpr')}
                placeholder="x * 0.1"
                value={xExpr}
                onChange={(e) => setXExpr(e.currentTarget.value)}
              />
              <TextInput
                label={t('controls.input.transformUnit')}
                placeholder="m/s"
                value={xUnit}
                onChange={(e) => setXUnit(e.currentTarget.value)}
              />
            </Stack>
          </Collapse>

          {/* ── Count fields ──────────────────────────────────────────── */}
          <Collapse in={type === 'count'}>
            <Stack gap="sm">
              <NumberInput
                label={t('controls.input.freqWindow')}
                min={1}
                max={3600}
                value={freqWindow}
                onChange={(v) => setFreqWindow(Number(v))}
              />
              <NumberInput
                label={t('controls.input.countRepThreshold')}
                min={1}
                value={countRepThr}
                onChange={(v) => setCountRepThr(Number(v))}
              />
              <NumberInput
                label={t('controls.input.freqRepThreshold')}
                min={0}
                max={10000}
                value={freqRepThr}
                onChange={(v) => setFreqRepThr(Number(v))}
              />
            </Stack>
          </Collapse>

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
