import { Alert, Button, Loader, Select, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconWifi } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getNetworkInterfaces } from '../../services/discovery';
import type { NetworkInterface } from '../../types/discovery';

interface SubnetAutoDetectProps {
  onCidrChange: (cidr: string) => void;
}

/** Compute the network address CIDR from an IP and prefix length. */
function toNetworkCidr(ip: string, prefix: number): string {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return '';

  const ipInt =
    (BigInt(parts[0]) << 24n) |
    (BigInt(parts[1]) << 16n) |
    (BigInt(parts[2]) << 8n) |
    BigInt(parts[3]);
  const mask = prefix === 0 ? 0n : ~((1n << (32n - BigInt(prefix))) - 1n);
  const net = ipInt & mask;

  const b0 = Number((net >> 24n) & 0xffn);
  const b1 = Number((net >> 16n) & 0xffn);
  const b2 = Number((net >> 8n) & 0xffn);
  const b3 = Number(net & 0xffn);

  return `${b0}.${b1}.${b2}.${b3}/${prefix}`;
}

export function SubnetAutoDetect({ onCidrChange }: SubnetAutoDetectProps) {
  const { t } = useTranslation('discovery');
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [assumedWarning, setAssumedWarning] = useState(false);

  async function handleDetect() {
    setLoading(true);
    setError(null);
    setAssumedWarning(false);

    try {
      const ifaces = await getNetworkInterfaces();
      setInterfaces(ifaces);

      if (ifaces.length === 0) {
        setError(t('form.noInterfaces'));
        return;
      }

      if (ifaces.length === 1) {
        const iface = ifaces[0];
        const prefix = iface.prefix ?? 24;
        if (iface.prefix === null) {
          setAssumedWarning(true);
        }
        const cidr = toNetworkCidr(iface.ip, prefix);
        if (cidr) {
          onCidrChange(cidr);
        }
      }
      // Multiple interfaces → user must pick from the Select
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSelectInterface(name: string | null) {
    setSelectedName(name);
    if (!name) return;
    const iface = interfaces.find((i) => i.name === name);
    if (!iface) return;
    const prefix = iface.prefix ?? 24;
    setAssumedWarning(iface.prefix === null);
    const cidr = toNetworkCidr(iface.ip, prefix);
    if (cidr) {
      onCidrChange(cidr);
    }
  }

  return (
    <Stack gap="xs">
      <Button
        variant="light"
        leftSection={<IconWifi size={16} />}
        onClick={handleDetect}
        loading={loading}
        loaderProps={{ type: 'dots' }}
      >
        {t('form.autoDetect')}
      </Button>

      {loading && (
        <Text size="sm" c="dimmed">
          <Loader size="xs" mr="xs" />
          {t('steps.searching')}
        </Text>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
          {error}
        </Alert>
      )}

      {interfaces.length > 1 && (
        <Select
          label={t('form.selectInterface')}
          placeholder={t('form.selectInterface')}
          data={interfaces.map((iface) => ({
            value: iface.name,
            label: `${iface.name} (${iface.ip})`,
          }))}
          value={selectedName}
          onChange={handleSelectInterface}
        />
      )}

      {assumedWarning && (
        <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
          {t('form.assumedPrefixWarning')}
        </Alert>
      )}
    </Stack>
  );
}
