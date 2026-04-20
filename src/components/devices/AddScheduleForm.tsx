/**
 * Form for adding a new Shelly device schedule.
 * Supports Switch.Set actions on switch components.
 * Part of Phase 5.6
 */

import { Button, Chip, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellyClient } from '../../services/shellyClient';
import type { StoredDevice } from '../../types/device';

/** Shelly cron dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat */
function getWeekdayLabel(dow: number, locale: string): string {
  // Jan 5, 2025 was a Sunday → offset by dow gives each weekday
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 5 + dow));
}

function buildTimespec(hour: string, minute: string, days: string[]): string {
  const h = Math.max(0, Math.min(23, parseInt(hour, 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(minute, 10) || 0));
  const dow = days.length === 7 ? '*' : [...days].sort((a, b) => +a - +b).join(',');
  return `0 ${m} ${h} * * ${dow}`;
}

interface Props {
  device: StoredDevice;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddScheduleForm({ device, onAdded, onCancel }: Props) {
  const { t, i18n } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();

  const switchComponents = device.components.filter((c) => c.type === 'switch');
  const [selectedSwitch, setSelectedSwitch] = useState<string>(
    switchComponents[0] ? String(switchComponents[0].id) : '0',
  );
  const [action, setAction] = useState<string>('on');
  const [timeValue, setTimeValue] = useState('22:00');
  const [days, setDays] = useState<string[]>(['1', '2', '3', '4', '5']);

  const mutation = useMutation({
    mutationFn: () => {
      const [hStr, mStr] = timeValue.split(':');
      const timespec = buildTimespec(hStr ?? '22', mStr ?? '00', days);
      return new ShellyClient(device).scheduleCreate({
        enable: true,
        timespec,
        calls: [
          {
            method: 'Switch.Set',
            params: { id: parseInt(selectedSwitch, 10), on: action === 'on' },
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id, 'schedules'] });
      onAdded();
    },
    onError: (err: Error) => notifications.show({ color: 'red', message: err.message }),
  });

  const switchOptions = switchComponents.map((c) => ({
    value: String(c.id),
    label: c.name ?? t('controls.channel', { n: c.id + 1 }),
  }));

  const actionOptions = [
    { value: 'on', label: t('controls.on') },
    { value: 'off', label: t('controls.off') },
  ];

  return (
    <Stack
      gap="xs"
      p="xs"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--mantine-color-default)',
      }}
    >
      {switchComponents.length > 1 && (
        <Select
          data={switchOptions}
          value={selectedSwitch}
          onChange={(v) => v && setSelectedSwitch(v)}
          label={t('info.channelName')}
          size="xs"
        />
      )}

      <Group grow gap="xs">
        <Select
          data={actionOptions}
          value={action}
          onChange={(v) => v && setAction(v)}
          label={t('schedule.action')}
          size="xs"
        />
        <TextInput
          label={t('schedule.time')}
          value={timeValue}
          onChange={(e) => setTimeValue(e.currentTarget.value)}
          placeholder="22:00"
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
              <Chip key={dow} value={String(dow)} size="xs">
                {getWeekdayLabel(dow, i18n.language)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      <Group gap="xs" justify="flex-end">
        <Button variant="subtle" size="xs" onClick={onCancel}>
          {tc('actions.cancel')}
        </Button>
        <Button
          size="xs"
          color="blue"
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
          disabled={days.length === 0}
        >
          {tc('actions.save')}
        </Button>
      </Group>
    </Stack>
  );
}
