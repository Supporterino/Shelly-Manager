import { ActionIcon, Badge, Group, Table, Text } from '@mantine/core';
import { IconCode, IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ScriptEntry } from '../../../types/shelly';

interface Props {
  scripts: ScriptEntry[];
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onViewCode: (id: number) => void;
  onEval: (id: number) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function ScriptTable({
  scripts,
  onStart,
  onStop,
  onViewCode,
  onEval,
  onDelete,
  isUpdating,
}: Props) {
  const { t } = useTranslation('devices');

  if (scripts.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('scripts.noScripts')}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('scripts.name')}</Table.Th>
            <Table.Th>{t('scripts.status.label')}</Table.Th>
            <Table.Th>{t('scripts.memory')}</Table.Th>
            <Table.Th>{t('scripts.cpu')}</Table.Th>
            <Table.Th style={{ width: 160 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {scripts.map((script) => (
            <Table.Tr key={script.id}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {script.name}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge size="xs" color={script.running ? 'green' : 'gray'}>
                  {script.running ? t('scripts.status.running') : t('scripts.status.stopped')}
                </Badge>
              </Table.Td>
              <Table.Td>
                {script.mem_used != null && script.mem_size != null ? (
                  <Text size="xs">
                    {script.mem_used} / {script.mem_size}
                  </Text>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                {script.cpu_avg != null ? (
                  <Text size="xs">{script.cpu_avg.toFixed(1)}%</Text>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end">
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
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
