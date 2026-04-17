import { Button, Group, Modal, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
  loading?: boolean
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmColor = 'red',
  loading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation('common')

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
      <Text mb="md">{message}</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={loading}>
          {t('actions.cancel')}
        </Button>
        <Button color={confirmColor} onClick={onConfirm} loading={loading}>
          {confirmLabel ?? t('actions.confirm')}
        </Button>
      </Group>
    </Modal>
  )
}
