import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (name: string, code?: string) => void;
  isLoading: boolean;
}

export function CreateScriptModal({ opened, onClose, onSubmit, isLoading }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    onSubmit(name.trim(), code.trim() || undefined);
    setName('');
    setCode('');
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('scripts.create')} centered       size={{ base: 'sm', sm: 'md' }}>
      <Stack gap="sm">
        <TextInput
          label={t('scripts.name')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        <Textarea
          label={t('scripts.code')}
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          placeholder="// Optional initial code"
          minRows={6}
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            {tc('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!name.trim()}>
            {tc('actions.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
