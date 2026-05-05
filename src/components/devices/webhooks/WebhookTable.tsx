import { ActionIcon, Badge, Group, Stack, Switch, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WebhookHook } from '../../../types/shelly';

interface Props {
  hooks: WebhookHook[];
  onToggle: (id: number, enable: boolean) => void;
  onEdit: (hook: WebhookHook) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function WebhookTable({ hooks, onToggle, onEdit, onDelete, isUpdating }: Props) {
  const { t } = useTranslation('devices');

  if (hooks.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('webhooks.noWebhooks')}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('webhooks.enable')}</Table.Th>
            <Table.Th>{t('webhooks.event')}</Table.Th>
            <Table.Th>{t('webhooks.urls')}</Table.Th>
            <Table.Th style={{ width: 100 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {hooks.map((hook) => (
            <Table.Tr key={hook.id}>
              <Table.Td>
                <Switch
                  checked={hook.enable}
                  onChange={(e) => onToggle(hook.id, e.currentTarget.checked)}
                  disabled={isUpdating}
                  size="sm"
                />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {hook.name || hook.event}
                  </Text>
                  {hook.name && hook.name !== hook.event && (
                    <Text size="xs" c="dimmed">
                      {hook.event}
                    </Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  {(hook.urls ?? []).map((url) => (
                    <Badge key={url} size="xs" variant="light">
                      {url}
                    </Badge>
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => onEdit(hook)}
                    aria-label={t('webhooks.edit')}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => onDelete(hook.id)}
                    aria-label={t('webhooks.delete')}
                  >
                    <IconTrash size={14} />
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
