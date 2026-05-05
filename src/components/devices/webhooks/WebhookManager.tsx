import { Button, Group, Loader, Stack, Title } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useWebhookCreate,
  useWebhookDelete,
  useWebhookDeleteAll,
  useWebhookList,
  useWebhookSupportedEvents,
  useWebhookUpdate,
} from '../../../hooks/useDeviceAutomation';
import type { WebhookHook } from '../../../types/shelly';
import { ConfirmModal } from '../../common/ConfirmModal';
import { ErrorAlert } from '../../common/ErrorAlert';
import { CreateWebhookModal } from './CreateWebhookModal';
import { EditWebhookModal } from './EditWebhookModal';
import { WebhookTable } from './WebhookTable';

interface Props {
  deviceId: string;
}

export function WebhookManager({ deviceId }: Props) {
  const { t } = useTranslation('devices');

  const { data, isLoading, error, refetch } = useWebhookList(deviceId);
  const { data: eventsData } = useWebhookSupportedEvents(deviceId);
  const createMutation = useWebhookCreate(deviceId);
  const updateMutation = useWebhookUpdate(deviceId);
  const deleteMutation = useWebhookDelete(deviceId);
  const deleteAllMutation = useWebhookDeleteAll(deviceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editHook, setEditHook] = useState<WebhookHook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const hooks = data?.hooks ?? [];
  const eventOptions =
    eventsData?.events.map((e) => ({
      value: e.event,
      label: e.name || e.event,
    })) ?? [];

  const isUpdating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>{t('webhooks.title')}</Title>
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('webhooks.create')}
          </Button>
          {hooks.length > 0 && (
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => setDeleteAllOpen(true)}
            >
              {t('webhooks.deleteAll')}
            </Button>
          )}
        </Group>
      </Group>

      {isLoading && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      {error && <ErrorAlert message={(error as Error).message} onRetry={() => void refetch()} />}

      {!isLoading && !error && (
        <WebhookTable
          hooks={hooks}
          onToggle={(id, enable) => updateMutation.mutate({ id, config: { enable } })}
          onEdit={setEditHook}
          onDelete={setDeleteTarget}
          isUpdating={isUpdating}
        />
      )}

      <CreateWebhookModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(config) =>
          createMutation.mutate(config, {
            onSuccess: () => setCreateOpen(false),
          })
        }
        events={eventOptions}
        isLoading={createMutation.isPending}
      />

      <EditWebhookModal
        opened={editHook !== null}
        onClose={() => setEditHook(null)}
        onSubmit={(id, config) =>
          updateMutation.mutate(
            { id, config },
            {
              onSuccess: () => setEditHook(null),
            },
          )
        }
        hook={editHook}
        events={eventOptions}
        isLoading={updateMutation.isPending}
      />

      <ConfirmModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget !== null &&
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        title={t('webhooks.delete')}
        message={t('webhooks.deleteConfirm')}
        confirmColor="red"
        loading={deleteMutation.isPending}
      />

      <ConfirmModal
        opened={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={() =>
          deleteAllMutation.mutate(undefined, {
            onSuccess: () => setDeleteAllOpen(false),
          })
        }
        title={t('webhooks.deleteAll')}
        message={t('webhooks.deleteAllConfirm', { count: hooks.length })}
        confirmColor="red"
        loading={deleteAllMutation.isPending}
      />
    </Stack>
  );
}
