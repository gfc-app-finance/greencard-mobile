import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';

type AccountCarouselPaginationProps = {
  count: number;
  activeIndex: number;
};

export function AccountCarouselPagination({
  count,
  activeIndex,
}: AccountCarouselPaginationProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[styles.dot, index === activeIndex ? styles.activeDot : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: 'rgba(107, 114, 128, 0.22)',
    borderRadius: Radius.full,
    height: 6,
    width: 6,
  },
  activeDot: {
    backgroundColor: Colors.primaryStrong,
    height: 7,
    width: 18,
  },
});
