export { CardsSingleOverview as CardsOverview } from './cards-single-overview';

/*
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { canToggleManagedCardFreeze } from '@/features/cards/card-status';
import { CardActivityList } from '@/features/cards/components/card-activity-list';
import {
  CardDetailPanel,
  type CardDetailMode,
} from '@/features/cards/components/card-detail-panel';
import { CardEmptyState } from '@/features/cards/components/card-empty-state';
import { CardSummaryCard } from '@/features/cards/components/card-summary-card';
import { ManagedVirtualCard } from '@/features/cards/components/managed-virtual-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { VerificationBannerCard } from '@/features/verification/components/verification-banner-card';
import { useVerification } from '@/hooks/use-verification';

export function CardsOverview() {
  const router = useRouter();
  const { cards, createCard, toggleCardFrozen } = useGoovaAppState();
  const { access, guardFeatureAction, profile } = useVerification();

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        {!access.canCreateCard ? (
          <VerificationBannerCard
            onVerifyPress={() =>
              router.push(getVerificationJourneyRoute(profile) as never)
            }
            profile={profile}
          />
        ) : null}

        <AppCard style={styles.heroCard}>
          <View style={styles.heroActions}>
            <AppButton
              onPress={() =>
                guardFeatureAction('create_virtual_card', () => {
                  createCard();
                })
              }
              title="Create card"
            />
            <AppButton title="Card settings" variant="secondary" />
          </View>
        </AppCard>

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active cards</Text>
            <Text style={styles.summaryValue}>{cards.filter((card) => !card.frozen).length}</Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Frozen cards</Text>
            <Text style={styles.summaryValue}>{cards.filter((card) => card.frozen).length}</Text>
          </AppCard>
        </View>

        <View style={styles.cardsList}>
          {cards.map((card) => (
            <AppCard key={card.id} style={styles.cardItem}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardType}>{`${card.type} · ${card.network}`}</Text>
                  <Text style={styles.cardName}>{card.name}</Text>
                </View>

                <View style={[styles.statusBadge, card.frozen ? styles.statusBadgeMuted : null]}>
                  <Text style={styles.statusText}>{card.frozen ? 'Frozen' : 'Active'}</Text>
                </View>
              </View>

              <View style={styles.cardVisual}>
                <View>
                  <Text style={styles.cardCurrency}>{card.currency}</Text>
                  <Text style={styles.cardDigits}>{`•••• ${card.last4}`}</Text>
                </View>

                <Feather color="rgba(255, 255, 255, 0.84)" name="credit-card" size={24} />
              </View>

              <View style={styles.cardMetaRow}>
                <Text style={styles.metaLabel}>Spend limit</Text>
                <Text style={styles.metaValue}>{card.spendLimit}</Text>
              </View>

              <View style={styles.cardActionRow}>
                <AppButton
                  containerStyle={styles.flexButton}
                  onPress={() =>
                    guardFeatureAction('create_virtual_card', () => {
                      toggleCardFrozen(card.id);
                    })
                  }
                  title={card.frozen ? 'Unfreeze card' : 'Freeze card'}
                  variant="secondary"
                />

                <Pressable
                  onPress={() => guardFeatureAction('create_virtual_card', () => undefined)}
                  style={styles.iconButton}>
                  <Feather color={Colors.text} name="more-horizontal" size={22} />
                </Pressable>
              </View>
            </AppCard>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  heroActions: {
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceSecondary,
    flex: 1,
    gap: 6,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  cardsList: {
    gap: Spacing.md,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardType: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  cardName: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(43, 182, 115, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  statusBadgeMuted: {
    backgroundColor: 'rgba(147, 161, 170, 0.12)',
  },
  statusText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  cardVisual: {
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 132,
    padding: Spacing.lg,
  },
  cardCurrency: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  cardDigits: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: Spacing.md,
  },
  cardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  metaValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  cardActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
});
*/
