import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellyClient } from '../../../services/shellyClient';
import { useDeviceStore } from '../../../store/deviceStore';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  deviceId: string;
}

export function DangerZoneSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const device = useDeviceStore((s) => s.devices[deviceId]);
  const removeDevice = useDeviceStore((s) => s.removeDevice);

  const [rebootConfirm, setRebootConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);

  const rebootMutation = useMutation({
    mutationFn: () => {
      if (!device) throw new Error('Device not found');
      return new ShellyClient(device).reboot();
    },
    onSuccess: () => notifications.show({ color: 'green', message: t('dangerZone.rebootSuccess') }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setRebootConfirm(false),
  });

  const factoryResetMutation = useMutation({
    mutationFn: () => {
      if (!device) throw new Error('Device not found');
      return new ShellyClient(device).factoryReset();
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setResetConfirm(false),
  });

  return (
    <Stack gap="md">
      {/* Danger zone */}
      <Stack gap="xs">
        <Text fw={600} c="red">
          {t('dangerZone.title')}
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
          <Button
            color="yellow"
            variant="light"
            size="sm"
            fullWidth
            onClick={() => setRebootConfirm(true)}
          >
            {t('dangerZone.reboot')}
          </Button>
          <Button
            color="red"
            variant="light"
            size="sm"
            fullWidth
            onClick={() => setResetConfirm(true)}
          >
            {t('dangerZone.factoryReset')}
          </Button>
          <Button
            color="red"
            variant="subtle"
            size="sm"
            fullWidth
            onClick={() => setRemoveConfirm(true)}
          >
            {tc('actions.delete')}
          </Button>
        </SimpleGrid>
      </Stack>

      {/* Modals */}
      <ConfirmModal
        opened={rebootConfirm}
        onClose={() => setRebootConfirm(false)}
        onConfirm={() => rebootMutation.mutate()}
        title={t('dangerZone.reboot')}
        message={t('dangerZone.rebooting')}
        confirmColor="yellow"
        loading={rebootMutation.isPending}
      />
      <ConfirmModal
        opened={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={() => factoryResetMutation.mutate()}
        title={t('dangerZone.factoryReset')}
        message={t('dangerZone.factoryResetConfirm')}
        confirmColor="red"
        loading={factoryResetMutation.isPending}
      />
      <ConfirmModal
        opened={removeConfirm}
        onClose={() => setRemoveConfirm(false)}
        onConfirm={() => {
          removeDevice(deviceId);
          setRemoveConfirm(false);
        }}
        title={tc('actions.delete')}
        message={`Remove ${device?.name ?? deviceId} from ShellMan?`}
        confirmColor="red"
      />
    </Stack>
  );
}
