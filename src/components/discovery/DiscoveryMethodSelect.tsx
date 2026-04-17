import { Stack, Checkbox, TextInput, Divider, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { DiscoveryMethod } from '../../types/discovery'
import { ManualAddForm } from './ManualAddForm'
import type { StoredDevice } from '../../types/device'

interface DiscoveryMethodSelectProps {
  methods: DiscoveryMethod[]
  onMethodsChange: (methods: DiscoveryMethod[]) => void
  cidr: string
  onCidrChange: (cidr: string) => void
  onManualDevice: (device: StoredDevice) => void
}

export function DiscoveryMethodSelect({
  methods,
  onMethodsChange,
  cidr,
  onCidrChange,
  onManualDevice,
}: DiscoveryMethodSelectProps) {
  const { t } = useTranslation('discovery')

  function toggle(method: DiscoveryMethod) {
    if (methods.includes(method)) {
      onMethodsChange(methods.filter((m) => m !== method))
    } else {
      onMethodsChange([...methods, method])
    }
  }

  const showScan = methods.includes('scan')
  const showManual = methods.includes('manual')

  return (
    <Stack gap="md">
      <Checkbox
        label={t('methods.mdns')}
        checked={methods.includes('mdns')}
        onChange={() => toggle('mdns')}
      />

      <Stack gap="xs">
        <Checkbox
          label={t('methods.scan')}
          checked={showScan}
          onChange={() => toggle('scan')}
        />
        {showScan && (
          <TextInput
            ml="xl"
            placeholder="192.168.1.0/24"
            label={t('form.cidr')}
            value={cidr}
            onChange={(e) => onCidrChange(e.currentTarget.value)}
          />
        )}
      </Stack>

      <Stack gap="xs">
        <Checkbox
          label={t('methods.manual')}
          checked={showManual}
          onChange={() => toggle('manual')}
        />
        {showManual && (
          <>
            <Divider />
            <Text size="sm" fw={500}>
              {t('methods.manual')}
            </Text>
            <ManualAddForm onDeviceFound={onManualDevice} />
          </>
        )}
      </Stack>
    </Stack>
  )
}
