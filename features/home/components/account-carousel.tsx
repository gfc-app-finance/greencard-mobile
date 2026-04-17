import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent,StyleSheet, useWindowDimensions, View } from 'react-native';

import { Layout } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

import { AccountCarouselPagination } from './account-carousel-pagination';
import { AccountHeroSlide } from './account-hero-slide';

type AccountCarouselProps = {
  accounts: DashboardAccount[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onAccountsPress?: () => void;
};

export function AccountCarousel({
  accounts,
  activeIndex,
  onIndexChange,
  onAccountsPress,
}: AccountCarouselProps) {
  const { width } = useWindowDimensions();
  const pageWidth = width - Layout.screenPadding * 2;

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    onIndexChange(nextIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: pageWidth,
          offset: pageWidth * index,
        })}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pageWidth }]}>
            <AccountHeroSlide account={item} onAccountsPress={onAccountsPress} />
          </View>
        )}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <AccountCarouselPagination activeIndex={activeIndex} count={accounts.length} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
