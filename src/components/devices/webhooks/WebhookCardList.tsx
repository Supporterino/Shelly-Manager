import { Stack } from '@mantine/core';
import type { WebhookHook } from '../../../types/shelly';
import { WebhookCard } from './WebhookCard';

interface Props {
  hooks: WebhookHook[];
  onToggle: (id: number, enable: boolean) => void;
  onEdit: (hook: WebhookHook) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function WebhookCardList({ hooks, onToggle, onEdit, onDelete, isUpdating }: Props) {
  return (
    <Stack gap="sm">
      {hooks.map((hook) => (
        <WebhookCard
          key={hook.id}
          hook={hook}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          isUpdating={isUpdating}
        />
      ))}
    </Stack>
  );
}
