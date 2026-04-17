import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

import { SearchResultRow } from './search-result-row';
import type { GlobalSearchResultItem } from './search-types';

type GroupedSearchResultsSectionProps = {
  title: string;
  results: GlobalSearchResultItem[];
};

export function GroupedSearchResultsSection({
  title,
  results,
}: GroupedSearchResultsSectionProps) {
  if (!results.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {results.map((result) => (
          <SearchResultRow key={`${result.sectionKey}-${result.id}`} result={result} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.sm,
  },
});
