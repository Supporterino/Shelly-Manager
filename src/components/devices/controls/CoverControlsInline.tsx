import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useCoverControl } from '../../../hooks/useDeviceControl';

interface Props {
  deviceId: string;
  coverId: number;
}

export function CoverControlsInline({ deviceId, coverId }: Props) {
  const { t } = useTranslation('devices');
  const { open, close, stop } = useCoverControl(deviceId, coverId);

  return (
    <Group gap="xs">
      <Tooltip label={t('controls.open')}>
        <ActionIcon
          variant="light"
          color="green"
          size="lg"
          w={48}
          loading={open.isPending}
          onClick={() => open.mutate()}
        >
          <IconArrowUp size={18} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('controls.stop')}>
        <ActionIcon
          variant="light"
          color="red"
          size="lg"
          w={48}
          loading={stop.isPending}
          onClick={() => stop.mutate()}
        >
          <IconPlayerStop size={18} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('controls.close')}>
        <ActionIcon
          variant="light"
          color="blue"
          size="lg"
          w={48}
          loading={close.isPending}
          onClick={() => close.mutate()}
        >
          <IconArrowDown size={18} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
