import LottieView from 'lottie-react-native';
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
    outputRange: [0.92, 1, 0.92],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width: slideWidth }]}>
      <Animated.View
        style={[
          styles.visualWrap,
          {
            transform: [{ scale: visualScale }],
            opacity: opacity,
          },
        ]}
      >
        <View style={styles.shadowWrapper}>
          <View style={styles.visualFrame}>
            <View style={styles.visualMeta}>
              <Text style={styles.visualEyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.visualCounter}>{`0${index + 1}`}</Text>
            </View>

            <View style={styles.animationContainer}>
              <LottieView
                source={slide.animation}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
                speed={0.7}
              />
            </View>

            <View style={styles.visualFooter}>
              <Text style={styles.visualFooterLabel}>{slide.accentLabel}</Text>
              <Text style={styles.visualFooterValue}>{slide.accentValue}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.copyWrap}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    gap: Spacing.xl,
  },
  visualWrap: {
    height: 380,
    justifyContent: 'center',
    padding: 10,
  },
  shadowWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    shadowColor: '#107569',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 15,
  },
  visualFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 42,
    flex: 1,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  visualMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  visualEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  visualCounter: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.4,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualFooter: {
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    marginTop: Spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  visualFooterLabel: {
    color: Colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  visualFooterValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  copyWrap: {
    gap: 8,
    paddingHorizontal: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
});
