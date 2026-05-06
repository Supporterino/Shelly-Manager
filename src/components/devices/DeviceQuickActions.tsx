import { ActionIcon, Button, Group, Menu, Tooltip } from '@mantine/core';
import {
  IconCode,
  IconDatabase,
  IconDots,
  IconTool,
  IconWebhook,
} from '@tabler/icons-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useListMethods } from '../../hooks/usePhase4Features';

interface Props {
  deviceId: string;
}

export function DeviceQuickActions({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const navigate = useNavigate();
  const { data: methodsData } = useListMethods(deviceId);
  const methodNames = methodsData?.methods.map((m) => m.name) ?? [];
  const hasWebhooks = methodNames.some((n) => n?.startsWith('Webhook.'));
  const hasKVS = methodNames.some((n) => n?.startsWith('KVS.'));
  const hasScripts = methodNames.some((n) => n?.startsWith('Script.'));
  const hasAutomation = hasWebhooks || hasKVS || hasScripts;

  return (
    <Group gap="xs">
      {/* Config — always visible, primary action */}
      <Tooltip label={t('config.pageTitle')}>
        <Link to="/devices/$deviceId/config" params={{ deviceId }}>
          <ActionIcon
            variant="light"
            size="lg"
            hiddenFrom="sm"
            aria-label={t('config.pageTitle')}
          >
            <IconTool size={18} />
          </ActionIcon>
        </Link>
      </Tooltip>

      <Link to="/devices/$deviceId/config" params={{ deviceId }}>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconTool size={14} />}
          visibleFrom="sm"
        >
          {t('config.pageTitle')}
        </Button>
      </Link>

      {/* Automation menu — mobile */}
      {hasAutomation && (
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <Tooltip label={t('automation.title')}>
              <ActionIcon
                variant="light"
                size="lg"
                hiddenFrom="sm"
                aria-label={t('automation.title')}
              >
                <IconDots size={18} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {hasWebhooks && (
              <Menu.Item
                leftSection={<IconWebhook size={16} />}
                onClick={() =>
                  void navigate({
                    to: '/devices/$deviceId/webhooks',
                    params: { deviceId },
                  })
                }
              >
                {t('webhooks.title')}
              </Menu.Item>
            )}
            {hasKVS && (
              <Menu.Item
                leftSection={<IconDatabase size={16} />}
                onClick={() =>
                  void navigate({
                    to: '/devices/$deviceId/kvs',
                    params: { deviceId },
                  })
                }
              >
                {t('kvs.shortTitle')}
              </Menu.Item>
            )}
            {hasScripts && (
              <Menu.Item
                leftSection={<IconCode size={16} />}
                onClick={() =>
                  void navigate({
                    to: '/devices/$deviceId/scripts',
                    params: { deviceId },
                  })
                }
              >
                {t('scripts.title')}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      )}

      {/* Automation buttons — desktop */}
      {hasWebhooks && (
        <Link to="/devices/$deviceId/webhooks" params={{ deviceId }}>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconWebhook size={14} />}
            visibleFrom="sm"
          >
            {t('webhooks.title')}
          </Button>
        </Link>
      )}
      {hasKVS && (
        <Link to="/devices/$deviceId/kvs" params={{ deviceId }}>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconDatabase size={14} />}
            visibleFrom="sm"
          >
            {t('kvs.shortTitle')}
          </Button>
        </Link>
      )}
      {hasScripts && (
        <Link to="/devices/$deviceId/scripts" params={{ deviceId }}>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconCode size={14} />}
            visibleFrom="sm"
          >
            {t('scripts.title')}
          </Button>
        </Link>
      )}
    </Group>
  );
}
