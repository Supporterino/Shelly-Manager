import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InputConfigPanel } from './InputConfigPanel';

interface Props {
  deviceId: string;
  inputId: number;
}

export function InputConfigRow({ deviceId, inputId }: Props) {
  const { t } = useTranslation('devices');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {t('controls.input.configRowTitle', { n: inputId + 1 })}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {t('controls.input.configRowDesc')}
          </Text>
        </Stack>
        <Button size="xs" variant="light" flex="0 0 auto" onClick={() => setOpen(true)}>
          {t('controls.input.configure')}
        </Button>
      </Group>

      <InputConfigPanel
        opened={open}
        onClose={() => setOpen(false)}
        deviceId={deviceId}
        inputId={inputId}
      />
    </>
  );
}
