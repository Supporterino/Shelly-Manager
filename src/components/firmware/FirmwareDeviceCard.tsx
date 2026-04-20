import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { DeviceFirmwareState } from '../../hooks/useFirmwareManager';
import type { StoredDevice } from '../../types/device';
import { pollProgress } from '../../utils/firmware';
import { FirmwareStatusBadge } from './FirmwareRowActions';

interface Props {
  device: StoredDevice;
  state: DeviceFirmwareState;
  globalBusy: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onCheckDevice: () => void;
  onUpdateDevice: () => void;
}

export function FirmwareDeviceCard({
  device,
  state,
  globalBusy,
  selected,
  onToggleSelect,
  onCheckDevice,
  onUpdateDevice,
}: Props) {
  const { t } = useTranslation('devices');

  const canUpdate = state.status === 'update-available';
  const isUpdating = state.status === 'updating';

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      bg={selected ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Stack gap="xs">
        {/* Row 1: checkbox + device name (linked) + status badge */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" align="center" style={{ minWidth: 0, flex: 1 }}>
            <Checkbox
              aria-label={`Select ${device.name}`}
              checked={selected}
              onChange={onToggleSelect}
              disabled={globalBusy}
              style={{ flexShrink: 0 }}
            />
            <Link
              to="/devices/$deviceId"
              params={{ deviceId: device.id }}
              style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}
            >
              <Text fw={500} size="sm" lineClamp={1}>
                {device.name}
              </Text>
            </Link>
          </Group>

          <Box style={{ flexShrink: 0, paddingLeft: 8 }}>
            <FirmwareStatusBadge state={state} />
          </Box>
        </Group>

        {/* Row 2: IP address + current version + available version (when update ready) */}
        <Group gap={4} align="center" wrap="wrap">
          <Text size="xs" c="dimmed">
            {device.ip}:{device.port}
          </Text>
          <Text size="xs" c="dimmed">
            ·
          </Text>
          <Badge variant="light" color="gray" size="xs">
            {state.currentVersion}
          </Badge>
          {canUpdate && state.availableVersion && (
            <>
              <Text size="xs" c="dimmed">
                →
              </Text>
              <Badge variant="light" color="blue" size="xs">
                {state.availableVersion}
              </Badge>
            </>
          )}
        </Group>

        {/* Progress bar — only visible while device is rebooting after an update */}
        {isUpdating && (
          <Progress
            value={state.pollStep > 0 ? pollProgress(state.pollStep) : 100}
            size="sm"
            color="orange"
            animated
            striped
            transitionDuration={400}
            aria-label={t('firmware.updating')}
          />
        )}

        {/* Action row */}
        <Group justify="flex-end" gap="xs">
          <Tooltip label={t('firmware.checkForUpdate')} withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label={t('firmware.checkForUpdate')}
              loading={state.status === 'checking'}
              disabled={globalBusy || isUpdating}
              onClick={onCheckDevice}
            >
              <IconRefresh size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          {canUpdate && (
            <Button
              size="xs"
              color="blue"
              leftSection={<IconCloudDownload size={12} />}
              disabled={globalBusy}
              onClick={onUpdateDevice}
            >
              {t('firmware.updateNow')}
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
