import { Card, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface SensorCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  alert?: boolean;
  alertColor?: string;
  extra?: ReactNode;
}

export function SensorCard({
  icon,
  label,
  value,
  alert = false,
  alertColor = 'red',
  extra,
}: SensorCardProps) {
  return (
    <Card
      withBorder
      radius="md"
      p="sm"
      bg={alert ? `${alertColor}.0` : undefined}
      style={alert ? { borderColor: `var(--mantine-color-${alertColor}-4)` } : undefined}
    >
      <Stack gap="xs">
        <Group gap="xs" align="center">
          {icon}
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </Group>
        <Text fw={700} size="lg">
          {value}
        </Text>
        {extra}
      </Stack>
    </Card>
  );
}
