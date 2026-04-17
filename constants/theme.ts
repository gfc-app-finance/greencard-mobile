export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const Layout = {
  screenPadding: 28,
  screenTopPadding: 24,
  screenBottomPadding: 36,
  screenGap: 20,
  tabBarHeight: 78,
  tabBarBottomOffset: 16,
  tabBarClearance: 106,
} as const;

export const Typography = {
  display: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  secondary: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
} as const;
