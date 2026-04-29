import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MessagesSquare } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Keyboard as RNKeyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFormSecurity } from '@/hooks/use-form-security';

const BRAND_TEAL = '#0F766E';

const AnimatedInputBox = ({
  focused,
  hasError,
  children,
}: {
  focused: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(hasError ? '#EF4444' : focused ? BRAND_TEAL : '#E2E8F0', {
        duration: 250,
      }),
      backgroundColor: withTiming(focused ? '#FFFFFF' : '#F8FAFC', { duration: 250 }),
      shadowColor: hasError ? '#EF4444' : BRAND_TEAL,
      shadowOpacity: withTiming(focused ? 0.3 : 0, { duration: 250 }),
      shadowRadius: 15,
      elevation: withTiming(focused ? 5 : 0, { duration: 250 }),
      transform: [{ scale: withTiming(focused ? 1.01 : 1, { duration: 200 }) }],
    };
  });
  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>{children}</Animated.View>
  );
};

export default function SignupStep3() {
  const router = useRouter();

  const { form, errors, isFormValid, updateField, validateField } = useFormSecurity(
    { phoneNumber: '' },
    ['phoneNumber'],
  );

  const [isFocused, setIsFocused] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>('NG');
  const [callingCode, setCallingCode] = useState('234');
  const [showPicker, setShowPicker] = useState(false);

  const onSelect = (country: Country) => {
    setCallingCode(country.callingCode[0]);
    setCountryCode(country.cca2);
    setShowPicker(false);
    validateField('phoneNumber', form.phoneNumber);
  };

  const handleContinue = () => {
    if (!isFormValid) return;
    const fullPhone = `+${callingCode}${form.phoneNumber}`;
    router.push({
      pathname: '/(public)/signup-step4',
      params: { phone: fullPhone },
    });
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
            <ChevronLeft size={30} color="#111827" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}>
            <MessagesSquare size={26} color="#111827" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressActive, { width: '50%' }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={RNKeyboard.dismiss}>
            <View style={styles.mainContent}>
              <View>
                <View style={styles.textSection}>
                  <Text style={styles.mainTitle}>{"What's your phone number?"}</Text>
                  <Text style={styles.mainSubtitle}>
                    {'We will send a verification code to this number'}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <AnimatedInputBox focused={isFocused} hasError={!!errors.phoneNumber}>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      style={styles.countryPicker}
                    >
                      <CountryPicker
                        {...{
                          countryCode,
                          withFilter: true,
                          withFlag: true,
                          withCallingCode: true,
                          withEmoji: true,
                          onSelect,
                          visible: showPicker,
                          onClose: () => setShowPicker(false),
                        }}
                        containerButtonStyle={{ marginLeft: -10 }}
                      />
                      <Text style={styles.countryCode}>+{callingCode}</Text>
                      <View style={styles.divider} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="803 000 0000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={form.phoneNumber}
                      onChangeText={(t) =>
                        updateField('phoneNumber', t.replace(/\D/g, ''))
                      }
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => {
                        setIsFocused(false);
                        validateField('phoneNumber', form.phoneNumber);
                      }}
                    />
                  </AnimatedInputBox>
                  {errors.phoneNumber ? (
                    <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.btnPrimary, !isFormValid && { opacity: 0.5 }]}
                  onPress={handleContinue}
                  disabled={!isFormValid}
                >
                  <Text style={styles.btnText}>Continue</Text>
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
  navIcon: { padding: 6 },
  progressContainer: { height: 2, backgroundColor: '#F1F5F9', width: '100%' },
  progressActive: { height: '100%', backgroundColor: BRAND_TEAL },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  textSection: { marginBottom: 40 },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 8,
  },
  mainSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '400', lineHeight: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
  },
  countryPicker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flag: { fontSize: 20 },
  countryCode: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  divider: { width: 1.5, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  fieldInput: {
    flex: 1,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  actionSection: { alignItems: 'center' },
  btnPrimary: {
    backgroundColor: BRAND_TEAL,
    height: 64,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '800' },
});
