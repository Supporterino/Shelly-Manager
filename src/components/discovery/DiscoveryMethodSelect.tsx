import { Alert, Checkbox, Divider, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { StoredDevice } from '../../types/device';
import type { DiscoveryMethod } from '../../types/discovery';
import { ManualAddForm } from './ManualAddForm';

interface DiscoveryMethodSelectProps {
  methods: DiscoveryMethod[];
  onMethodsChange: (methods: DiscoveryMethod[]) => void;
  cidr: string;
  onCidrChange: (cidr: string) => void;
  onManualDevice: (device: StoredDevice) => void;
}

/** Parse the prefix length from a CIDR string, or return null if invalid. */
function parsePrefixLen(cidr: string): number | null {
  const parts = cidr.split('/');
  if (parts.length !== 2) return null;
  const prefix = parseInt(parts[1], 10);
  return Number.isNaN(prefix) || prefix < 0 || prefix > 32 ? null : prefix;
}

export function DiscoveryMethodSelect({
  methods,
  onMethodsChange,
  cidr,
  onCidrChange,
  onManualDevice,
}: DiscoveryMethodSelectProps) {
  const { t } = useTranslation('discovery');

  function toggle(method: DiscoveryMethod) {
    if (methods.includes(method)) {
      onMethodsChange(methods.filter((m) => m !== method));
    } else {
      onMethodsChange([...methods, method]);
    }
  }

  const showScan = methods.includes('scan');
  const showManual = methods.includes('manual');

  const prefixLen = cidr ? parsePrefixLen(cidr) : null;
  // prefix < 19 → > 8192 hosts → hard cap (matches Rust)
  const cidrTooLarge = prefixLen !== null && prefixLen < 19;
  // prefix < 21 → > 2048 hosts → warn (slow scan)
  const cidrLarge = prefixLen !== null && prefixLen >= 19 && prefixLen < 21;

  return (
    <Stack gap="md">
      <Checkbox
        label={t('methods.mdns')}
        checked={methods.includes('mdns')}
        onChange={() => toggle('mdns')}
      />

      <Stack gap="xs">
        <Checkbox label={t('methods.scan')} checked={showScan} onChange={() => toggle('scan')} />
        {showScan && (
          <>
            <TextInput
              ml="xl"
              placeholder="192.168.1.0/24"
              label={t('form.cidr')}
              value={cidr}
              onChange={(e) => onCidrChange(e.currentTarget.value)}
              error={cidrTooLarge ? t('form.cidrTooLarge') : undefined}
            />
            {cidrLarge && (
              <Alert color="orange" icon={<IconAlertTriangle size={16} />} ml="xl">
                {t('form.cidrLargeWarning')}
              </Alert>
            )}
            {cidrTooLarge && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} ml="xl">
                {t('form.cidrTooLarge')}
              </Alert>
            )}
          </>
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
  );
}
