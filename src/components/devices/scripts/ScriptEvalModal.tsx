import { Alert, Button, Code, Group, Modal, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  opened: boolean;
  onClose: () => void;
  onEval: (code: string) => void;
  result?: { result?: unknown; error?: string } | null;
  isLoading: boolean;
}

export function ScriptEvalModal({ opened, onClose, onEval, result, isLoading }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const [code, setCode] = useState('');

  const handleEval = () => {
    onEval(code);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('scripts.eval')} centered       size={{ base: 'sm', sm: 'lg' }}>
      <Stack gap="sm">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          placeholder="1 + 1"
          minRows={4}
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <Group justify="flex-end">
          <Button onClick={handleEval} loading={isLoading} disabled={!code.trim()}>
            {t('scripts.run')}
          </Button>
        </Group>

        {result != null && (
          <Stack gap="xs">
            {result.error ? (
              <Alert color="red" title="Error">
                {result.error}
              </Alert>
            ) : (
              <>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{t('scripts.evalResult')}</span>
                <Code block>{JSON.stringify(result.result, null, 2)}</Code>
              </>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            {tc('actions.close')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
