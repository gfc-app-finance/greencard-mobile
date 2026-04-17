import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';

import { ActivityFilterChips, type ActivityFilterValue } from './activity-filter-chips';
import { ActivityItemRow } from './activity-item-row';

export function ActivityFeedScreen() {
  const router = useRouter();
  const { activities } = useGoovaAppState();
  const { dashboard } = useHomeDashboard();
  const [filter, setFilter] = useState<ActivityFilterValue>('all');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredActivities = useMemo(
    () => activities.filter((activity) => (filter === 'all' ? true : activity.type === filter)),
    [activities, filter]
  );

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <HomeToolbar
        avatarInitials={dashboard?.avatarInitials || 'GCF'}
        onAvatarPress={() => router.push('/profile' as never)}
        onSearchChange={setSearchValue}
        onSearchPress={() => setIsSearchVisible(true)}
        searchPlaceholder=""
        searchValue={searchValue}
      />

      <ActivityFilterChips onChange={setFilter} value={filter} />

      <View style={styles.list}>
        {filteredActivities.map((activity) => (
          <ActivityItemRow
            key={activity.id}
            activity={activity}
            onPress={() =>
              router.push({
                pathname: '/activity/[activityId]',
                params: { activityId: activity.id },
              } as never)
            }
          />
        ))}
      </View>

      <GlobalSearchSheet
        onClose={() => {
          setIsSearchVisible(false);
          setSearchValue('');
        }}
        onSearchValueChange={setSearchValue}
        searchValue={searchValue}
        visible={isSearchVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
  },
});
