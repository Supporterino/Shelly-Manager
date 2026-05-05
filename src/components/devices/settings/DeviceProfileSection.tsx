import { Badge, Group, Loader, Select, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useListProfiles,
  useScheduleListForCount,
  useSetProfile,
  useWebhookList,
} from '../../../hooks/useDeviceSettings';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  deviceId: string;
}

export function DeviceProfileSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { data: profileData, isLoading: profilesLoading } = useListProfiles(deviceId);
  const { data: webhookData } = useWebhookList(deviceId);
  const { data: scheduleData } = useScheduleListForCount(deviceId);
  const mutation = useSetProfile(deviceId);

  const [selectedProfile, setSelectedProfile] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const profiles = profileData?.profiles ?? [];
  const currentProfile = profiles.find((p) => p.current);
  const webhookCount = webhookData?.hooks.length ?? 0;
  const scheduleCount = scheduleData?.jobs.length ?? 0;

  const handleSwitch = () => {
    if (!selectedProfile) return;
    mutation.mutate(selectedProfile, { onSuccess: () => setConfirmOpen(false) });
  };

  const profileOptions = profiles
    .filter((p): p is typeof p & { name: string } => typeof p.name === 'string')
    .map((p) => ({
      value: p.name,
      label: p.name,
    }));

  if (profilesLoading) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <Text fw={600}>{t('settings.profile.title')}</Text>
        {currentProfile && (
          <Badge variant="light" color="blue">
            {t('settings.profile.current', { profile: currentProfile.name })}
          </Badge>
        )}
      </Group>

      <Select
        label={t('settings.profile.switchTo')}
        value={selectedProfile}
        onChange={(v) => {
          if (v && v !== currentProfile?.name) {
            setSelectedProfile(v);
            setConfirmOpen(true);
          }
        }}
        data={profileOptions}
        placeholder={t('settings.profile.selectProfile')}
      />

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSwitch}
        title={t('settings.profile.confirmTitle')}
        message={t('settings.profile.confirmMessage', {
          webhooks: webhookCount,
          schedules: scheduleCount,
        })}
        confirmColor="yellow"
        loading={mutation.isPending}
      />
    </Stack>
  );
}
