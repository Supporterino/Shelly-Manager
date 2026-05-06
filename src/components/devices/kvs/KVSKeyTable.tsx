import { ActionIcon, Group, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { KVSKey } from '../../../types/shelly';

interface Props {
  items: KVSKey[];
  onEdit: (item: KVSKey) => void;
  onDelete: (key: string) => void;
}

export function KVSKeyTable({ items, onEdit, onDelete }: Props) {
  const { t } = useTranslation('devices');

  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('kvs.noKeys')}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={400}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('kvs.key')}</Table.Th>
            <Table.Th>{t('kvs.etag')}</Table.Th>
            <Table.Th style={{ width: 100 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => (
            <Table.Tr key={item.key}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {item.key}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" truncate maw={200}>
                  {item.etag}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end">
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
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
