import { Badge, Button, Card, Group, Loader, Progress, SegmentedControl, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellyClient } from '../../../services/shellyClient';
import type { StoredDevice } from '../../../types/device';
import { useDeviceStore } from '../../../store/deviceStore';
import { useAppStore } from '../../../store/appStore';
import { extractTrackVersion } from '../../../hooks/useFirmwareManager';
import { pollProgress, pollUntilOffline, pollUntilOnline } from '../../../utils/firmware';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  device: StoredDevice;
  currentVersion: string;
}

export function FirmwareCard({ device, currentVersion }: Props) {
  const { t } = useTranslation('devices');
  const updateDeviceStore = useDeviceStore((s) => s.updateDevice);
  const defaultTrack = useAppStore((s) => s.preferences.defaultUpdateTrack);
  const [updateInfo, setUpdateInfo] = useState<{
    stable?: { version?: string } | null;
    beta?: { version?: string } | null;
    available_updates?: {
      stable?: { version?: string } | null;
      beta?: { version?: string } | null;
    } | null;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollStep, setPollStep] = useState(0);

  const effectiveTrack = device.updateTrack ?? defaultTrack;

  const checkMutation = useMutation({
    mutationFn: async ({ track }: { track: 'stable' | 'beta' }) => {
      const result = await new ShellyClient(device).checkForUpdate();
      return { result, track };
    },
    onSuccess: ({ result, track }) => {
      setUpdateInfo(result);
      const version = extractTrackVersion(result, track);
      if (!version) {
        notifications.show({ color: 'green', message: t('firmware.upToDate') });
      }
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', title: 'Error', message: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ track }: { track: 'stable' | 'beta' }) => {
      await new ShellyClient(device).triggerUpdate(track);
      setConfirmOpen(false);
      setIsPolling(true);

      // Phase 1: wait for device to go offline (downloading + applying firmware).
      const wentOffline = await pollUntilOffline(device.ip, device.port);
      if (!wentOffline) throw new Error(t('firmware.updateFailed'));

      // Phase 2: wait for device to reboot and come back online.
      const online = await pollUntilOnline(device.ip, device.port, setPollStep);
      setIsPolling(false);
      setPollStep(0);
      if (!online) throw new Error(t('firmware.updateFailed'));
    },
    onSuccess: () => {
      setUpdateInfo(null);
      notifications.show({ color: 'green', message: t('firmware.updateSuccess') });
    },
    onError: (err: Error) => {
      setIsPolling(false);
      setPollStep(0);
      notifications.show({ color: 'red', message: err.message });
    },
  });

  const newVersion = extractTrackVersion(updateInfo ?? {}, effectiveTrack);
  const busy = isPolling || updateMutation.isPending || checkMutation.isPending;

  const progressValue = pollProgress(pollStep);

  const handleTrackChange = (value: string) => {
    const track = value as 'stable' | 'beta';
    updateDeviceStore(device.id, { updateTrack: track });
  };

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {t('info.firmware')}
          </Text>
          <Badge variant="light">{currentVersion}</Badge>
        </Group>

        {/* Track selector */}
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            {t('firmware.track')}
          </Text>
          <SegmentedControl
            size="xs"
            value={effectiveTrack}
            onChange={handleTrackChange}
            data={[
              { label: t('firmware.trackStable'), value: 'stable' },
              { label: t('firmware.trackBeta'), value: 'beta' },
            ]}
          />
        </Group>

        {newVersion && (
          <Text size="xs" c={effectiveTrack === 'beta' ? 'orange' : 'blue'}>
            {effectiveTrack === 'beta'
              ? t('firmware.updateAvailableBeta', { version: newVersion })
              : t('firmware.updateAvailable', { version: newVersion })}
          </Text>
        )}

        {busy && (
          <Stack gap={4}>
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                {t('firmware.updating')}
              </Text>
            </Group>
            {isPolling && (
              <Progress value={pollStep > 0 ? progressValue : 100} size="xs" animated striped />
            )}
          </Stack>
        )}

        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            loading={checkMutation.isPending}
            disabled={busy}
            onClick={() => checkMutation.mutate({ track: effectiveTrack })}
          >
            {t('firmware.checkForUpdate')}
          </Button>

          {newVersion && (
            <Button size="xs" color={effectiveTrack === 'beta' ? 'orange' : 'blue'} disabled={busy} onClick={() => setConfirmOpen(true)}>
              {effectiveTrack === 'beta'
                ? t('firmware.updateAvailableBeta', { version: newVersion })
                : t('firmware.updateAvailable', { version: newVersion })}
            </Button>
          )}
        </Group>
      </Stack>

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => updateMutation.mutate({ track: effectiveTrack })}
        title={t('firmware.checkForUpdate')}
        message={t('firmware.updateConfirm', { version: newVersion ?? '' })}
        confirmLabel={t('firmware.updateNow')}
        confirmColor={effectiveTrack === 'beta' ? 'orange' : 'blue'}
        loading={busy}
      />
    </Card>
  );
}
