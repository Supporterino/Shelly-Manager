import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WebhookHook } from '../../../types/shelly';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (config: Omit<WebhookHook, 'id'>) => void;
  events: Array<{ value: string; label: string }>;
  isLoading: boolean;
}

export function CreateWebhookModal({ opened, onClose, onSubmit, events, isLoading }: Props) {
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

  const handleSubmit = () => {
    const config: Omit<WebhookHook, 'id'> = {
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
    }
    if (repeatPeriod !== '' && repeatPeriod > 0) {
      config.repeat_period = repeatPeriod;
    }
    if (windowStart) config.window_start = windowStart;
    if (windowEnd) config.window_end = windowEnd;

    onSubmit(config);
  };

  const reset = () => {
    setEvent('');
    setName('');
    setUrls([]);
    setEnable(true);
    setCondition('');
    setRepeatPeriod('');
    setWindowStart('');
    setWindowEnd('');
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t('webhooks.create')}
      centered
      size="md"
    >
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
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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
        </SimpleGrid>
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
