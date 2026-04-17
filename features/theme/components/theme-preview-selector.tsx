import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppStatusChip } from '@/components/ui/app-status-chip';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useThemePreview } from '@/features/theme/providers/theme-preview-provider';

export function ThemePreviewSelector() {
  const { activeThemeId, options, setActiveThemeId } = useThemePreview();

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>THEME PREVIEW</Text>
        <Text style={styles.title}>Compare color directions</Text>
        <Text style={styles.description}>
          Tap a palette to preview how the app feels with different accents and surfaces.
        </Text>
      </View>

      <View style={styles.list}>
        {options.map((option) => {
          const isActive = option.id === activeThemeId;

          return (
            <Pressable
              key={option.id}
              onPress={() => setActiveThemeId(option.id)}
              style={[styles.optionCard, isActive ? styles.optionCardActive : null]}>
              <View style={styles.optionTopRow}>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>

                {isActive ? <AppStatusChip label="Active" tone="success" /> : null}
              </View>

              <View style={styles.swatchRow}>
                {option.swatches.map((swatch) => (
                  <View key={swatch} style={[styles.swatch, { backgroundColor: swatch }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    gap: 4,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: Spacing.sm,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  optionCardActive: {
    borderColor: Colors.primaryStrong,
    shadowColor: Colors.primaryStrong,
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  optionTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  optionDescription: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swatch: {
    borderRadius: Radius.full,
    height: 22,
    width: 22,
  },
});
