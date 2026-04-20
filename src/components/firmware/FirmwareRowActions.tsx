import { ActionIcon, Badge, Group, Loader, Progress, Stack, Tooltip } from '@mantine/core';
import { IconCheck, IconCloudDownload, IconMinus, IconRefresh, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { DeviceFirmwareState } from '../../hooks/useFirmwareManager';
import { pollProgress } from '../../utils/firmware';

interface Props {
  state: DeviceFirmwareState;
  onCheck: () => void;
  onUpdate: () => void;
  /** Disables all controls when a global bulk operation is running */
  globalBusy: boolean;
}

/** Status badge — used in both the desktop table row and the mobile card */
export function FirmwareStatusBadge({ state }: { state: DeviceFirmwareState }) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  switch (state.status) {
    case 'idle':
      return (
        <Badge variant="light" color="gray" size="sm">
          {t('firmware.notChecked')}
        </Badge>
      );
    case 'checking':
      return (
        <Badge
          variant="light"
          color="blue"
          size="sm"
          leftSection={<Loader size={10} color="blue" />}
        >
          {tc('status.connecting')}
        </Badge>
      );
    case 'up-to-date':
      return (
        <Badge variant="light" color="green" size="sm" leftSection={<IconCheck size={12} />}>
          {t('firmware.upToDateShort')}
        </Badge>
      );
    case 'update-available':
      return (
        <Badge variant="light" color="blue" size="sm" leftSection={<IconCloudDownload size={12} />}>
          {t('firmware.updateAvailableShort', { version: state.availableVersion ?? '' })}
        </Badge>
      );
    case 'updating':
      return (
        <Badge
          variant="light"
          color="orange"
          size="sm"
          leftSection={<Loader size={10} color="orange" />}
        >
          {t('firmware.updating')}
        </Badge>
      );
    case 'done':
      return (
        <Badge variant="light" color="teal" size="sm" leftSection={<IconCheck size={12} />}>
          {t('firmware.done')}
        </Badge>
      );
    case 'failed':
      return (
        <Tooltip label={state.error ?? t('firmware.failed')} withArrow>
          <Badge variant="light" color="red" size="sm" leftSection={<IconX size={12} />}>
            {t('firmware.failed')}
          </Badge>
        </Tooltip>
      );
    case 'skipped':
      return (
        <Badge variant="light" color="gray" size="sm" leftSection={<IconMinus size={12} />}>
          {t('firmware.offlineSkipped')}
        </Badge>
      );
  }
}

export function FirmwareRowActions({ state, onCheck, onUpdate, globalBusy }: Props) {
  const { t } = useTranslation('devices');
  const canUpdate = state.status === 'update-available';
  const isUpdating = state.status === 'updating';

  return (
    <Stack gap={6}>
      {/* Status badge + action buttons */}
      <Group gap="xs" wrap="nowrap">
        <FirmwareStatusBadge state={state} />

        {/* Check / retry button — always available unless currently updating */}
        <Tooltip label={t('firmware.checkForUpdate')} withArrow>
          <ActionIcon
            variant="subtle"
            size="sm"
            aria-label={t('firmware.checkForUpdate')}
            loading={state.status === 'checking'}
            disabled={globalBusy || isUpdating}
            onClick={onCheck}
          >
            <IconRefresh size={14} stroke={1.5} />
          </ActionIcon>
        </Tooltip>

        {/* Update button — only when a stable update is available */}
        {canUpdate && (
          <Tooltip
            label={t('firmware.updateAvailable', {
              version: state.availableVersion ?? '',
            })}
            withArrow
          >
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              aria-label={t('firmware.updateNow')}
              disabled={globalBusy}
              onClick={onUpdate}
            >
              <IconCloudDownload size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Animated progress bar — visible only while the device is rebooting */}
      {isUpdating && (
        <Progress
          value={state.pollStep > 0 ? pollProgress(state.pollStep) : 100}
          size="xs"
          color="orange"
          animated
          striped
          transitionDuration={400}
          aria-label={t('firmware.updating')}
        />
      )}
    </Stack>
  );
}
