import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WebhookHook } from '../../../types/shelly';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: number, config: Partial<Omit<WebhookHook, 'id'>>) => void;
  hook: WebhookHook | null;
  events: Array<{ value: string; label: string }>;
  isLoading: boolean;
}

export function EditWebhookModal({ opened, onClose, onSubmit, hook, events, isLoading }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const [event, setEvent] = useState('');
  const [name, setName] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [enable, setEnable] = useState(true);
  const [condition, setCondition] = useState('');
  const [repeatPeriod, setRepeatPeriod] = useState<number | ''>('');
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');

  useEffect(() => {
    if (hook) {
      setEvent(hook.event);
      setName(hook.name ?? '');
      setUrls(hook.urls ?? []);
      setEnable(hook.enable);
      setCondition(hook.condition ? JSON.stringify(hook.condition, null, 2) : '');
      setRepeatPeriod(hook.repeat_period ?? '');
      setWindowStart(hook.window_start ?? '');
      setWindowEnd(hook.window_end ?? '');
    }
  }, [hook]);

  const handleSubmit = () => {
    if (!hook) return;
    const config: Partial<Omit<WebhookHook, 'id'>> = {
      event,
      name: name || undefined,
      urls,
      enable,
    };
    if (condition.trim()) {
      try {
        config.condition = JSON.parse(condition);
      } catch {
        /* ignore invalid JSON */
      }
    } else {
      config.condition = undefined;
    }
    if (repeatPeriod !== '' && repeatPeriod > 0) {
      config.repeat_period = repeatPeriod;
    } else {
      config.repeat_period = undefined;
    }
    config.window_start = windowStart || undefined;
    config.window_end = windowEnd || undefined;

    onSubmit(hook.id, config);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('webhooks.edit')} centered       size={{ base: 'sm', sm: 'md' }}>
      <Stack gap="sm">
        <Select
          label={t('webhooks.event')}
          data={events}
          value={event}
          onChange={(v) => setEvent(v ?? '')}
          placeholder="e.g. switch.toggle"
          searchable
          required
        />
        <TextInput
          label={t('webhooks.name')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Optional display name"
        />
        <TagsInput
          label={t('webhooks.urls')}
          value={urls}
          onChange={setUrls}
          placeholder="https://..."
          splitChars={[',', ' ']}
        />
        <Switch
          label={t('webhooks.enable')}
          checked={enable}
          onChange={(e) => setEnable(e.currentTarget.checked)}
        />
        <Textarea
          label={t('webhooks.condition')}
          value={condition}
          onChange={(e) => setCondition(e.currentTarget.value)}
          placeholder='{"id": 0, "state": true}'
          minRows={2}
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <NumberInput
          label={t('webhooks.repeatPeriod')}
          value={repeatPeriod}
          onChange={(v) => setRepeatPeriod(typeof v === 'number' ? v : '')}
          min={0}
        />
        <Group grow gap="sm">
          <TextInput
            label={t('webhooks.windowStart')}
            value={windowStart}
            onChange={(e) => setWindowStart(e.currentTarget.value)}
            placeholder="00:00"
          />
          <TextInput
            label={t('webhooks.windowEnd')}
            value={windowEnd}
            onChange={(e) => setWindowEnd(e.currentTarget.value)}
            placeholder="23:59"
          />
        </Group>
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            {tc('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!event || urls.length === 0}>
            {tc('actions.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
