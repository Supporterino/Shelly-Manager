import { Badge, Button, Card, Group, Loader, Progress, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../common/ConfirmModal'
import { ShellyClient, verifyShellyHost } from '../../../services/shellyClient'
import type { StoredDevice } from '../../../types/device'

interface FirmwareInfo {
  stable?: { version: string }
  beta?: { version: string }
}

interface Props {
  device: StoredDevice
  currentVersion: string
}

// Exponential backoff delays in ms — total ~68 s max wait
const POLL_DELAYS_MS = [3000, 5000, 8000, 10000, 12000, 15000, 15000]

// Cumulative elapsed time at the end of each step (ms)
const CUMULATIVE_MS = POLL_DELAYS_MS.reduce<number[]>(
  (acc, d) => [...acc, (acc.at(-1) ?? 0) + d],
  [],
)
const TOTAL_MS = CUMULATIVE_MS.at(-1)!

async function pollUntilOnline(
  ip: string,
  port: number,
  onStep?: (step: number) => void,
): Promise<boolean> {
  for (let i = 0; i < POLL_DELAYS_MS.length; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_DELAYS_MS[i]))
    onStep?.(i + 1)
    const result = await verifyShellyHost(ip, port)
    if (result) return true
  }
  return false
}

export function FirmwareCard({ device, currentVersion }: Props) {
  const { t } = useTranslation('devices')
  const [updateInfo, setUpdateInfo] = useState<FirmwareInfo | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [pollStep, setPollStep] = useState(0)

  const checkMutation = useMutation({
    mutationFn: () => new ShellyClient(device).checkForUpdate(),
    onSuccess: (data) => {
      setUpdateInfo(data)
      if (!data.stable && !data.beta) {
        notifications.show({ color: 'green', message: t('firmware.upToDate') })
      }
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      await new ShellyClient(device).triggerUpdate('stable')
      setConfirmOpen(false)
      setIsPolling(true)
      const online = await pollUntilOnline(device.ip, device.port, setPollStep)
      setIsPolling(false)
      setPollStep(0)
      if (!online) throw new Error(t('firmware.updateFailed'))
    },
    onSuccess: () => {
      setUpdateInfo(null)
      notifications.show({ color: 'green', message: t('firmware.updateSuccess') })
    },
    onError: (err: Error) => {
      setIsPolling(false)
      setPollStep(0)
      notifications.show({ color: 'red', message: err.message })
    },
  })

  const newVersion = updateInfo?.stable?.version
  const busy = isPolling || updateMutation.isPending

  // Progress 0–100 based on which poll step has completed
  const progressValue = pollStep === 0 ? 0 : (CUMULATIVE_MS[pollStep - 1] / TOTAL_MS) * 100

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">{t('info.firmware')}</Text>
          <Badge variant="light">{currentVersion}</Badge>
        </Group>

        {newVersion && (
          <Text size="xs" c="blue">
            {t('firmware.updateAvailable', { version: newVersion })}
          </Text>
        )}

        {busy && (
          <Stack gap={4}>
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="xs" c="dimmed">{t('firmware.updating')}</Text>
            </Group>
            {isPolling && <Progress value={progressValue} size="xs" />}
          </Stack>
        )}

        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            loading={checkMutation.isPending}
            disabled={busy}
            onClick={() => checkMutation.mutate()}
          >
            {t('firmware.checkForUpdate')}
          </Button>

          {newVersion && (
            <Button
              size="xs"
              color="blue"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              {t('firmware.updateAvailable', { version: newVersion })}
            </Button>
          )}
        </Group>
      </Stack>

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => updateMutation.mutate()}
        title={t('firmware.checkForUpdate')}
        message={t('firmware.updateConfirm', { version: newVersion ?? '' })}
        confirmLabel={t('firmware.updateNow')}
        confirmColor="blue"
        loading={busy}
      />
    </Card>
  )
}
