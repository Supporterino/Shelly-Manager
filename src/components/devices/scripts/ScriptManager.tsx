import { Button, Group, Loader, Stack, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useScriptCreate,
  useScriptDelete,
  useScriptEval,
  useScriptList,
  useScriptPutCode,
  useScriptStart,
  useScriptStop,
} from '../../../hooks/useDeviceAutomation';
import { ConfirmModal } from '../../common/ConfirmModal';
import { ErrorAlert } from '../../common/ErrorAlert';
import { CreateScriptModal } from './CreateScriptModal';
import { ScriptCodeModal } from './ScriptCodeModal';
import { ScriptEvalModal } from './ScriptEvalModal';
import { ScriptTable } from './ScriptTable';

interface Props {
  deviceId: string;
}

export function ScriptManager({ deviceId }: Props) {
  const { t } = useTranslation('devices');

  const { data, isLoading, error, refetch } = useScriptList(deviceId);
  const createMutation = useScriptCreate(deviceId);
  const deleteMutation = useScriptDelete(deviceId);
  const startMutation = useScriptStart(deviceId);
  const stopMutation = useScriptStop(deviceId);
  const putCodeMutation = useScriptPutCode(deviceId);
  const evalMutation = useScriptEval(deviceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [codeModalId, setCodeModalId] = useState<number | null>(null);
  const [evalModalId, setEvalModalId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const scripts = data?.scripts ?? [];

  const isUpdating =
    createMutation.isPending ||
    deleteMutation.isPending ||
    startMutation.isPending ||
    stopMutation.isPending;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>{t('scripts.title')}</Title>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={() => setCreateOpen(true)}
        >
          {t('scripts.create')}
        </Button>
      </Group>

      {isLoading && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      {error && <ErrorAlert message={(error as Error).message} onRetry={() => void refetch()} />}

      {!isLoading && !error && (
        <ScriptTable
          scripts={scripts}
          onStart={(id) => startMutation.mutate(id)}
          onStop={(id) => stopMutation.mutate(id)}
          onViewCode={setCodeModalId}
          onEval={setEvalModalId}
          onDelete={setDeleteTarget}
          isUpdating={isUpdating}
        />
      )}

      <CreateScriptModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name, code) =>
          createMutation.mutate(name, {
            onSuccess: (data) => {
              setCreateOpen(false);
              if (code && data?.id != null) {
                putCodeMutation.mutate({ id: data.id, code });
              }
            },
          })
        }
        isLoading={createMutation.isPending}
      />

      <ScriptCodeModal
        opened={codeModalId !== null}
        onClose={() => setCodeModalId(null)}
        onUpload={(code) =>
          codeModalId !== null &&
          putCodeMutation.mutate(
            { id: codeModalId, code },
            {
              onSuccess: () => setCodeModalId(null),
            },
          )
        }
        scriptId={codeModalId ?? -1}
        deviceId={deviceId}
        isUploading={putCodeMutation.isPending}
      />

      <ScriptEvalModal
        opened={evalModalId !== null}
        onClose={() => setEvalModalId(null)}
        onEval={(code) => evalModalId !== null && evalMutation.mutate({ id: evalModalId, code })}
        result={evalMutation.data}
        isLoading={evalMutation.isPending}
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
        title={t('scripts.deleteScript')}
        message={t('scripts.deleteConfirm')}
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </Stack>
  );
}
