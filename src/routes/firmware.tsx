import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { FirmwareDeviceList } from '../components/firmware/FirmwareDeviceList';
import { FirmwareTable } from '../components/firmware/FirmwareTable';
import { useFirmwareManager } from '../hooks/useFirmwareManager';
import { useDeviceStore } from '../store/deviceStore';
import { useWsStatusStore } from '../store/wsStatusStore';
import type { StoredDevice } from '../types/device';

export const Route = createFileRoute('/firmware')({
  component: FirmwarePage,
});

function FirmwarePage() {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');

  const devicesRecord = useDeviceStore((s) => s.devices);
  const devices = useMemo(() => Object.values(devicesRecord), [devicesRecord]);
  const liveStatuses = useWsStatusStore((s) => s.statuses) as Record<
    string,
    Record<string, unknown>
  >;

  const {
    firmwareStates,
    checkDevice,
    updateDevice: _updateDevice,
    checkAll,
    checkSelected,
    updateSelected,
  } = useFirmwareManager(devices, liveStatuses);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchTargets, setBatchTargets] = useState<StoredDevice[]>([]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const anyBusy = useMemo(
    () =>
      Object.values(firmwareStates).some((s) => s.status === 'checking' || s.status === 'updating'),
    [firmwareStates],
  );

  const devicesWithUpdates = useMemo(
    () => devices.filter((d) => firmwareStates[d.id]?.status === 'update-available'),
    [devices, firmwareStates],
  );

  const selectedDevices = useMemo(
    () => devices.filter((d) => selectedIds.has(d.id)),
    [devices, selectedIds],
  );

  const selectedWithUpdates = useMemo(
    () => selectedDevices.filter((d) => firmwareStates[d.id]?.status === 'update-available'),
    [selectedDevices, firmwareStates],
  );

  const updateCount =
    batchTargets.length > 0
      ? batchTargets.length
      : selectedWithUpdates.length || devicesWithUpdates.length;

  // ── Summary line ───────────────────────────────────────────────────────────

  const summaryText = useMemo(() => {
    const checkedCount = devices.filter(
      (d) =>
        firmwareStates[d.id]?.status === 'up-to-date' ||
        firmwareStates[d.id]?.status === 'update-available' ||
        firmwareStates[d.id]?.status === 'done',
    ).length;

    if (checkedCount === 0) return null;

    if (devicesWithUpdates.length > 0) {
      return t('firmware.summaryAvailable', { count: devicesWithUpdates.length });
    }

    if (checkedCount === devices.length) {
      return t('firmware.summaryAllUpToDate');
    }

    return null;
  }, [devices, devicesWithUpdates.length, firmwareStates, t]);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === devices.length ? new Set() : new Set(devices.map((d) => d.id)),
    );
  }, [devices]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleCheckAll = () => {
    void checkAll(devices);
  };

  const handleCheckSelected = () => {
    void checkSelected(selectedDevices);
  };

  const handleUpdateAll = () => {
    const targets = devicesWithUpdates;
    setBatchTargets(targets);
    setBatchConfirmOpen(true);
  };

  const handleUpdateSelected = () => {
    const targets = selectedWithUpdates;
    setBatchTargets(targets);
    setBatchConfirmOpen(true);
  };

  const handleBatchConfirm = () => {
    setBatchConfirmOpen(false);
    const targets = batchTargets;
    setBatchTargets([]);
    void updateSelected(targets).then(() => {
      notifications.show({
        color: 'green',
        message: t('firmware.updateSuccess'),
      });
    });
  };

  const handleUpdateDevice = (device: StoredDevice) => {
    setBatchTargets([device]);
    setBatchConfirmOpen(true);
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (devices.length === 0) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Title order={3} c="dimmed">
            {t('firmware.pageTitle')}
          </Title>
          <Text c="dimmed">{t('firmware.noDevices')}</Text>
          <Button component={Link} to="/discover">
            {tc('nav.discover')}
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md" h="100%" style={{ overflow: 'hidden' }}>
      {/* Page header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Title order={2}>{t('firmware.pageTitle')}</Title>

        <Group gap="xs" wrap="wrap">
          {/* Check actions */}
          <Tooltip label={t('firmware.checkAll')} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              aria-label={t('firmware.checkAll')}
              loading={anyBusy}
              disabled={anyBusy}
              onClick={handleCheckAll}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>

          {selectedIds.size > 0 && (
            <Button
              variant="light"
              size="sm"
              leftSection={<IconRefresh size={14} />}
              disabled={anyBusy}
              onClick={handleCheckSelected}
            >
              {t('firmware.checkSelected', { count: selectedIds.size })}
            </Button>
          )}

          {/* Update actions */}
          {devicesWithUpdates.length > 0 && selectedWithUpdates.length === 0 && (
            <Button
              size="sm"
              color="blue"
              leftSection={<IconCloudDownload size={14} />}
              disabled={anyBusy}
              onClick={handleUpdateAll}
            >
              {t('firmware.updateAll')}
            </Button>
          )}

          {selectedWithUpdates.length > 0 && (
            <Button
              size="sm"
              color="blue"
              leftSection={<IconCloudDownload size={14} />}
              disabled={anyBusy}
              onClick={handleUpdateSelected}
            >
              {t('firmware.updateSelected', { count: selectedWithUpdates.length })}
            </Button>
          )}
        </Group>
      </Group>

      {/* Summary line */}
      {summaryText && (
        <Text size="sm" c={devicesWithUpdates.length > 0 ? 'blue' : 'green'}>
          {summaryText}
        </Text>
      )}

      {/* Mobile: card list (hidden on sm and above) */}
      <Box hiddenFrom="sm" style={{ flex: 1, overflowY: 'auto' }}>
        <FirmwareDeviceList
          devices={devices}
          firmwareStates={firmwareStates}
          selectedIds={selectedIds}
          globalBusy={anyBusy}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCheckDevice={(d) => void checkDevice(d)}
          onUpdateDevice={handleUpdateDevice}
        />
      </Box>

      {/* Desktop: table (visible on sm and above) */}
      <ScrollArea visibleFrom="sm" style={{ flex: 1 }}>
        <FirmwareTable
          devices={devices}
          firmwareStates={firmwareStates}
          selectedIds={selectedIds}
          globalBusy={anyBusy}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCheckDevice={(d) => void checkDevice(d)}
          onUpdateDevice={handleUpdateDevice}
        />
      </ScrollArea>

      {/* Batch update confirm modal */}
      <ConfirmModal
        opened={batchConfirmOpen}
        onClose={() => {
          setBatchConfirmOpen(false);
          setBatchTargets([]);
        }}
        onConfirm={handleBatchConfirm}
        title={t('firmware.updateAll')}
        message={t('firmware.confirmBatchUpdate', { count: updateCount })}
        confirmLabel={t('firmware.updateNow')}
        confirmColor="blue"
        loading={anyBusy}
      />
    </Stack>
  );
}
