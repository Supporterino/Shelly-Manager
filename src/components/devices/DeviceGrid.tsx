import { SimpleGrid } from '@mantine/core';
import type { StoredDevice } from '../../types/device';
import { DeviceCard } from './DeviceCard';

interface Props {
  devices: StoredDevice[];
  locale: string;
}

export function DeviceGrid({ devices, locale }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', sm: 'md' }}>
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} locale={locale} />
      ))}
    </SimpleGrid>
  );
}
