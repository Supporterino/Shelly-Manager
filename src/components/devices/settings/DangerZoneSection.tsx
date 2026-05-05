import { Button, Divider, PasswordInput, SimpleGrid, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const updateDevice = useDeviceStore((s) => s.updateDevice);
  const removeDevice = useDeviceStore((s) => s.removeDevice);
  const queryClient = useQueryClient();

  const [rebootConfirm, setRebootConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
      {/* Auth */}
      <Stack gap="xs">
        <Text fw={600}>{tc('status.error').replace('Error', 'Authentication')}</Text>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPasswordError(null);
            if (password !== confirmPassword) {
              setPasswordError('Passwords do not match');
              return;
            }
            try {
              await queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
              updateDevice(deviceId, {
                auth: { username: 'admin', password },
              });
              notifications.show({ color: 'green', message: tc('actions.save') });
              setPassword('');
              setConfirmPassword('');
            } catch (err) {
              notifications.show({ color: 'red', message: (err as Error).message });
            }
          }}
        >
          <Stack gap="xs">
            <PasswordInput
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <PasswordInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              error={passwordError}
            />
            <Button type="submit" size="sm">
              {tc('actions.save')}
            </Button>
          </Stack>
        </form>
      </Stack>

      <Divider />

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
