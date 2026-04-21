import { Animated, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';

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
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.2, 1, 0.2],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                opacity,
                width,
                backgroundColor: Colors.primaryStrong,
              },
            ]}
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
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  dot: {
    borderRadius: Radius.full,
    height: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
