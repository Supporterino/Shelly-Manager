import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  PasswordInput,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { useDeviceStore } from '../../store/deviceStore'
import { ShellyClient } from '../../services/shellyClient'
import { FirmwareCard } from '../../components/devices/info/FirmwareCard'
import { ScheduleSection } from '../../components/devices/ScheduleSection'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { useDeviceStatus } from '../../hooks/useDeviceStatus'

export const Route = createFileRoute('/devices/$deviceId/settings')({
  component: DeviceSettingsPage,
})

function DeviceSettingsPage() {
  const { deviceId } = Route.useParams()
  const { t } = useTranslation('devices')
  const { t: tc } = useTranslation('common')
  const device = useDeviceStore((s) => s.devices[deviceId])
  const updateDevice = useDeviceStore((s) => s.updateDevice)
  const removeDevice = useDeviceStore((s) => s.removeDevice)
  const queryClient = useQueryClient()
  const { data: status } = useDeviceStatus(
    device ?? { id: deviceId, ip: '', port: 80, name: '', model: '', app: '',
               generation: 'gen2', type: 'unknown', components: [], addedAt: 0,
               lastSeenAt: 0 }
  )

  const [rebootConfirm, setRebootConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)

  // Name form state
  const [deviceName, setDeviceName] = useState(device?.name ?? '')

  // Auth form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      new ShellyClient(device!).call<void>('Sys.SetConfig', {
        config: { device: { name } },
      }),
    onSuccess: (_d, name) => {
      updateDevice(deviceId, { name })
      notifications.show({ color: 'green', message: tc('actions.save') })
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  })

  const rebootMutation = useMutation({
    mutationFn: () => new ShellyClient(device!).reboot(),
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('dangerZone.rebootSuccess') }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setRebootConfirm(false),
  })

  const factoryResetMutation = useMutation({
    mutationFn: () => new ShellyClient(device!).factoryReset(),
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
    onSettled: () => setResetConfirm(false),
  })

  if (!device) {
    return (
      <Stack p="md">
        <ErrorAlert message={`Device ${deviceId} not found`} />
      </Stack>
    )
  }

  const currentVersion = (status?.['sys'] as Record<string, unknown> | undefined)
    ?.fw_id as string | undefined ?? device.model

  return (
    <ScrollArea h="100%">
      <Stack gap="md" p="md">
        <Group gap="xs" align="center" wrap="nowrap">
          <Link to="/devices/$deviceId" params={{ deviceId }}>
            <ActionIcon variant="subtle" size="lg" aria-label={tc('actions.back')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Link>
          <Title order={3}>{device.name}</Title>
        </Group>

        {/* Name */}
        <Stack gap="xs">
          <Text fw={600}>{t('info.model')}</Text>
          <form onSubmit={(e) => { e.preventDefault(); renameMutation.mutate(deviceName) }}>
            <Group gap="xs">
              <TextInput
                value={deviceName}
                onChange={(e) => setDeviceName(e.currentTarget.value)}
                placeholder={device.name}
                style={{ flex: 1 }}
              />
              <Button type="submit" size="sm" loading={renameMutation.isPending}>
                {tc('actions.save')}
              </Button>
            </Group>
          </form>
        </Stack>

        <Divider />

        {/* Network info (read-only) */}
        <Stack gap="xs">
          <Text fw={600}>{t('info.ipAddress')}</Text>
          <Text size="sm" c="dimmed">{device.ip}:{device.port}</Text>
        </Stack>

        <Divider />

        {/* Firmware */}
        <Stack gap="xs">
          <Text fw={600}>{t('info.firmware')}</Text>
          <FirmwareCard device={device} currentVersion={currentVersion} />
        </Stack>

        <Divider />

        {/* Schedules */}
        <ScheduleSection device={device} />

        <Divider />

        {/* Auth */}
        <Stack gap="xs">
          <Text fw={600}>{tc('status.error').replace('Error', 'Authentication')}</Text>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setPasswordError(null)
            if (password !== confirmPassword) {
              setPasswordError('Passwords do not match')
              return
            }
            try {
              await queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
              updateDevice(deviceId, {
                auth: { username: 'admin', password },
              })
              notifications.show({ color: 'green', message: tc('actions.save') })
              setPassword('')
              setConfirmPassword('')
            } catch (err) {
              notifications.show({ color: 'red', message: (err as Error).message })
            }
          }}>
            <Stack gap="xs">
              <PasswordInput
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <PasswordInput
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                error={passwordError}
              />
              <Button type="submit" size="sm">{tc('actions.save')}</Button>
            </Stack>
          </form>
        </Stack>

        <Divider />

        {/* Danger zone */}
        <Stack gap="xs">
          <Text fw={600} c="red">{t('dangerZone.title')}</Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <Button
              color="yellow"
              variant="light"
              size="sm"
              fullWidth
              onClick={() => setRebootConfirm(true)}
            >
              {t('dangerZone.reboot')}
            </Button>
            <Button
              color="red"
              variant="light"
              size="sm"
              fullWidth
              onClick={() => setResetConfirm(true)}
            >
              {t('dangerZone.factoryReset')}
            </Button>
            <Button
              color="red"
              variant="subtle"
              size="sm"
              fullWidth
              onClick={() => setRemoveConfirm(true)}
            >
              {tc('actions.delete')}
            </Button>
          </SimpleGrid>
        </Stack>
      </Stack>

      {/* Modals */}
      <ConfirmModal
        opened={rebootConfirm}
        onClose={() => setRebootConfirm(false)}
        onConfirm={() => rebootMutation.mutate()}
        title={t('dangerZone.reboot')}
        message={t('dangerZone.rebooting')}
        confirmColor="yellow"
        loading={rebootMutation.isPending}
      />
      <ConfirmModal
        opened={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={() => factoryResetMutation.mutate()}
        title={t('dangerZone.factoryReset')}
        message={t('dangerZone.factoryResetConfirm')}
        confirmColor="red"
        loading={factoryResetMutation.isPending}
      />
      <ConfirmModal
        opened={removeConfirm}
        onClose={() => setRemoveConfirm(false)}
        onConfirm={() => {
          removeDevice(deviceId)
          setRemoveConfirm(false)
        }}
        title={tc('actions.delete')}
        message={`Remove ${device.name} from Shelly Manager?`}
        confirmColor="red"
      />
    </ScrollArea>
  )
}
