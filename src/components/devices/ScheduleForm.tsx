/**
 * Reusable schedule form for create and edit.
 * Visual timespec picker with hour/minute selects and day chips.
 */

import { Button, Chip, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellyClient } from '../../services/shellyClient';
import type { StoredDevice } from '../../types/device';
import type { ScheduleJob } from '../../types/shelly';

/** Shelly cron dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat */
function getWeekdayLabel(dow: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 5 + dow));
}

function buildTimespec(hour: number, minute: number, days: string[]): string {
  const h = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, minute));
  const dow = days.length === 7 ? '*' : [...days].sort((a, b) => +a - +b).join(',');
  return `0 ${m} ${h} * * ${dow}`;
}

function parseTimespec(timespec: string): { hour: number; minute: number; days: string[] } {
  const parts = timespec.trim().split(/\s+/);
  if (parts.length < 6) return { hour: 22, minute: 0, days: ['1', '2', '3', '4', '5'] };
  const hour = Math.max(0, Math.min(23, parseInt(parts[2], 10) || 0));
  const minute = Math.max(0, Math.min(59, parseInt(parts[1], 10) || 0));
  const dowPart = parts[5];
  const days = dowPart === '*' ? ['0', '1', '2', '3', '4', '5', '6'] : dowPart.split(',');
  return { hour, minute, days };
}

interface Props {
  device: StoredDevice;
  initialJob?: ScheduleJob;
  onDone: () => void;
  onCancel: () => void;
}

export function ScheduleForm({ device, initialJob, onDone, onCancel }: Props) {
  const { t, i18n } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();
  const isEdit = !!initialJob;

  const parsed = initialJob ? parseTimespec(initialJob.timespec) : null;
  const [hour, setHour] = useState<number>(parsed?.hour ?? 22);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [days, setDays] = useState<string[]>(parsed?.days ?? ['1', '2', '3', '4', '5']);
  const [action, setAction] = useState<string>(
    (initialJob?.calls[0]?.params as { on?: boolean } | undefined)?.on === false ? 'off' : 'on',
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const timespec = buildTimespec(hour, minute, days);
      return new ShellyClient(device).scheduleCreate({
        enable: true,
        timespec,
        calls: [
          {
            method: 'Switch.Set',
            params: { id: 0, on: action === 'on' },
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] });
      onDone();
    },
    onError: (err: Error) => notifications.show({ color: 'red', message: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!initialJob) throw new Error('No job to update');
      const timespec = buildTimespec(hour, minute, days);
      return new ShellyClient(device).scheduleUpdate(initialJob.id, {
        timespec,
        calls: [
          {
            method: 'Switch.Set',
            params: { id: 0, on: action === 'on' },
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] });
      onDone();
    },
    onError: (err: Error) => notifications.show({ color: 'red', message: err.message }),
  });

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, '0'),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, '0'),
  }));
  const actionOptions = [
    { value: 'on', label: t('controls.on') },
    { value: 'off', label: t('controls.off') },
  ];

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <Stack
      gap="xs"
      p="xs"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--mantine-color-default)',
      }}
    >
      <Group grow gap="xs">
        <Select
          data={actionOptions}
          value={action}
          onChange={(v) => v && setAction(v)}
          label={t('schedule.action')}
          size="xs"
        />
      </Group>

      <Group grow gap="xs">
        <Select
          data={hourOptions}
          value={String(hour)}
          onChange={(v) => v && setHour(Number(v))}
          label={t('schedule.hour')}
          size="xs"
        />
        <Select
          data={minuteOptions}
          value={String(minute)}
          onChange={(v) => v && setMinute(Number(v))}
          label={t('schedule.minute')}
          size="xs"
        />
      </Group>

      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {t('schedule.days')}
        </Text>
        <Chip.Group multiple value={days} onChange={setDays}>
          <Group gap={4}>
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
              <Chip key={dow} value={String(dow)} size="sm">
                {getWeekdayLabel(dow, i18n.language)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      <Group gap="xs" justify="flex-end">
        <Button variant="subtle" size="sm" onClick={onCancel}>
          {tc('actions.cancel')}
        </Button>
        <Button
          size="sm"
          color="blue"
          loading={loading}
          onClick={() => (isEdit ? updateMutation.mutate() : createMutation.mutate())}
          disabled={days.length === 0}
        >
          {isEdit ? tc('actions.save') : t('schedule.addSchedule')}
        </Button>
      </Group>
    </Stack>
  );
}
