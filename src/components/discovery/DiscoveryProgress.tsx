import { Badge, Button, Group, Loader, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconDevices, IconPencil, IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { DiscoveryStatus } from '../../hooks/useDiscovery';
import type { DiscoveredHost, ScanProgress } from '../../types/discovery';

interface DiscoveryProgressProps {
  status: DiscoveryStatus;
  progress: DiscoveredHost[];
  found: number;
  scanProgress?: ScanProgress | null;
  onCancel?: () => void;
}

const SOURCE_ICON = {
  mdns: IconSearch,
  scan: IconDevices,
  manual: IconPencil,
};

export function DiscoveryProgress({
  status,
  progress,
  found,
  scanProgress,
  onCancel,
}: DiscoveryProgressProps) {
  const { t } = useTranslation('discovery');
  const { t: tc } = useTranslation('common');

  const showProgress = status === 'running' && scanProgress && scanProgress.total > 0;
  const progressValue = showProgress
    ? Math.min(100, (scanProgress!.scanned / scanProgress!.total) * 100)
    : 0;

  return (
    <Stack gap="md">
      <Group gap="sm">
        {status === 'running' && <Loader size="sm" />}
        <Text fw={500}>
          {status === 'running' ? t('steps.searching') : t('found', { count: found })}
        </Text>
      </Group>

      {showProgress && (
        <Stack gap="xs">
          <Progress value={progressValue} size="sm" animated />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t('scanningProgress', {
                scanned: scanProgress!.scanned.toLocaleString(),
                total: scanProgress!.total.toLocaleString(),
              })}
            </Text>
            <Text size="sm" c="dimmed">
              {t('found', { count: scanProgress!.found })}
            </Text>
          </Group>
          {onCancel && (
            <Button variant="light" color="red" size="xs" onClick={onCancel}>
              {tc('actions.cancel')}
            </Button>
          )}
        </Stack>
      )}

      {progress.length === 0 && status === 'running' && !showProgress && (
        <Text size="sm" c="dimmed">
          {t('steps.searching')}
        </Text>
      )}

      <Stack gap="xs">
        {progress.map((host) => {
          const Icon = SOURCE_ICON[host.source];
          return (
            <Group key={host.ip} gap="sm">
              <ThemeIcon size="sm" variant="light" color="blue">
                <Icon size={12} />
              </ThemeIcon>
              <Text size="sm" ff="monospace">
                {host.ip}:{host.port}
              </Text>
              {host.hostname && (
                <Text size="sm" c="dimmed">
                  {host.hostname}
                </Text>
              )}
              <Badge size="xs" variant="outline" color="blue">
                {host.source}
              </Badge>
            </Group>
          );
        })}
      </Stack>

      {progress.length === 0 && status === 'done' && (
        <Text size="sm" c="dimmed">
          {t('noDevicesFound')}
        </Text>
      )}
    </Stack>
  );
}
