import { Alert, Button, PasswordInput, Stack, Switch, Text } from '@mantine/core';
import { IconAlertCircle, IconShield } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSetAuth } from '../../../hooks/usePhase4Features';
import { useDeviceStore } from '../../../store/deviceStore';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Props {
  deviceId: string;
}

export function AuthManagementSection({ deviceId }: Props) {
  const { t } = useTranslation('devices');
  const { t: tc } = useTranslation('common');
  const device = useDeviceStore((s) => s.devices[deviceId]);
  const setAuthMutation = useSetAuth(deviceId);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const authEnabled = device?.authHa1 != null;

  const handleEnable = () => {
    setPasswordError(null);
    if (password !== confirmPassword) {
      setPasswordError(
        tc('errors.unknown').replace('An unexpected error occurred.', 'Passwords do not match'),
      );
      return;
    }
    if (password.length === 0) {
      setPasswordError('Password is required');
      return;
    }
    setShowEnableConfirm(true);
  };

  const handleDisable = () => {
    setShowDisableConfirm(true);
  };

  const doEnable = () => {
    setAuthMutation.mutate({ enabled: true, password });
    setPassword('');
    setConfirmPassword('');
    setShowEnableConfirm(false);
  };

  const doDisable = () => {
    setAuthMutation.mutate({ enabled: false });
    setShowDisableConfirm(false);
  };

  return (
    <Stack gap="md">
      <Text fw={600}>{t('settings.auth.title')}</Text>

      {!authEnabled && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
          {t('settings.auth.warnNoPassword')}
        </Alert>
      )}

      <Stack gap="xs">
        <Switch
          label={t('settings.auth.enabled')}
          checked={authEnabled}
          onChange={(e) => {
            if (e.currentTarget.checked) {
              // Will be handled by form below
            } else {
              handleDisable();
            }
          }}
        />

        {!authEnabled && (
          <>
            <PasswordInput
              label={t('settings.auth.password')}
              placeholder={t('settings.auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label={t('settings.auth.confirmPassword')}
              placeholder={t('settings.auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              error={passwordError}
            />
            <Button
              leftSection={<IconShield size={16} />}
              onClick={handleEnable}
              loading={setAuthMutation.isPending}
            >
              {t('settings.auth.enable')}
            </Button>
          </>
        )}

        {authEnabled && (
          <Button
            color="red"
            variant="light"
            onClick={handleDisable}
            loading={setAuthMutation.isPending}
          >
            {t('settings.auth.disable')}
          </Button>
        )}
      </Stack>

      <ConfirmModal
        opened={showEnableConfirm}
        onClose={() => setShowEnableConfirm(false)}
        onConfirm={doEnable}
        title={t('settings.auth.enableConfirmTitle')}
        message={t('settings.auth.enableConfirmMessage')}
        confirmColor="green"
        loading={setAuthMutation.isPending}
      />

      <ConfirmModal
        opened={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={doDisable}
        title={t('settings.auth.disableConfirmTitle')}
        message={t('settings.auth.disableConfirmMessage')}
        confirmColor="red"
        loading={setAuthMutation.isPending}
      />
    </Stack>
  );
}
