import { useState } from 'react'
import {
  Stack,
  TextInput,
  NumberInput,
  PasswordInput,
  Button,
  Alert,
  Loader,
  Group,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { verifyManualHost } from '../../services/discovery'
import type { StoredDevice } from '../../types/device'

interface ManualAddFormProps {
  onDeviceFound: (device: StoredDevice) => void
}

function isValidIPv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every((n) => Number(n) >= 0 && Number(n) <= 255)
}

export function ManualAddForm({ onDeviceFound }: ManualAddFormProps) {
  const { t } = useTranslation('discovery')
  const { t: tc } = useTranslation('common')

  const [ip, setIp] = useState('')
  const [port, setPort] = useState<number>(80)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidIPv4(ip.trim())) {
      setError(tc('errors.unknown'))
      return
    }

    setVerifying(true)
    try {
      const auth =
        username || password ? { username, password } : undefined
      const device = await verifyManualHost(ip.trim(), port, auth)

      if (!device) {
        setError(tc('errors.networkUnreachable'))
        return
      }

      onDeviceFound(device)
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.unknown'))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <TextInput
          label={t('form.ipAddress')}
          placeholder="192.168.1.100"
          required
          value={ip}
          onChange={(e) => setIp(e.currentTarget.value)}
        />

        <NumberInput
          label={t('form.port')}
          value={port}
          onChange={(v) => setPort(Number(v) || 80)}
          min={1}
          max={65535}
        />

        <TextInput
          label={t('form.username')}
          placeholder="admin"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          autoComplete="username"
        />

        <PasswordInput
          label={t('form.password')}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          autoComplete="current-password"
        />

        <Group justify="flex-end">
          <Button
            type="submit"
            color="orange"
            disabled={verifying || !ip.trim()}
            leftSection={verifying ? <Loader size={14} /> : undefined}
          >
            {verifying ? t('form.verify') : t('form.add')}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
