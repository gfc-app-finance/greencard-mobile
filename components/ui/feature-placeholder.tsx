import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type FeaturePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  topSlot?: ReactNode;
};

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  highlights,
  topSlot,
}: FeaturePlaceholderProps) {
  return (
    <AppScreen>
      {topSlot}

      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.grid}>
        {highlights.map((highlight, index) => (
          <AppCard key={highlight} style={styles.highlightCard}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>0{index + 1}</Text>
            </View>
            <Text style={styles.highlightText}>{highlight}</Text>
          </AppCard>
        ))}
      </View>

      <AppCard>
        <Text style={styles.cardLabel}>MVP placeholder</Text>
        <Text style={styles.cardTitle}>
          This tab is ready for its next feature slice without changing the navigation shell.
        </Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: Spacing.md,
  },
  highlightCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  indexBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  indexText: {
    color: Colors.primaryStrong,
    fontWeight: '700',
  },
  highlightText: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  cardLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
});
