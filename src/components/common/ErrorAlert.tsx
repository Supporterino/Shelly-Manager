import { Alert, Button, Group, Text } from '@mantine/core'
import { IconAlertCircle, IconWifi, IconLock } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { NetworkErrorKind } from '../../utils/networkError'

interface ErrorAlertProps {
  message: string
  errorKind?: NetworkErrorKind
  onRetry?: () => void
}

export function ErrorAlert({ message, errorKind, onRetry }: ErrorAlertProps) {
  const { t } = useTranslation('common')

  const icon = errorKind === 'no_network'
    ? <IconWifi size={16} />
    : errorKind === 'auth'
      ? <IconLock size={16} />
      : <IconAlertCircle size={16} />

  const hint = errorKind === 'no_network'
    ? t('errors.noNetwork')
    : errorKind === 'unreachable'
      ? t('errors.networkUnreachable')
      : errorKind === 'auth'
        ? t('errors.authFailed')
        : null

  return (
    <Alert
      icon={icon}
      color="red"
      title={t('status.error')}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm">{message}</Text>
          {hint && hint !== message && (
            <Text size="xs" c="red.3" mt={4}>{hint}</Text>
          )}
        </div>
        {onRetry && (
          <Button size="xs" variant="outline" color="red" onClick={onRetry} style={{ flexShrink: 0 }}>
            {t('actions.retry')}
          </Button>
        )}
      </Group>
    </Alert>
  )
}
