import { Stack, Text } from '@mantine/core';
import type { StoredDevice } from '../../../types/device';
import { FirmwareCard } from '../info/FirmwareCard';

interface Props {
  device: StoredDevice;
  currentVersion?: string;
}

export function FirmwareSection({ device, currentVersion }: Props) {
  return (
    <Stack gap="xs">
      <Text fw={600}>Firmware</Text>
      <FirmwareCard device={device} currentVersion={currentVersion} />
    </Stack>
  );
}
