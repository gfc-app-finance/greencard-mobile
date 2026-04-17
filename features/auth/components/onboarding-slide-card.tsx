import { Image } from 'expo-image';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import type { OnboardingSlide } from '@/features/auth/constants/onboarding';

type OnboardingSlideCardProps = {
  index: number;
  scrollX: Animated.Value;
  slide: OnboardingSlide;
  slideWidth: number;
};

export function OnboardingSlideCard({
  index,
  scrollX,
  slide,
  slideWidth,
}: OnboardingSlideCardProps) {
  const inputRange = [
    (index - 1) * slideWidth,
    index * slideWidth,
    (index + 1) * slideWidth,
  ];

  const visualScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });

  const visualTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [20, 0, 20],
    extrapolate: 'clamp',
  });

  const copyOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.45, 1, 0.45],
    extrapolate: 'clamp',
  });

  const copyTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [16, 0, 16],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width: slideWidth }]}>
      <Animated.View
        style={[
          styles.visualWrap,
          {
            transform: [{ scale: visualScale }, { translateY: visualTranslateY }],
          },
        ]}>
        <View style={styles.visualFrame}>
          <View style={styles.visualMeta}>
            <Text style={styles.visualEyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.visualCounter}>{`0${index + 1}`}</Text>
          </View>

          <Image contentFit="cover" source={slide.image} style={styles.image} transition={200} />

          <View style={styles.visualFooter}>
            <Text style={styles.visualFooterLabel}>{slide.accentLabel}</Text>
            <Text style={styles.visualFooterValue}>{slide.accentValue}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.copyWrap,
          {
            opacity: copyOpacity,
            transform: [{ translateY: copyTranslateY }],
          },
        ]}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    gap: Spacing.xl,
  },
  visualWrap: {
    height: 420,
    justifyContent: 'center',
  },
  visualFrame: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 36,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  visualMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  visualEyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  visualCounter: {
    color: Colors.textSubtle,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  image: {
    borderRadius: 28,
    flex: 1,
    minHeight: 0,
  },
  visualFooter: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 4,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  visualFooterLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  visualFooterValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  copyWrap: {
    gap: Spacing.md,
    paddingHorizontal: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 25,
  },
});
