export type GlobalSearchSectionKey =
  | 'accounts'
  | 'transactions'
  | 'activity'
  | 'recipients'
  | 'support'
  | 'cards'
  | 'savings';

export type GlobalSearchResultItem = {
  id: string;
  sectionKey: GlobalSearchSectionKey;
  title: string;
  subtitle: string;
  meta?: string;
  accentLabel?: string;
  onPress: () => void;
};
