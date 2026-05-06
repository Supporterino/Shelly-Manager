import { ActionIcon, Card, Group, Stack, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { KVSKey } from '../../../types/shelly';

interface Props {
  item: KVSKey;
  onEdit: (item: KVSKey) => void;
  onDelete: (key: string) => void;
}

export function KVSCard({ item, onEdit, onDelete }: Props) {
  const { t } = useTranslation('devices');

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
            {item.key}
          </Text>
          <Group gap={4} style={{ flexShrink: 0 }}>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={() => onEdit(item)}
              aria-label={t('kvs.editKey')}
            >
              <IconPencil size={18} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="subtle"
              size="md"
              onClick={() => onDelete(item.key)}
              aria-label={t('kvs.deleteKey')}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>
        <Text size="xs" c="dimmed" truncate maw={260}>
          etag: {item.etag}
        </Text>
      </Stack>
    </Card>
  );
}
