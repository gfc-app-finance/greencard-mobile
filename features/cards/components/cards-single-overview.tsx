import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import {
  canCreateVirtualCard,
  canFundVirtualCard,
  canManageVirtualCard,
} from '@/features/cards/card-access';
import { canToggleManagedCardFreeze } from '@/features/cards/card-status';
import { CardEmptyState } from '@/features/cards/components/card-empty-state';
import { ManagedVirtualCard } from '@/features/cards/components/managed-virtual-card';
import { VerificationBannerCard } from '@/features/verification/components/verification-banner-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';

export function CardsSingleOverview() {
  const router = useRouter();
  const { cards, createCard, toggleCardFrozen } = useGoovaAppState();
  const { access, guardFeatureAction, profile } = useVerification();
  const [notice, setNotice] = useState<{
    tone: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  const primaryCard = cards.find((card) => card.status !== 'terminated') ?? null;
  const hasCard = Boolean(primaryCard && primaryCard.status !== 'terminated');
  const canCreateCard = canCreateVirtualCard(access);
  const canFundCard = canFundVirtualCard(access, primaryCard);
  const canManageCard = canManageVirtualCard(access, primaryCard);
  const canToggleFreeze = primaryCard
    ? canToggleManagedCardFreeze(primaryCard.status)
    : false;

  function handleCreateCard() {
    guardFeatureAction('create_virtual_card', () => {
      const createdCard = createCard();

      if (!createdCard) {
        setNotice({
          tone: 'info',
          message:
            'Your Virtual Card already exists, so there is nothing else to create.',
        });
        return;
      }

      setNotice({
        tone: 'success',
        message:
          createdCard.status === 'pending'
            ? 'Your Virtual Card is being prepared. You can manage it here once setup completes.'
            : 'Your Virtual Card is ready to manage.',
      });
    });
  }

  function handleToggleFreeze() {
    if (!primaryCard) {
      return;
    }

    guardFeatureAction('create_virtual_card', () => {
      const updatedCard = toggleCardFrozen(primaryCard.id);

      if (!updatedCard) {
        setNotice({
          tone: 'info',
          message: 'This card cannot be frozen or unfrozen right now.',
        });
        return;
      }

      setNotice({
        tone: 'success',
        message:
          updatedCard.status === 'frozen'
            ? 'Your foreign card is frozen. Online spend is paused until you unfreeze it.'
            : 'Your foreign card is active again and ready for international online spend.',
      });
    });
  }

  function handleOpenCardSettings() {
    guardFeatureAction('create_virtual_card', () => {
      setNotice({
        tone: 'info',
        message:
          'Card settings will include merchant controls and security preferences as backend wiring is added.',
      });
    });
  }

  return (
    <AppScreen scrollable={false}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/home' as never)} style={styles.closeButton}>
            <Feather color={Colors.text} name="x" size={24} />
          </Pressable>
        </View>

        <Text style={styles.title}>Cards</Text>

        <View style={styles.content}>
          {!canCreateCard && !hasCard ? (
            <VerificationBannerCard
              onVerifyPress={() =>
                router.push(getVerificationJourneyRoute(profile) as never)
              }
              profile={profile}
            />
          ) : null}

          {notice ? <NoticeBanner message={notice.message} tone={notice.tone} /> : null}

          {!hasCard ? (
            <View style={styles.emptyStateWrap}>
              <CardEmptyState
                actionLabel="Create your card"
                description={
                  canCreateCard
                    ? 'Greencard gives you one virtual card for international online payments, with clean controls, a spend limit, and support for your foreign balances.'
                    : 'Complete verification before creating your one GCF virtual card for foreign online payments.'
                }
                eyebrow={canCreateCard ? 'ONE GCF CARD' : 'VERIFICATION REQUIRED'}
                onCreate={handleCreateCard}
                showAction
                title={
                  canCreateCard
                    ? 'Create your foreign virtual card'
                    : 'Virtual card access requires verification'
                }
              />
            </View>
          ) : primaryCard ? (
            <>
              <ManagedVirtualCard card={primaryCard} />

              <AppCard style={styles.metaCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Funding source</Text>
                  <Text style={styles.metaValue}>
                    {canFundCard
                      ? primaryCard.fundingSourceLabel
                      : 'Complete verification to fund this card'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Spend limit</Text>
                  <Text style={styles.metaValue}>{primaryCard.spendLimit}</Text>
                </View>
              </AppCard>

              <Pressable
                onPress={handleOpenCardSettings}
                style={[
                  styles.settingsRow,
                  !canManageCard ? styles.settingsRowLocked : null,
                ]}>
                <View style={styles.settingsIcon}>
                  <Feather color={Colors.textMuted} name="settings" size={18} />
                </View>
                <Text style={styles.settingsText}>Card settings</Text>
                <Feather color={Colors.textSubtle} name="chevron-right" size={18} />
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          {hasCard ? (
            <AppButton
              disabled={!canToggleFreeze}
              onPress={handleToggleFreeze}
              title={
                primaryCard?.status === 'pending'
                  ? 'Card setup in progress'
                  : primaryCard?.status === 'frozen'
                    ? 'Unfreeze card'
                    : 'Freeze card'
              }
              variant={primaryCard?.status === 'frozen' ? 'primary' : 'secondary'}
            />
          ) : null}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: Spacing.lg,
  },
  headerRow: {
    alignItems: 'flex-start',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.screenTitle.lineHeight,
  },
  content: {
    gap: Spacing.lg,
  },
  emptyStateWrap: {
    marginTop: Spacing.md,
  },
  metaCard: {
    gap: Spacing.sm,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  metaValue: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  settingsRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  settingsRowLocked: {
    opacity: 0.78,
  },
  settingsIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingsText: {
    color: Colors.textMuted,
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  footer: {
    marginTop: 'auto',
  },
});
