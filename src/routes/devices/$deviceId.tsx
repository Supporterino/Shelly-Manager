import {
  ActionIcon,
  Divider,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconRefresh, IconSettings } from '@tabler/icons-react';
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ComponentList } from '../../components/devices/ComponentList';
import { DeviceStatusBadge } from '../../components/devices/DeviceStatusBadge';
import { DeviceInfoPanel } from '../../components/devices/info/DeviceInfoPanel';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { useWsStatus } from '../../hooks/useWsStatus';
import { wsManager } from '../../services/wsManager';
import { useDeviceStore } from '../../store/deviceStore';
import type { ConnectionStatus } from '../../types/device';
import { classifyNetworkError } from '../../utils/networkError';

export const Route = createFileRoute('/devices/$deviceId')({
  component: DeviceDetailPage,
});

function DeviceDetailPage() {
  const { deviceId } = Route.useParams();
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const location = useLocation();
  const device = useDeviceStore((s) => s.devices[deviceId]);
  const updateDevice = useDeviceStore((s) => s.updateDevice);

  const {
    data: polledStatus,
    isLoading,
    error,
    refetch,
  } = useDeviceStatus(
    device ?? {
      id: deviceId,
      ip: '',
      port: 80,
      name: '',
      model: '',
      app: '',
      generation: 'gen2',
      type: 'unknown',
      components: [],
      addedAt: 0,
      lastSeenAt: 0,
    },
  );
  const { data: deviceInfo, isLoading: deviceInfoLoading } = useDeviceInfo(
    device ?? {
      id: deviceId,
      ip: '',
      port: 80,
      name: '',
      model: '',
      app: '',
      generation: 'gen2',
      type: 'unknown',
      components: [],
      addedAt: 0,
      lastSeenAt: 0,
    },
  );
  const { wsStatus, isConnected } = useWsStatus(deviceId);
  const status = isConnected ? (wsStatus as typeof polledStatus) : polledStatus;

  // Update lastSeenAt when status arrives.
  // `device` is intentionally omitted from deps: including it would cause a loop
  // because updateDevice creates a new device object reference on every call.
  useEffect(() => {
    if (status) {
      updateDevice(deviceId, { lastSeenAt: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, deviceId, updateDevice]);

  // Connect WebSocket on mount, disconnect on unmount
  useEffect(() => {
    if (!device) return;
    void wsManager.connect(device);
    return () => {
      wsManager.disconnect(device.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id, device]);

  // When a child route (e.g. /settings) is active, let it render in full
  if (location.pathname.endsWith('/settings')) {
    return <Outlet />;
  }

  if (!device) {
    return (
      <Stack p="md">
        <ErrorAlert message={`Device ${deviceId} not found`} />
      </Stack>
    );
  }

  const connectionStatus: ConnectionStatus = isConnected
    ? 'online'
    : !isLoading && !error && status
      ? 'online'
      : isLoading
        ? 'connecting'
        : 'offline';

  const uptime =
    status?.sys != null
      ? ((status.sys as Record<string, unknown>)?.uptime as number | undefined)
      : undefined;

  const sysStatus = status?.sys != null ? (status.sys as Record<string, unknown>) : undefined;

  return (
    <ScrollArea h="100%">
      <Stack gap="md" p="md">
        {/* Header */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Link to="/">
              <ActionIcon variant="subtle" size="lg" aria-label={tc('actions.back')}>
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Link>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Title order={3} lineClamp={1}>
                {device.name}
              </Title>
              <Group gap="xs" align="center">
                <DeviceStatusBadge status={connectionStatus} />
                <Text size="xs" c="dimmed" truncate="end">
                  {device.ip}:{device.port}
                </Text>
              </Group>
            </Stack>
          </Group>
          <Group gap="xs">
            <Tooltip label={tc('actions.refresh')}>
              <ActionIcon
                variant="light"
                size="lg"
                aria-label={tc('actions.refresh')}
                loading={isLoading}
                onClick={() => void refetch()}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Link to="/devices/$deviceId/settings" params={{ deviceId }}>
              <ActionIcon variant="light" size="lg" aria-label={t('info.model')}>
                <IconSettings size={18} />
              </ActionIcon>
            </Link>
          </Group>
        </Group>

        <Divider />

        {/* Device info */}
        <DeviceInfoPanel
          device={device}
          uptime={uptime}
          deviceInfo={deviceInfo}
          deviceInfoLoading={deviceInfoLoading}
          sysStatus={sysStatus}
        />

        <Divider />

        {/* Component controls */}
        {isLoading && !status ? (
          <Stack gap="sm">
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
          </Stack>
        ) : error ? (
          <ErrorAlert
            message={(error as Error).message}
            errorKind={classifyNetworkError(error)}
            onRetry={() => void refetch()}
          />
        ) : (
          <ComponentList device={device} status={status} />
        )}
      </Stack>
    </ScrollArea>
  );
}
