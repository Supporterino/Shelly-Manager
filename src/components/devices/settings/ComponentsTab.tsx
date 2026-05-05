import { Divider, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDeviceStore } from '../../../store/deviceStore';
import { CoverCalibrateRow } from '../controls/CoverCalibrateRow';
import { InputConfigRow } from '../controls/InputConfigRow';
import { SwitchConfigRow } from '../controls/SwitchConfigRow';
import { ScheduleSection } from '../ScheduleSection';

interface Props {
  deviceId: string;
}

export function ComponentsTab({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const device = useDeviceStore((s) => s.devices[deviceId]);

  if (!device) return null;

  const hasCovers = device.components.filter((c) => c.type === 'cover').length > 0;
  const hasInputs = device.components.filter((c) => c.type === 'input').length > 0;
  const hasSwitches = device.components.filter((c) => c.type === 'switch').length > 0;

  return (
    <Stack gap="md">
      {/* Schedules */}
      <ScheduleSection device={device} />

      {/* Cover setup */}
      {hasCovers && (
        <>
          <Divider />
          <Stack gap="xs">
            <Text fw={600}>{t('cover.setup')}</Text>
            {device.components
              .filter((c) => c.type === 'cover')
              .map((c) => (
                <CoverCalibrateRow key={c.id} deviceId={deviceId} coverId={c.id} />
              ))}
          </Stack>
        </>
      )}

      {/* Input setup */}
      {hasInputs && (
        <>
          <Divider />
          <Stack gap="xs">
            <Text fw={600}>{t('controls.input.setupTitle')}</Text>
            {device.components
              .filter((c) => c.type === 'input')
              .map((c) => (
                <InputConfigRow key={c.id} deviceId={deviceId} inputId={c.id} />
              ))}
          </Stack>
        </>
      )}

      {/* Output (switch) setup */}
      {hasSwitches && (
        <>
          <Divider />
          <Stack gap="xs">
            <Text fw={600}>{t('controls.switch.setupTitle')}</Text>
            {device.components
              .filter((c) => c.type === 'switch')
              .map((c) => (
                <SwitchConfigRow key={c.id} deviceId={deviceId} switchId={c.id} />
              ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
