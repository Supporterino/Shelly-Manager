import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconBluetooth, IconCloud, IconPlugConnected, IconWifi } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ShellyGetStatusResult } from '../../../types/shelly';

interface Props {
  status: ShellyGetStatusResult | undefined;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge color={active ? 'green' : 'gray'} variant="light" size="sm">
      {active ? 'Connected' : 'Disconnected'}
    </Badge>
  );
}

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge color={enabled ? 'blue' : 'gray'} variant="outline" size="sm">
      {enabled ? 'Enabled' : 'Disabled'}
    </Badge>
  );
}

export function IntegrationStatusSection({ status }: Props) {
  const { t } = useTranslation('devices');

  const cloud = status?.cloud as Record<string, unknown> | undefined;
  const mqtt = status?.mqtt as Record<string, unknown> | undefined;
  const ws = status?.ws as Record<string, unknown> | undefined;
  const ble = status?.ble as Record<string, unknown> | undefined;

  const hasAny = cloud != null || mqtt != null || ws != null || ble != null;

  if (!hasAny) {
    return (
      <Stack gap="xs">
        <Text fw={600}>{t('settings.integrations.title')}</Text>
        <Text size="sm" c="dimmed">
          {t('settings.integrations.noData')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={600}>{t('settings.integrations.title')}</Text>

      <Stack gap="xs">
        {cloud != null && (
          <Card withBorder radius="md" p="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconCloud size={18} stroke={1.5} />
                <Text size="sm" fw={500}>
                  {t('settings.integrations.cloud')}
                </Text>
              </Group>
              <Group gap="xs">
                <EnabledBadge enabled={!!cloud.enabled} />
                {!!cloud.enabled && <StatusBadge active={!!cloud.connected} />}
              </Group>
            </Group>
          </Card>
        )}

        {mqtt != null && (
          <Card withBorder radius="md" p="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconWifi size={18} stroke={1.5} />
                <Text size="sm" fw={500}>
                  {t('settings.integrations.mqtt')}
                </Text>
              </Group>
              <Group gap="xs">
                <EnabledBadge enabled={!!mqtt.enabled} />
                {!!mqtt.enabled && <StatusBadge active={!!mqtt.connected} />}
              </Group>
            </Group>
          </Card>
        )}

        {ws != null && (
          <Card withBorder radius="md" p="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconPlugConnected size={18} stroke={1.5} />
                <Text size="sm" fw={500}>
                  {t('settings.integrations.ws')}
                </Text>
              </Group>
              <Group gap="xs">
                <EnabledBadge enabled={!!ws.enabled} />
                {!!ws.enabled && <StatusBadge active={!!ws.connected} />}
              </Group>
            </Group>
          </Card>
        )}

        {ble != null && (
          <Card withBorder radius="md" p="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconBluetooth size={18} stroke={1.5} />
                <Text size="sm" fw={500}>
                  {t('settings.integrations.ble')}
                </Text>
              </Group>
              <Group gap="xs">
                <EnabledBadge enabled={!!ble.enabled} />
              </Group>
            </Group>
          </Card>
        )}
      </Stack>
    </Stack>
  );
}
