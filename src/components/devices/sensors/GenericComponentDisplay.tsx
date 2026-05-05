import { Card, Code, Group, Stack, Text } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface Props {
  deviceId: string;
  componentId: number;
  status: unknown;
  componentType: string;
}

export function GenericComponentDisplay({ componentId, status, componentType }: Props) {
  const { t } = useTranslation('devices');
  const s = status as Record<string, unknown> | undefined;

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs">
          <IconBox size={18} />
          <Text fw={500} size="sm">
            {componentType} #{componentId + 1}
          </Text>
        </Group>

        {s ? (
          <Code block>{JSON.stringify(s, null, 2)}</Code>
        ) : (
          <Text size="sm" c="dimmed">
            {t('sensors.noData')}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
