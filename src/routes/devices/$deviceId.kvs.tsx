import { ActionIcon, Group, ScrollArea, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { KVSEditor } from '../../components/devices/kvs/KVSEditor';
import { useDeviceStore } from '../../store/deviceStore';

export const Route = createFileRoute('/devices/$deviceId/kvs')({
  component: DeviceKVSPage,
});

function DeviceKVSPage() {
  const { deviceId } = Route.useParams();
  const { t: tc } = useTranslation('common');
  const device = useDeviceStore((s) => s.devices[deviceId]);

  if (!device) {
    return (
      <Stack p="md">
        <ErrorAlert message={`Device ${deviceId} not found`} />
      </Stack>
    );
  }

  return (
    <ScrollArea h="100%">
      <Stack gap="md" p="md">
        <Group gap="xs" align="center" wrap="nowrap">
          <Link to="/devices/$deviceId" params={{ deviceId }}>
            <ActionIcon variant="subtle" size="lg" aria-label={tc('actions.back')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Link>
          <Title order={3}>{device.name}</Title>
        </Group>

        <KVSEditor deviceId={deviceId} />
      </Stack>
    </ScrollArea>
  );
}
