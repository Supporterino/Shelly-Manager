import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ConnectionStatus } from '../../types/device';

const statusColor: Record<ConnectionStatus, string> = {
  online: 'green',
  offline: 'gray',
  connecting: 'yellow',
  error: 'red',
};

interface DeviceStatusBadgeProps {
  status: ConnectionStatus;
}

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { t } = useTranslation('common');
  return (
    <Badge color={statusColor[status]} size="sm" variant="light">
      {t(`status.${status}`)}
    </Badge>
  );
}
