import {
  ActionIcon,
  Button,
  Center,
  Group,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconRefresh, IconSearch } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceGrid } from '../components/devices/DeviceGrid';
import { useAppStore } from '../store/appStore';
import { useDeviceStore } from '../store/deviceStore';
import { useWsStatusStore } from '../store/wsStatusStore';
import type { DeviceType, StoredDevice } from '../types/device';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

type StatusFilter = 'all' | 'online' | 'offline';
type TypeFilter = 'all' | DeviceType;
type SortKey = 'name' | 'status' | 'lastSeen';

function DashboardPage() {
  const { t } = useTranslation('common');
  const { t: tDiscovery } = useTranslation('discovery');
  const { t: tDevices } = useTranslation('devices');
  const devicesRecord = useDeviceStore((s) => s.devices);
  const devices = useMemo(() => Object.values(devicesRecord), [devicesRecord]);
  const locale = useAppStore((s) => s.preferences.locale || 'en');
  const wsConnected = useWsStatusStore((s) => s.connected);
  const httpConnected = useWsStatusStore((s) => s.httpConnected);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: ['device'] });
  }

  const filtered = useMemo(() => {
    let result = devices as StoredDevice[];

    // Search by name or IP
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q) || d.ip.includes(q));
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((d) => {
        const isOnline = wsConnected[d.id] || httpConnected[d.id];
        return statusFilter === 'online' ? isOnline : !isOnline;
      });
    }

    // Device type filter
    if (typeFilter !== 'all') {
      result = result.filter((d) => d.type.toLowerCase() === typeFilter.toLowerCase());
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'lastSeen') return b.lastSeenAt - a.lastSeenAt;
      if (sortKey === 'status') {
        const aOn = wsConnected[a.id] || httpConnected[a.id] ? 1 : 0;
        const bOn = wsConnected[b.id] || httpConnected[b.id] ? 1 : 0;
        return bOn - aOn;
      }
      return 0;
    });

    return result;
  }, [devices, search, statusFilter, typeFilter, sortKey, wsConnected, httpConnected]);

  if (devices.length === 0) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Title order={3} c="dimmed">
            {t('appName')}
          </Title>
          <Text c="dimmed">{tDiscovery('noDevicesFound')}</Text>
          <Button component={Link} to="/discover" leftSection={<IconPlus size={16} />}>
            {tDiscovery('addSelected')}
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md" h="100%" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <Group justify="space-between" align="center">
        <Title order={2}>{t('appName')}</Title>
        <Group gap="xs">
          <Tooltip label={t('actions.refresh')}>
            <ActionIcon
              variant="light"
              size="lg"
              aria-label={t('actions.refresh')}
              onClick={() => void handleRefresh()}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={tDiscovery('addSelected')}>
            <ActionIcon
              component={Link}
              to="/discover"
              variant="light"
              size="lg"
              aria-label={tDiscovery('addSelected')}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Filter / sort toolbar */}
      <Stack gap="sm" hiddenFrom="sm">
        <TextInput
          placeholder={t('filter.searchPlaceholder')}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="sm"
        />
        <Group gap="sm" wrap="nowrap" justify="space-between">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
            size="sm"
            data={[
              { value: 'all', label: t('filter.all') },
              { value: 'online', label: t('filter.online') },
              { value: 'offline', label: t('filter.offline') },
            ]}
            allowDeselect={false}
          />
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as TypeFilter) ?? 'all')}
            size="sm"
            data={[
              { value: 'all', label: tDevices('filter.allTypes') },
              { value: 'switch', label: tDevices('types.switch') },
              { value: 'dimmer', label: tDevices('types.dimmer') },
              { value: 'cct', label: tDevices('types.cct') },
              { value: 'rgb', label: tDevices('types.rgb') },
              { value: 'rgbw', label: tDevices('types.rgbw') },
              { value: 'rgbcct', label: tDevices('types.rgbcct') },
              { value: 'cover', label: tDevices('types.cover') },
              { value: 'sensor', label: tDevices('types.sensor') },
              { value: 'energy', label: tDevices('types.energy') },
              { value: 'input', label: tDevices('types.input') },
            ]}
            allowDeselect={false}
          />
          <Select
            data={[
              { value: 'name', label: t('sort.name') },
              { value: 'status', label: t('sort.status') },
              { value: 'lastSeen', label: t('sort.lastSeen') },
            ]}
            value={sortKey}
            onChange={(v) => setSortKey((v as SortKey) ?? 'name')}
            allowDeselect={false}
            size="sm"
            w={130}
          />
        </Group>
      </Stack>
      <Group gap="sm" wrap="wrap" visibleFrom="sm">
        <TextInput
          placeholder={t('filter.searchPlaceholder')}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="sm"
          style={{ flex: 1, minWidth: 180 }}
        />
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }} justify="space-between">
          <SegmentedControl
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            size="sm"
            data={[
              { value: 'all', label: t('filter.all') },
              { value: 'online', label: t('filter.online') },
              { value: 'offline', label: t('filter.offline') },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as TypeFilter) ?? 'all')}
            size="sm"
            data={[
              { value: 'all', label: tDevices('filter.allTypes') },
              { value: 'switch', label: tDevices('types.switch') },
              { value: 'dimmer', label: tDevices('types.dimmer') },
              { value: 'cct', label: tDevices('types.cct') },
              { value: 'rgb', label: tDevices('types.rgb') },
              { value: 'rgbw', label: tDevices('types.rgbw') },
              { value: 'rgbcct', label: tDevices('types.rgbcct') },
              { value: 'cover', label: tDevices('types.cover') },
              { value: 'sensor', label: tDevices('types.sensor') },
              { value: 'energy', label: tDevices('types.energy') },
              { value: 'input', label: tDevices('types.input') },
            ]}
            allowDeselect={false}
          />
          <Select
            data={[
              { value: 'name', label: t('sort.name') },
              { value: 'status', label: t('sort.status') },
              { value: 'lastSeen', label: t('sort.lastSeen') },
            ]}
            value={sortKey}
            onChange={(v) => setSortKey((v as SortKey) ?? 'name')}
            allowDeselect={false}
            size="sm"
            w={130}
          />
        </Group>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <DeviceGrid devices={filtered} locale={locale} />
      </ScrollArea>
    </Stack>
  );
}
