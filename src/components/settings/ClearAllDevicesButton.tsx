import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeviceStore } from '../../store/deviceStore';
import { ConfirmModal } from '../common/ConfirmModal';

export function ClearAllDevicesButton() {
  const { t } = useTranslation('settings');
  const [opened, setOpened] = useState(false);
  const devices = useDeviceStore((s) => s.devices);
  const clearAllDevices = useDeviceStore((s) => s.clearAllDevices);
  const count = Object.keys(devices).length;

  const handleConfirm = () => {
    clearAllDevices();
    setOpened(false);
    notifications.show({
      color: 'orange',
      message: t('devices.clearAll'),
    });
  };

  return (
    <>
      <Button
        color="red"
        variant="light"
        leftSection={<IconTrash size={16} stroke={1.5} />}
        onClick={() => setOpened(true)}
        disabled={count === 0}
      >
        {t('devices.clearAll')}
      </Button>

      <ConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        onConfirm={handleConfirm}
        title={t('devices.clearAllConfirmTitle')}
        message={t('devices.clearAllConfirmMessage', { count })}
        confirmColor="red"
      />
    </>
  );
}
