import { ActionIcon, Card, Divider, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconTool } from '@tabler/icons-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { CoverConfigPanel } from '../../components/devices/controls/CoverConfigPanel';
import { LightConfigPanel } from '../../components/devices/controls/LightConfigPanel';
import { RgbccctConfigPanel } from '../../components/devices/controls/RGBCCTConfigPanel';
import { RgbConfigPanel } from '../../components/devices/controls/RgbConfigPanel';
import { RgbwConfigPanel } from '../../components/devices/controls/RgbwConfigPanel';
import { EnergyDataPanel } from '../../components/devices/energy/EnergyDataPanel';
import { ScheduleSection } from '../../components/devices/ScheduleSection';
import { useDeviceStore } from '../../store/deviceStore';

export const Route = createFileRoute('/devices/$deviceId/config')({
  component: DeviceConfigPage,
});

function DeviceConfigPage() {
  const { deviceId } = Route.useParams();
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const device = useDeviceStore((s) => s.devices[deviceId]);

  if (!device) {
    return (
      <Stack p="md">
        <ErrorAlert message={`Device ${deviceId} not found`} />
      </Stack>
    );
  }

  const covers = device.components.filter((c) => c.type === 'cover');
  const lights = device.components.filter((c) => c.type === 'light' || c.type === 'light_cct');
  const rgbs = device.components.filter((c) => c.type === 'rgb');
  const rgbws = device.components.filter((c) => c.type === 'rgbw');
  const rgbcccts = device.components.filter((c) => c.type === 'rgbcct');
  const ems = device.components.filter((c) => c.type === 'em');
  const em1s = device.components.filter((c) => c.type === 'em1');
  const pm1s = device.components.filter((c) => c.type === 'pm1');

  return (
    <ScrollArea h="100%">
      <Stack gap="md" p="md">
        <Group gap="xs" align="center" wrap="nowrap">
          <Link to="/devices/$deviceId" params={{ deviceId }}>
            <ActionIcon variant="subtle" size="lg" aria-label={tc('actions.back')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Link>
          <Title order={3}>{device.name}</Title>
        </Group>

        <Text fw={600} size="sm">
          <IconTool size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {t('config.pageTitle')}
        </Text>

        <Divider />

        {/* Schedules */}
        <Card withBorder shadow="sm" radius="md">
          <ScheduleSection device={device} />
        </Card>

        {/* Cover configs */}
        {covers.map((c) => (
          <Card key={`cover:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.cover')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <CoverConfigPanel deviceId={deviceId} coverId={c.id} />
          </Card>
        ))}

        {/* Light configs */}
        {lights.map((c) => (
          <Card key={`light:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.dimmer')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <LightConfigPanel deviceId={deviceId} lightId={c.id} />
          </Card>
        ))}

        {/* RGB configs */}
        {rgbs.map((c) => (
          <Card key={`rgb:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.rgb')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <RgbConfigPanel deviceId={deviceId} rgbId={c.id} />
          </Card>
        ))}

        {/* RGBW configs */}
        {rgbws.map((c) => (
          <Card key={`rgbw:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.rgbw')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <RgbwConfigPanel deviceId={deviceId} rgbwId={c.id} />
          </Card>
        ))}

        {/* RGBCCT configs */}
        {rgbcccts.map((c) => (
          <Card key={`rgbcct:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.rgbcct')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <RgbccctConfigPanel deviceId={deviceId} rgbccctId={c.id} />
          </Card>
        ))}

        {/* Energy data */}
        {ems.map((c) => (
          <Card key={`em:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.energy')} – {t('power.phaseA')} / {t('power.phaseB')}
            </Text>
            <EnergyDataPanel deviceId={deviceId} componentId={c.id} type="em" />
          </Card>
        ))}
        {em1s.map((c) => (
          <Card key={`em1:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.energy')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <EnergyDataPanel deviceId={deviceId} componentId={c.id} type="em1" />
          </Card>
        ))}
        {pm1s.map((c) => (
          <Card key={`pm1:${c.id}`} withBorder shadow="sm" radius="md">
            <Text fw={600} size="sm" mb="sm">
              {t('types.energy')} – {c.name ?? t('controls.channel', { n: c.id + 1 })}
            </Text>
            <EnergyDataPanel deviceId={deviceId} componentId={c.id} type="pm1" />
          </Card>
        ))}
      </Stack>
    </ScrollArea>
  );
}
