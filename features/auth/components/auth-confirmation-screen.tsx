import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { AuthShell } from '@/features/auth/components/auth-shell';

export type AuthConfirmationStatus = 'pending' | 'success' | 'error';

type AuthConfirmationScreenProps = {
  status: AuthConfirmationStatus;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

const screenCopy = {
  pending: {
    eyebrow: 'SECURELY CONNECTING',
    title: 'Confirming your email',
    description:
      'We are verifying your confirmation link and restoring access to your account.',
    tone: 'info' as const,
  },
  success: {
    eyebrow: 'ALL SET',
    title: 'Email confirmed',
    description: 'Your account is verified. We will move you into the right next step.',
    tone: 'success' as const,
  },
  error: {
    eyebrow: 'ACTION NEEDED',
    title: 'Confirmation link failed',
    description:
      'The link may have expired or the redirect URL is not yet allowed in Supabase.',
    tone: 'error' as const,
  },
} as const;

export function AuthConfirmationScreen({
  status,
  message,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: AuthConfirmationScreenProps) {
  const copy = screenCopy[status];

  return (
    <AuthShell eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      <AppCard style={styles.card}>
        {status === 'pending' ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator color={Colors.primaryStrong} size="small" />
            <Text style={styles.pendingLabel}>Finishing confirmation</Text>
          </View>
        ) : null}

        <NoticeBanner message={message} tone={copy.tone} />

        {primaryActionLabel && onPrimaryAction ? (
          <AppButton title={primaryActionLabel} onPress={onPrimaryAction} />
        ) : null}

        {secondaryActionLabel && onSecondaryAction ? (
          <AppButton
            title={secondaryActionLabel}
            variant="secondary"
            onPress={onSecondaryAction}
          />
        ) : null}
      </AppCard>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  pendingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pendingLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
