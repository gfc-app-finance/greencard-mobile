import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useCurrentUserQuery } from '@/features/auth/hooks/use-auth';
import { VerificationProgressCard } from '@/features/verification/components/verification-progress-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useSession } from '@/hooks/use-session';
import { useVerification } from '@/hooks/use-verification';
import { hasSupabaseEnv } from '@/lib/env';
import { toErrorMessage } from '@/lib/errors';
import { getUserDisplayName, getUserInitials } from '@/lib/user';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user: sessionUser } = useSession();
  const { access, profile } = useVerification();
  const currentUserQuery = useCurrentUserQuery(Boolean(sessionUser));
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutErrorMessage, setSignOutErrorMessage] = useState<string | null>(null);
  const user = currentUserQuery.data ?? sessionUser;
  const fullName = getUserDisplayName(user);
  const email = user?.email ?? 'No email loaded';
  const shortUserId = user?.id ? `${user.id.slice(0, 8)}...` : 'Pending';

  async function handleSignOutPress() {
    setSignOutErrorMessage(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setSignOutErrorMessage(
        toErrorMessage(error, 'Unable to sign out right now.')
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.screen}>
        <AppCard style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{user ? 'Authenticated' : 'Loading'}</Text>
            </View>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaLabel}>Customer ID</Text>
              <Text style={styles.heroMetaValue}>{shortUserId}</Text>
            </View>

            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaLabel}>Environment</Text>
              <Text style={styles.heroMetaValue}>{hasSupabaseEnv ? 'Configured' : 'Missing keys'}</Text>
            </View>
          </View>
        </AppCard>

        {signOutErrorMessage ? (
          <NoticeBanner
            message={signOutErrorMessage}
            tone="error"
          />
        ) : null}

        <AppCard style={styles.card}>
          <Text style={styles.cardLabel}>ACCOUNT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Full name</Text>
            <Text style={styles.rowValue}>{fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Session state</Text>
            <Text style={styles.rowValue}>{user ? 'Active session' : 'Loading'}</Text>
          </View>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.cardLabel}>SECURITY</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sign-in provider</Text>
            <Text style={styles.rowValue}>Email and password</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Protected routes</Text>
            <Text style={styles.rowValue}>Enabled</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Data sync</Text>
            <Text style={styles.rowValue}>React Query active</Text>
          </View>
        </AppCard>

        <VerificationProgressCard profile={profile} />

        <View style={styles.actions}>
          <AppButton
            title="Log out"
            variant="secondary"
            loading={isSigningOut}
            onPress={handleSignOutPress}
          />

          {!access.isVerified ? (
            <AppButton
              onPress={() => router.push(getVerificationJourneyRoute(profile) as never)}
              title={access.needsProfileCompletion ? 'Complete profile' : 'Complete verification'}
            />
          ) : (
            <AppButton
              onPress={() => router.push('/verification' as never)}
              title="View verification"
              variant="secondary"
            />
          )}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: Spacing.md,
  },
  screen: {
    gap: Spacing.lg,
  },
  actions: {
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.16)',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  statusText: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  name: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  email: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroMetaPill: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: Spacing.md,
  },
  heroMetaLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroMetaValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    gap: Spacing.md,
  },
  cardLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  rowValue: {
    color: Colors.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
