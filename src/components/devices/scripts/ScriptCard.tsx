import { ActionIcon, Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconCode, IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ScriptEntry } from '../../../types/shelly';

interface Props {
  script: ScriptEntry;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onViewCode: (id: number) => void;
  onEval: (id: number) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function ScriptCard({
  script,
  onStart,
  onStop,
  onViewCode,
  onEval,
  onDelete,
  isUpdating,
}: Props) {
  const { t } = useTranslation('devices');

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
            {script.name}
          </Text>
          <Badge size="xs" color={script.running ? 'green' : 'gray'}>
            {script.running ? t('scripts.status.running') : t('scripts.status.stopped')}
          </Badge>
        </Group>

        <Group gap="xs">
          {script.mem_used != null && script.mem_size != null ? (
            <Text size="xs" c="dimmed">
              {script.mem_used} / {script.mem_size} bytes
            </Text>
          ) : (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )}
          {script.cpu_avg != null && (
            <Text size="xs" c="dimmed">
              {script.cpu_avg.toFixed(1)}% CPU
            </Text>
          )}
        </Group>

        <Group gap="xs" justify="flex-end">
          {script.running ? (
            <ActionIcon
              variant="subtle"
              size="md"
              color="orange"
              onClick={() => onStop(script.id)}
              disabled={isUpdating}
              aria-label={t('scripts.stop')}
            >
              <IconPlayerStop size={18} />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="subtle"
              size="md"
              color="green"
              onClick={() => onStart(script.id)}
              disabled={isUpdating}
              aria-label={t('scripts.start')}
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            size="md"
            onClick={() => onViewCode(script.id)}
            aria-label={t('scripts.viewCode')}
          >
            <IconCode size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="md"
            onClick={() => onEval(script.id)}
            aria-label={t('scripts.eval')}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>JS</span>
          </ActionIcon>
          <ActionIcon
            color="red"
            variant="subtle"
            size="md"
            onClick={() => onDelete(script.id)}
            aria-label={t('scripts.deleteScript')}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}
