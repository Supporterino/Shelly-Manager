import { ActionIcon, Badge, Card, Group, Stack, Switch, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WebhookHook } from '../../../types/shelly';

interface Props {
  hook: WebhookHook;
  onToggle: (id: number, enable: boolean) => void;
  onEdit: (hook: WebhookHook) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function WebhookCard({ hook, onToggle, onEdit, onDelete, isUpdating }: Props) {
  const { t } = useTranslation('devices');

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" fw={500} lineClamp={1}>
              {hook.name || hook.event}
            </Text>
            {hook.name && hook.name !== hook.event && (
              <Text size="xs" c="dimmed">
                {hook.event}
              </Text>
            )}
          </Stack>
          <Group gap={4} style={{ flexShrink: 0 }}>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={() => onEdit(hook)}
              aria-label={t('webhooks.edit')}
            >
              <IconPencil size={18} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="subtle"
              size="md"
              onClick={() => onDelete(hook.id)}
              aria-label={t('webhooks.delete')}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group gap={4} wrap="wrap">
          {(hook.urls ?? []).map((url) => (
            <Badge key={url} size="xs" variant="light">
              {url}
            </Badge>
          ))}
        </Group>

        <Switch
          checked={hook.enable}
          onChange={(e) => onToggle(hook.id, e.currentTarget.checked)}
          disabled={isUpdating}
          size="md"
          label={t('webhooks.enable')}
        />
      </Stack>
    </Card>
  );
}
