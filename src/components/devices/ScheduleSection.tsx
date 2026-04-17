/**
 * Displays and manages schedules for a Shelly device.
 * Lists existing schedules with human-readable display, delete button,
 * and an inline AddScheduleForm for creating new ones.
 * Part of Phase 5.6
 */
import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ShellyClient } from '../../services/shellyClient'
import type { ScheduleJob } from '../../types/shelly'
import type { StoredDevice } from '../../types/device'
import { AddScheduleForm } from './AddScheduleForm'
import { ConfirmModal } from '../common/ConfirmModal'

/** Converts a Shelly cron timespec to a human-readable string.
 *  e.g. "0 0 22 * * 1,2,3" → "22:00 – Mon, Tue, Wed"
 */
function parseTimespec(timespec: string, locale: string): string {
  const parts = timespec.trim().split(/\s+/)
  // Shelly cron: sec min hour dom month dow
  if (parts.length < 6) return timespec

  const hour = parts[2]
  const min = parts[1]
  const dowPart = parts[5]

  const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`

  if (dowPart === '*') return time

  const dayNums = dowPart
    .split(',')
    .map(Number)
    .sort((a, b) => a - b)

  const dayLabels = dayNums.map((d) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      new Date(2025, 0, 5 + d) // Jan 5, 2025 = Sunday
    )
  )

  return `${time} – ${dayLabels.join(', ')}`
}

function describeCall(
  calls: ScheduleJob['calls'],
  t: TFunction<'devices'>
): string {
  const call = calls[0]
  if (!call) return ''
  const on = (call.params as { on?: boolean } | undefined)?.on
  if (call.method === 'Switch.Set') {
    return on ? t('controls.on') : t('controls.off')
  }
  return call.method
}

interface Props {
  device: StoredDevice
}

export function ScheduleSection({ device }: Props) {
  const { t, i18n } = useTranslation('devices')
  const { t: tc } = useTranslation('common')
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['device', device.id, 'schedules'],
    queryFn: () => new ShellyClient(device).scheduleList(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => new ShellyClient(device).scheduleDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] })
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setDeleteTarget(null),
  })

  const jobs: ScheduleJob[] = data?.jobs ?? []

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={600}>{t('schedule.title')}</Text>
        {!showForm && (
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
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text size="sm">{parseTimespec(job.timespec, i18n.language)}</Text>
              <Group gap="xs">
                <Badge size="xs" variant="light" color={job.enable ? 'green' : 'gray'}>
                  {describeCall(job.calls, t)}
                </Badge>
              </Group>
            </Stack>
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              aria-label={t('schedule.deleteSchedule')}
              onClick={() => setDeleteTarget(job.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </Stack>
      ))}

      {showForm && (
        <AddScheduleForm
          device={device}
          onAdded={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
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
    </Stack>
  )
}
