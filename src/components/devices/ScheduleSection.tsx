/**
 * Displays and manages schedules for a Shelly device.
 * Lists existing schedules with human-readable display, edit inline, delete,
 * delete-all, and an inline ScheduleForm for creating new ones.
 * Part of Phase 3.4
 */

import { ActionIcon, Badge, Button, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellyClient } from '../../services/shellyClient';
import type { StoredDevice } from '../../types/device';
import type { ScheduleJob } from '../../types/shelly';
import { ConfirmModal } from '../common/ConfirmModal';
import { ScheduleForm } from './ScheduleForm';

/** Converts a Shelly cron timespec to a human-readable string.
 *  e.g. "0 0 22 * * 1,2,3" → "22:00 – Mon, Tue, Wed"
 */
function parseTimespec(timespec: string, locale: string): string {
  const parts = timespec.trim().split(/\s+/);
  // Shelly cron: sec min hour dom month dow
  if (parts.length < 6) return timespec;

  const hour = parts[2];
  const min = parts[1];
  const dowPart = parts[5];

  const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;

  if (dowPart === '*') return time;

  const dayNums = dowPart
    .split(',')
    .map(Number)
    .sort((a, b) => a - b);

  const dayLabels = dayNums.map((d) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      new Date(2025, 0, 5 + d), // Jan 5, 2025 = Sunday
    ),
  );

  return `${time} – ${dayLabels.join(', ')}`;
}

function describeCall(calls: ScheduleJob['calls'], t: TFunction<'devices'>): string {
  const call = calls[0];
  if (!call) return '';
  const on = (call.params as { on?: boolean } | undefined)?.on;
  if (call.method === 'Switch.Set') {
    return on ? t('controls.on') : t('controls.off');
  }
  return call.method;
}

interface Props {
  device: StoredDevice;
}

export function ScheduleSection({ device }: Props) {
  const { t, i18n } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState<ScheduleJob | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['device', device.id, 'schedules'],
    queryFn: () => new ShellyClient(device).scheduleList(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => new ShellyClient(device).scheduleDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setDeleteTarget(null),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => new ShellyClient(device).scheduleDeleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] });
      setDeleteAllOpen(false);
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });

  const jobs: ScheduleJob[] = data?.jobs ?? [];

  const handleEditDone = () => {
    setEditJob(null);
    setShowForm(false);
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={600}>{t('schedule.title')}</Text>
        <Group gap="xs">
          {jobs.length > 0 && (
            <Button size="xs" variant="subtle" color="red" onClick={() => setDeleteAllOpen(true)}>
              {t('schedule.deleteAll')}
            </Button>
          )}
          {!showForm && !editJob && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={() => setShowForm(true)}
            >
              {t('schedule.addSchedule')}
            </Button>
          )}
        </Group>
      </Group>

      {isLoading && <Loader size="xs" />}

      {isError && (
        <Text size="sm" c="red">
          {tc('status.error')}
        </Text>
      )}

      {!isLoading && !isError && jobs.length === 0 && !showForm && (
        <Text size="sm" c="dimmed">
          {t('schedule.noSchedules')}
        </Text>
      )}

      {jobs.map((job, idx) => (
        <Stack key={job.id} gap={4}>
          {idx > 0 && <Divider />}
          {editJob?.id === job.id ? (
            <ScheduleForm
              device={device}
              initialJob={job}
              onDone={handleEditDone}
              onCancel={() => setEditJob(null)}
            />
          ) : (
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2}>
                <Text size="sm">{parseTimespec(job.timespec, i18n.language)}</Text>
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={job.enable ? 'green' : 'gray'}>
                    {describeCall(job.calls, t)}
                  </Badge>
                </Group>
              </Stack>
              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  aria-label={t('schedule.editSchedule')}
                  onClick={() => setEditJob(job)}
                >
                  <IconPencil size={18} />
                </ActionIcon>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  size="md"
                  aria-label={t('schedule.deleteSchedule')}
                  onClick={() => setDeleteTarget(job.id)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Group>
          )}
        </Stack>
      ))}

      {showForm && (
        <ScheduleForm device={device} onDone={handleEditDone} onCancel={() => setShowForm(false)} />
      )}

      <ConfirmModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && deleteMutation.mutate(deleteTarget)}
        title={t('schedule.deleteSchedule')}
        message={t('schedule.confirmDelete')}
        confirmColor="red"
        loading={deleteMutation.isPending}
      />

      <ConfirmModal
        opened={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title={t('schedule.deleteAll')}
        message={t('schedule.deleteAllConfirm', { count: jobs.length })}
        confirmColor="red"
        loading={deleteAllMutation.isPending}
      />
    </Stack>
  );
}
