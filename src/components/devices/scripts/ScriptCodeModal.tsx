import { Button, Group, Modal, Progress, Stack, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScriptGetCode } from '../../../hooks/useDeviceAutomation';

interface Props {
  opened: boolean;
  onClose: () => void;
  onUpload: (code: string) => void;
  scriptId: number;
  deviceId: string;
  isUploading: boolean;
}

export function ScriptCodeModal({
  opened,
  onClose,
  onUpload,
  scriptId,
  deviceId,
  isUploading,
}: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const { data, isLoading } = useScriptGetCode(deviceId, scriptId);
  const [editMode, setEditMode] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (opened) {
      setEditMode(false);
      setCode(data?.data ?? '');
    }
  }, [opened, data?.data]);

  const handleUpload = () => {
    onUpload(code);
    setEditMode(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setEditMode(false);
        onClose();
      }}
      title={editMode ? t('scripts.editCode') : t('scripts.viewCode')}
      centered
      size="xl"
    >
      <Stack gap="sm">
        {isLoading && !editMode && <Progress value={0} striped animated />}
        <Textarea
          value={editMode || isLoading ? code : (data?.data ?? '')}
          onChange={(e) => setCode(e.currentTarget.value)}
          readOnly={!editMode}
          minRows={16}
          styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
        />
        <Group justify="flex-end" mt="xs">
          {editMode ? (
            <>
              <Button variant="default" onClick={() => setEditMode(false)} disabled={isUploading}>
                {tc('actions.cancel')}
              </Button>
              <Button onClick={handleUpload} loading={isUploading}>
                {t('scripts.uploadCode')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={onClose}>
                {tc('actions.close')}
              </Button>
              <Button onClick={() => setEditMode(true)}>{t('scripts.editCode')}</Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
