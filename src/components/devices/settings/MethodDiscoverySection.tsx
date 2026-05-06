import { Accordion, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListMethods } from '../../../hooks/usePhase4Features';

interface Props {
  deviceId: string;
}

export function MethodDiscoverySection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { data, isLoading } = useListMethods(deviceId);
  const [filter, setFilter] = useState('');

  const grouped = useMemo(() => {
    if (!data?.methods) return {};
    const map: Record<string, string[]> = {};
    for (const m of data.methods) {
      const name = m.name;
      if (typeof name !== 'string') continue;
      if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
      const prefix = name.includes('.') ? name.split('.')[0] : 'Other';
      if (!map[prefix]) map[prefix] = [];
      map[prefix].push(name);
    }
    // Sort each group
    for (const key of Object.keys(map)) {
      map[key].sort();
    }
    return map;
  }, [data, filter]);

  const sortedPrefixes = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Text fw={600}>{t('settings.methods.title')}</Text>

      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder={t('settings.methods.searchPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.currentTarget.value)}
      />

      <Text size="sm" c="dimmed">
        {t('settings.methods.count', { count: data?.methods.length ?? 0 })}
      </Text>

      <Accordion variant="contained" chevronPosition="left">
        {sortedPrefixes.map((prefix) => (
          <Accordion.Item key={prefix} value={prefix}>
            <Accordion.Control>
              <Text size="sm" fw={500}>
                {prefix}
              </Text>
              <Text size="xs" c="dimmed">
                {grouped[prefix].length} method(s)
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {grouped[prefix].map((name) => (
                  <Text key={name} size="sm" ff="monospace">
                    {name}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
