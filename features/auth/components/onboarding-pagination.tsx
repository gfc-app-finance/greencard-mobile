import { Animated, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type OnboardingPaginationProps = {
  count: number;
  scrollX: Animated.Value;
  slideWidth: number;
};

export function OnboardingPagination({
  count,
  scrollX,
  slideWidth,
}: OnboardingPaginationProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => {
        const inputRange = [
          (index - 1) * slideWidth,
          index * slideWidth,
          (index + 1) * slideWidth,
        ];

        const width = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: 'clamp',
        });

        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [
            'rgba(148, 163, 184, 0.22)',
            Colors.primaryStrong,
            'rgba(148, 163, 184, 0.22)',
          ],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`dot-${index}`}
            style={[styles.dot, { backgroundColor, opacity, width }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: Radius.full,
    height: 8,
  },
});
