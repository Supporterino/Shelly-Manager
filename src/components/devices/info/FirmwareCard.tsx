import { Badge, Button, Card, Group, Loader, Progress, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../common/ConfirmModal'
import { ShellyClient } from '../../../services/shellyClient'
import { pollUntilOffline, pollUntilOnline, pollProgress } from '../../../utils/firmware'
import type { StoredDevice } from '../../../types/device'

interface FirmwareInfo {
  stable?: { version: string }
  beta?: { version: string }
}

interface Props {
  device: StoredDevice
  currentVersion: string
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

      // Phase 1: wait for device to go offline (downloading + applying firmware).
      // Shelly.Update returns immediately while the device downloads in the
      // background — polling online too early will always see a responsive device.
      const wentOffline = await pollUntilOffline(device.ip, device.port)
      if (!wentOffline) throw new Error(t('firmware.updateFailed'))

      // Phase 2: wait for device to reboot and come back online.
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

  const progressValue = pollProgress(pollStep)

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
        {isPolling && (
          <Progress
            value={pollStep > 0 ? progressValue : 100}
            size="xs"
            animated
            striped
          />
        )}
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
