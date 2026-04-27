import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SwitchConfigPanel } from './SwitchConfigPanel';

interface Props {
  deviceId: string;
  switchId: number;
}

export function SwitchConfigRow({ deviceId, switchId }: Props) {
  const { t } = useTranslation('devices');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {t('controls.switch.configRowTitle', { n: switchId + 1 })}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {t('controls.switch.configRowDesc')}
          </Text>
        </Stack>
        <Button size="xs" variant="light" flex="0 0 auto" onClick={() => setOpen(true)}>
          {t('controls.switch.configure')}
        </Button>
      </Group>

      <SwitchConfigPanel
        opened={open}
        onClose={() => setOpen(false)}
        deviceId={deviceId}
        switchId={switchId}
      />
    </>
  );
}
