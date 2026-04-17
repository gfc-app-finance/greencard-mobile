import { type StyleProp, StyleSheet, Text, type TextStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/theme';
import { splitCurrencyParts } from '@/lib/currency';

type CurrencyAmountVariant = 'hero' | 'accountHero' | 'screen' | 'overview' | 'card';

type CurrencyAmountTextProps = {
  value: string;
  variant?: CurrencyAmountVariant;
  color?: string;
  minorColor?: string;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
};

const variantStyles = {
  hero: {
    majorFontSize: Typography.display.fontSize,
    majorLineHeight: Typography.display.lineHeight,
    majorLetterSpacing: Typography.display.letterSpacing,
    minorFontSize: 22,
    minorLineHeight: 28,
    minorMarginTop: 4,
  },
  accountHero: {
    majorFontSize: Typography.display.fontSize,
    majorLineHeight: Typography.display.lineHeight,
    majorLetterSpacing: Typography.display.letterSpacing,
    minorFontSize: 20,
    minorLineHeight: 26,
    minorMarginTop: 4,
  },
  screen: {
    majorFontSize: Typography.display.fontSize,
    majorLineHeight: Typography.display.lineHeight,
    majorLetterSpacing: Typography.display.letterSpacing,
    minorFontSize: 20,
    minorLineHeight: 26,
    minorMarginTop: 4,
  },
  overview: {
    majorFontSize: 32,
    majorLineHeight: 36,
    majorLetterSpacing: -0.6,
    minorFontSize: 16,
    minorLineHeight: 22,
    minorMarginTop: 4,
  },
  card: {
    majorFontSize: Typography.cardTitle.fontSize,
    majorLineHeight: Typography.cardTitle.lineHeight,
    majorLetterSpacing: Typography.cardTitle.letterSpacing,
    minorFontSize: Typography.secondary.fontSize,
    minorLineHeight: Typography.secondary.lineHeight,
    minorMarginTop: 2,
  },
} as const;

export function CurrencyAmountText({
  value,
  variant = 'card',
  color = Colors.text,
  minorColor,
  align = 'left',
  style,
}: CurrencyAmountTextProps) {
  const { major, minor } = splitCurrencyParts(value);
  const sizeConfig = variantStyles[variant];

  return (
    <Text
      style={[
        styles.base,
        {
          color,
          textAlign: align,
        },
        style,
      ]}>
      <Text
        style={{
          color,
          fontSize: sizeConfig.majorFontSize,
          fontVariant: ['tabular-nums'],
          fontWeight: '500',
          letterSpacing: sizeConfig.majorLetterSpacing,
          lineHeight: sizeConfig.majorLineHeight,
        }}>
        {major}
      </Text>
      {minor ? (
        <Text
          style={{
            color: minorColor || color,
            fontSize: sizeConfig.minorFontSize,
            fontVariant: ['tabular-nums'],
            fontWeight: '400',
            lineHeight: sizeConfig.minorLineHeight,
            marginTop: sizeConfig.minorMarginTop,
          }}>
          {minor}
        </Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
