import { Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCoverCalibrate } from '../../../hooks/useDeviceControl';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  deviceId: string;
  coverId: number;
}

export function CoverCalibrateRow({ deviceId, coverId }: Props) {
  const { t } = useTranslation('devices');
  const [confirm, setConfirm] = useState(false);
  const mutation = useCoverCalibrate(deviceId, coverId);

  const handleConfirm = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: t('cover.calibrateSuccess') });
        setConfirm(false);
      },
      onSettled: () => setConfirm(false),
    });
  };

  return (
    <>
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {t('cover.calibrate')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('cover.calibrateDescription')}
          </Text>
        </Stack>
        <Button
          size="xs"
          variant="light"
          color="violet"
          loading={mutation.isPending}
          onClick={() => setConfirm(true)}
        >
          {t('cover.calibrate')}
        </Button>
      </Group>
      <ConfirmModal
        opened={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={handleConfirm}
        title={t('cover.calibrate')}
        message={t('cover.calibrateConfirm')}
        confirmColor="violet"
        loading={mutation.isPending}
      />
    </>
  );
}
