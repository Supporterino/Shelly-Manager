import { Button, Group, Loader, Stack, TextInput, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKVSDelete, useKVSGet, useKVSList, useKVSSet } from '../../../hooks/useDeviceAutomation';
import type { KVSKey } from '../../../types/shelly';
import { ConfirmModal } from '../../common/ConfirmModal';
import { ErrorAlert } from '../../common/ErrorAlert';
import { KVSKeyTable } from './KVSKeyTable';
import { KVSModal } from './KVSModal';

interface Props {
  deviceId: string;
}

export function KVSEditor({ deviceId }: Props) {
  const { t } = useTranslation('devices');

  const { data, isLoading, error, refetch } = useKVSList(deviceId);
  const setMutation = useKVSSet(deviceId);
  const deleteMutation = useKVSDelete(deviceId);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: editData } = useKVSGet(deviceId, editKey ?? '');

  const items = data?.items ?? [];
  const filtered = search.trim()
    ? items.filter((item) => item.key.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleEdit = (item: KVSKey) => {
    setEditKey(item.key);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditKey(null);
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>{t('kvs.title')}</Title>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={handleCreate}
        >
          {t('kvs.addKey')}
        </Button>
      </Group>

      <TextInput
        placeholder={t('kvs.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        size="sm"
      />

      {isLoading && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      {error && <ErrorAlert message={(error as Error).message} onRetry={() => void refetch()} />}

      {!isLoading && !error && (
        <KVSKeyTable items={filtered} onEdit={handleEdit} onDelete={setDeleteTarget} />
      )}

      <KVSModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditKey(null);
        }}
        onSubmit={(key, value, etag) =>
          setMutation.mutate(
            { key, value, etag },
            {
              onSuccess: () => {
                setModalOpen(false);
                setEditKey(null);
              },
            },
          )
        }
        onDelete={(key) =>
          deleteMutation.mutate(key, {
            onSuccess: () => {
              setModalOpen(false);
              setEditKey(null);
            },
          })
        }
        initialData={editKey && editData ? editData : undefined}
        isLoading={setMutation.isPending || deleteMutation.isPending}
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
        title={t('kvs.deleteKey')}
        message={t('kvs.deleteConfirm', { key: deleteTarget ?? '' })}
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </Stack>
  );
}
