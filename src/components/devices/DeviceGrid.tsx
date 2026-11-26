import { SimpleGrid } from '@mantine/core';
import type { StoredDevice } from '../../types/device';
import { DeviceCard } from './DeviceCard';

interface Props {
  devices: StoredDevice[];
  locale: string;
  /** Optional tile rendered before the devices, e.g. the weather card. */
  leading?: React.ReactNode;
}

export function DeviceGrid({ devices, locale, leading }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', sm: 'md' }}>
      {leading}
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} locale={locale} />
      ))}
    </SimpleGrid>
  );
}
