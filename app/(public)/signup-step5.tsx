import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Gift } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFormSecurity } from '@/hooks/use-form-security';

const BRAND_TEAL = '#0F766E';

const AnimatedInputBox = ({ focused, hasError, children }: any) => {
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(hasError ? '#EF4444' : focused ? BRAND_TEAL : '#E2E8F0', {
      duration: 250,
    }),
    backgroundColor: withTiming(focused ? '#FFFFFF' : '#F8FAFC', { duration: 250 }),
    shadowColor: hasError ? '#EF4444' : BRAND_TEAL,
    shadowOpacity: withTiming(focused ? 0.2 : 0, { duration: 250 }),
    shadowRadius: 10,
    elevation: withTiming(focused ? 4 : 0, { duration: 250 }),
  }));
  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>{children}</Animated.View>
  );
};

export default function SignupStep5() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const { form, errors, updateField, validateField } = useFormSecurity(
    { referralCode: '' },
    [],
  );

  const handleFinish = () => {
    router.push('/(public)/signup-step6');
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={30} color="#111827" />
          </TouchableOpacity>
          <Gift size={26} color={BRAND_TEAL} />
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressActive, { width: '83.3%' }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContent}>
              <View>
                <View style={styles.textSection}>
                  <Text style={styles.mainTitle}>Got a referral code?</Text>
                  <Text style={styles.mainSubtitle}>
                    Enter it below to get exclusive benefits
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Referral Code</Text>
                  <AnimatedInputBox focused={isFocused} hasError={!!errors.referralCode}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="GC-12345"
                      autoCapitalize="characters"
                      value={form.referralCode}
                      onChangeText={(t) => updateField('referralCode', t)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => {
                        setIsFocused(false);
                        validateField('referralCode', form.referralCode);
                      }}
                    />
                  </AnimatedInputBox>
                  {errors.referralCode ? (
                    <Text style={styles.errorText}>{errors.referralCode}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleFinish}>
                  <Text style={styles.btnText}>Finish Setup</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
                  <Text style={styles.skipText}>I don&apos;t have one</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressContainer: { height: 2, backgroundColor: '#F1F5F9', width: '100%' },
  progressActive: { height: '100%', backgroundColor: BRAND_TEAL },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  textSection: { marginBottom: 35 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  mainSubtitle: { fontSize: 16, color: '#64748B', marginTop: 8, lineHeight: 22 },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    justifyContent: 'center',
  },
  fieldInput: { fontSize: 18, color: '#0F172A', fontWeight: '700', letterSpacing: 1 },
  errorText: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 4 },
  actionSection: { alignItems: 'center', gap: 12 },
  btnPrimary: {
    backgroundColor: BRAND_TEAL,
    height: 60,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  skipBtn: { padding: 10 },
  skipText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
});
