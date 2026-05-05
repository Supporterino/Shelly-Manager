import { Button, Group, Modal, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KVSValue } from '../../../types/shelly';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (key: string, value: unknown, etag?: string) => void;
  onDelete?: (key: string) => void;
  initialData?: KVSValue;
  isLoading: boolean;
}

export function KVSModal({ opened, onClose, onSubmit, onDelete, initialData, isLoading }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const isEdit = initialData != null;
  const [key, setKey] = useState('');
  const [valueText, setValueText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      if (initialData) {
        setKey(initialData.key);
        setValueText(JSON.stringify(initialData.value, null, 2));
      } else {
        setKey('');
        setValueText('');
      }
      setJsonError(null);
    }
  }, [opened, initialData]);

  const validateJson = (text: string): unknown | null => {
    try {
      return JSON.parse(text);
    } catch (e) {
      setJsonError((e as Error).message);
      return null;
    }
  };

  const handleSubmit = () => {
    setJsonError(null);
    const parsed = validateJson(valueText);
    if (parsed === null) return;
    onSubmit(key, parsed, initialData?.etag);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? t('kvs.editKey') : t('kvs.addKey')}
      centered
      size="lg"
    >
      <Stack gap="sm">
        <TextInput
          label={t('kvs.key')}
          value={key}
          onChange={(e) => setKey(e.currentTarget.value)}
          disabled={isEdit}
          required
        />
        <Textarea
          label={t('kvs.value')}
          value={valueText}
          onChange={(e) => {
            setValueText(e.currentTarget.value);
            setJsonError(null);
          }}
          error={jsonError ?? undefined}
          minRows={8}
          styles={{ input: { fontFamily: 'monospace' } }}
          required
        />
        <Text size="xs" c="dimmed">
          Enter valid JSON. Use null, string, number, boolean, array, or object.
        </Text>
        <Group justify="flex-end" mt="xs">
          {isEdit && onDelete && (
            <Button
              variant="light"
              color="red"
              onClick={() => initialData && onDelete(initialData.key)}
              disabled={isLoading}
            >
              {tc('actions.delete')}
            </Button>
          )}
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            {tc('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!key.trim()}>
            {tc('actions.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
