import {
  Container,
  Divider,
  Group,
  ScrollArea,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClearAllDevicesButton } from '../components/settings/ClearAllDevicesButton';
import { LanguageSelect } from '../components/settings/LanguageSelect';
import { useAppStore } from '../store/appStore';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation('settings');
  const { setColorScheme } = useMantineColorScheme();
  const preferences = useAppStore((s) => s.preferences);
  const setTheme = useAppStore((s) => s.setTheme);
  const setPollingInterval = useAppStore((s) => s.setPollingInterval);
  const setTemperatureUnit = useAppStore((s) => s.setTemperatureUnit);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion('—'));
  }, []);

  const handleThemeChange = (value: string) => {
    const theme = value as 'light' | 'dark' | 'system';
    void setTheme(theme);
    if (theme === 'system') {
      setColorScheme('auto');
    } else {
      setColorScheme(theme);
    }
  };

  return (
    <ScrollArea h="100%">
      <Container size="md">
        <Stack gap="lg" p="md">
          <Title order={2}>{t('title')}</Title>

          {/* Appearance */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">
              {t('sections.appearance')}
            </Text>
            <Group justify="space-between" align="center">
              <Text>{t('theme.label')}</Text>
              <SegmentedControl
                value={preferences.theme}
                onChange={handleThemeChange}
                data={[
                  { label: t('theme.light'), value: 'light' },
                  { label: t('theme.dark'), value: 'dark' },
                  { label: t('theme.system'), value: 'system' },
                ]}
                size="sm"
              />
            </Group>
            <Group justify="space-between" align="center">
              <Text>{t('temperatureUnit.label')}</Text>
              <SegmentedControl
                value={preferences.temperatureUnit}
                onChange={(v) => void setTemperatureUnit(v as 'C' | 'F')}
                data={[
                  { label: t('temperatureUnit.celsius'), value: 'C' },
                  { label: t('temperatureUnit.fahrenheit'), value: 'F' },
                ]}
                size="sm"
              />
            </Group>
          </Stack>

          <Divider />

          {/* Language */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">
              {t('sections.language')}
            </Text>
            <Group justify="space-between" align="center">
              <Text>{t('language.label')}</Text>
              <LanguageSelect />
            </Group>
          </Stack>

          <Divider />

          {/* Polling */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">
              {t('polling.label')}
            </Text>
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {t('polling.seconds', { count: preferences.pollingInterval })}
              </Text>
            </Group>
            <Slider
              value={preferences.pollingInterval}
              onChange={(v) => void setPollingInterval(v)}
              min={10}
              max={120}
              step={5}
              marks={[
                { value: 10, label: '10s' },
                { value: 60, label: '60s' },
                { value: 120, label: '120s' },
              ]}
              mb="xs"
            />
          </Stack>

          <Divider />

          {/* Devices */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">
              {t('sections.devices')}
            </Text>
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text size="sm">{t('devices.clearAll')}</Text>
                <Text size="xs" c="dimmed">
                  {t('devices.clearAllDescription')}
                </Text>
              </Stack>
              <ClearAllDevicesButton />
            </Group>
          </Stack>

          <Divider />

          {/* About */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">
              {t('sections.about')}
            </Text>
            <Group justify="space-between">
              <Text size="sm">{t('about.version')}</Text>
              <Text size="sm" c="dimmed">
                {appVersion}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">{t('about.license')}</Text>
              <Text size="sm" c="dimmed">
                MIT
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Container>
    </ScrollArea>
  );
}
