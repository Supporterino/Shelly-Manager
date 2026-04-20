import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Container,
  Title,
  Stepper,
  Progress,
  Button,
  Group,
  Alert,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useDiscovery } from '../hooks/useDiscovery'
import { useDeviceStore } from '../store/deviceStore'
import { DiscoveryProgress } from '../components/discovery/DiscoveryProgress'
import { FoundDevicesList } from '../components/discovery/FoundDevicesList'
import { DiscoveryMethodSelect } from '../components/discovery/DiscoveryMethodSelect'
import type { StoredDevice } from '../types/device'
import type { DiscoveryMethod } from '../types/discovery'

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
})

function DiscoverPage() {
  const { t } = useTranslation('discovery')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [methods, setMethods] = useState<DiscoveryMethod[]>(['mdns'])
  const [cidr, setCidr] = useState('')
  const [manualDevices, setManualDevices] = useState<StoredDevice[]>([])

  const { status, found, progress, error, start, reset } = useDiscovery()
  const addDevice = useDeviceStore((s) => s.addDevice)

  function handleManualDevice(device: StoredDevice) {
    setManualDevices((prev) => {
      if (prev.find((d) => d.id === device.id)) return prev
      return [...prev, device]
    })
  }

  async function handleStartDiscovery() {
    const autoMethods = methods.filter(
      (m): m is 'mdns' | 'scan' => m !== 'manual'
    )
    if (autoMethods.length > 0) {
      setStep(1)
      await start(autoMethods, { cidr: cidr || undefined })
    }
    setStep(2)
  }

  function handleAdd(selected: StoredDevice[]) {
    for (const device of selected) {
      addDevice(device)
    }
    navigate({ to: '/' })
  }

  function handleBack() {
    if (step === 1) {
      reset()
      setStep(0)
    } else if (step === 2) {
      setStep(0)
    }
  }

  const allFound = [...found, ...manualDevices].filter(
    (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i
  )

  const stepTitles = [
    t('steps.chooseMethod'),
    t('steps.searching'),
    t('steps.review'),
  ]

  // Shared step content — used by both mobile and desktop render paths.
  const stepChooseMethod = (
    <Stack gap="md" mt="md">
      <DiscoveryMethodSelect
        methods={methods}
        onMethodsChange={setMethods}
        cidr={cidr}
        onCidrChange={setCidr}
        onManualDevice={handleManualDevice}
      />
      <Group justify="flex-end" mt="sm">
        <Button
          color="blue"
          onClick={handleStartDiscovery}
          disabled={
            methods.filter((m) => m !== 'manual').length === 0 &&
            manualDevices.length === 0
          }
        >
          {methods.some((m) => m !== 'manual')
            ? t('steps.searching').replace('…', '')
            : t('steps.review')}
        </Button>
      </Group>
    </Stack>
  )

  const stepSearching = (
    <Stack gap="md" mt="md">
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}
      <DiscoveryProgress
        status={status}
        progress={progress}
        found={found.length}
      />
      <Group justify="space-between" mt="sm">
        <Button variant="default" onClick={handleBack}>
          {tc('actions.cancel')}
        </Button>
        {status === 'done' || status === 'error' ? (
          <Button color="blue" onClick={() => setStep(2)}>
            {t('steps.review')}
          </Button>
        ) : null}
      </Group>
    </Stack>
  )

  const stepReview = (
    <Stack gap="md" mt="md">
      <FoundDevicesList devices={allFound} onAdd={handleAdd} />
      <Group>
        <Button variant="default" onClick={handleBack}>
          {tc('actions.cancel')}
        </Button>
      </Group>
    </Stack>
  )

  return (
    <ScrollArea h="100%">
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={2}>{t('title')}</Title>

        {/* ── Mobile layout (hidden on sm+) ── */}
        <Box hiddenFrom="sm">
          <Group justify="space-between" mb={6}>
            <Text fw={600} size="sm">{stepTitles[step]}</Text>
            <Badge variant="outline" size="sm">{step + 1} / 3</Badge>
          </Group>
          <Progress
            value={(step / 2) * 100}
            size="xs"
            animated={step === 1}
            mb="md"
          />
          {step === 0 && stepChooseMethod}
          {step === 1 && stepSearching}
          {step === 2 && stepReview}
        </Box>

        {/* ── Desktop layout (visible on sm+) ── */}
        <Box visibleFrom="sm">
          <Stepper active={step} color="blue" allowNextStepsSelect={false}>
            <Stepper.Step
              label={t('steps.chooseMethod')}
              loading={false}
            >
              {stepChooseMethod}
            </Stepper.Step>

            <Stepper.Step
              label={t('steps.searching')}
              loading={status === 'running'}
            >
              {stepSearching}
            </Stepper.Step>

            <Stepper.Step label={t('steps.review')}>
              {stepReview}
            </Stepper.Step>
          </Stepper>
        </Box>
      </Stack>
    </Container>
    </ScrollArea>
  )
}
