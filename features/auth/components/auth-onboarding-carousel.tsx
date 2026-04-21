import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/theme';
import { AuthEntryShell } from '@/features/auth/components/auth-entry-shell';
import { OnboardingPagination } from '@/features/auth/components/onboarding-pagination';
import { OnboardingSlideCard } from '@/features/auth/components/onboarding-slide-card';
import { onboardingSlides } from '@/features/auth/constants/onboarding';
import { useOnboarding } from '@/hooks/use-onboarding';

export function AuthOnboardingCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { markOnboardingSeen } = useOnboarding();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideWidth = Math.max(width - Layout.screenPadding * 2, 1);
  const lastIndex = onboardingSlides.length - 1;
  const isFinalSlide = currentIndex === lastIndex;

  useEffect(() => {
    if (currentIndex === lastIndex) {
      void markOnboardingSeen();
    }
  }, [currentIndex, lastIndex, markOnboardingSeen]);

  function updateIndex(nextIndex: number) {
    const boundedIndex = Math.min(lastIndex, Math.max(0, nextIndex));
    setCurrentIndex(boundedIndex);
  }

  function scrollToIndex(nextIndex: number) {
    const boundedIndex = Math.min(lastIndex, Math.max(0, nextIndex));
    scrollViewRef.current?.scrollTo({ x: boundedIndex * slideWidth, animated: true });
    updateIndex(boundedIndex);
  }

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    updateIndex(nextIndex);
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex > lastIndex) return;
    if (nextIndex === lastIndex) {
      void markOnboardingSeen();
    }
    scrollToIndex(nextIndex);
  }

  function handleSkip() {
    void markOnboardingSeen();
    scrollToIndex(lastIndex);
  }

  async function handleAuthRoute(href: '/signup' | '/login') {
    router.push(href as any);
  }

  return (
    <AuthEntryShell contentContainerStyle={styles.shellContent} scrollable={false}>
      <View style={styles.header}>
        <View />
        {!isFinalSlide ? (
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipLink, pressed && styles.pressed]}
          >
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipSpacer} />
        )}
      </View>

      <View style={styles.carouselWrap}>
        <Animated.ScrollView
          ref={scrollViewRef}
          bounces={false}
          decelerationRate="fast"
          horizontal
          key={slideWidth}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          overScrollMode="never"
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={slideWidth}
        >
          {onboardingSlides.map((slide, index) => (
            <OnboardingSlideCard
              key={slide.id}
              index={index}
              scrollX={scrollX}
              slide={slide}
              slideWidth={slideWidth}
            />
          ))}
        </Animated.ScrollView>
      </View>

      <View style={styles.footer}>
        <OnboardingPagination
          count={onboardingSlides.length}
          scrollX={scrollX}
          slideWidth={slideWidth}
        />

        <Text style={styles.helperText}>
          {isFinalSlide
            ? 'Choose how you want to start with Greencard.'
            : 'Swipe across or continue to explore the flow.'}
        </Text>

        {isFinalSlide ? (
          <View style={styles.ctaGroup}>
            <AppButton
              title="Create account"
              onPress={() => handleAuthRoute('/signup')}
            />
            <AppButton
              title="Log in"
              variant="secondary"
              onPress={() => handleAuthRoute('/login')}
            />
          </View>
        ) : (
          <AppButton title="Next" onPress={handleNext} />
        )}
      </View>
    </AuthEntryShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    gap: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  skipLink: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  skipLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipSpacer: {
    width: 44,
  },
  carouselWrap: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    gap: Spacing.md,
  },
  helperText: {
    color: Colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
  ctaGroup: {
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
