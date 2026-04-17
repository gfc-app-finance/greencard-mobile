import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useWindowDimensions,View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/theme';

type NumericKeypadProps = {
  onKeyPress: (value: string) => void;
  onDeletePress: () => void;
};

const keypadRows = [
  [
    { value: '1' },
    { value: '2', hint: 'ABC' },
    { value: '3', hint: 'DEF' },
  ],
  [
    { value: '4', hint: 'GHI' },
    { value: '5', hint: 'JKL' },
    { value: '6', hint: 'MNO' },
  ],
  [
    { value: '7', hint: 'PQRS' },
    { value: '8', hint: 'TUV' },
    { value: '9', hint: 'WXYZ' },
  ],
];

export function NumericKeypad({ onKeyPress, onDeletePress }: NumericKeypadProps) {
  const { width } = useWindowDimensions();
  const estimatedKeySize = Math.floor(
    (width - Layout.screenPadding * 2 - Spacing.sm * 4) / 3
  );
  const keySize = Math.max(72, Math.min(92, estimatedKeySize));

  return (
    <View style={styles.panel}>
      {keypadRows.map((row) => (
        <View key={row.map((item) => item.value).join('-')} style={styles.row}>
          {row.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => onKeyPress(item.value)}
              style={[styles.key, { minHeight: keySize }]}>
              <Text style={styles.keyValue}>{item.value}</Text>
              {item.hint ? <Text style={styles.keyHint}>{item.hint}</Text> : null}
            </Pressable>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <Pressable onPress={() => onKeyPress('.')} style={[styles.key, { minHeight: keySize }]}>
          <Text style={styles.keyValue}>.</Text>
        </Pressable>

        <Pressable onPress={() => onKeyPress('0')} style={[styles.key, { minHeight: keySize }]}>
          <Text style={styles.keyValue}>0</Text>
        </Pressable>

        <Pressable onPress={onDeletePress} style={[styles.key, { minHeight: keySize }]}>
          <Feather color={Colors.text} name="delete" size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  key: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    flex: 1,
    justifyContent: 'center',
  },
  keyValue: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '500',
  },
  keyHint: {
    color: Colors.textSubtle,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 4,
  },
});
