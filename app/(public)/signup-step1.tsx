import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Eye, EyeOff, MessagesSquare } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFormSecurity } from '@/hooks/use-form-security';
import { supabase } from '@/lib/supabase';

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

export default function SignupStep1() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { form, errors, isFormValid, updateField, validateField } = useFormSecurity(
    { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
    ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
  );

  const handleLoginNavigation = () => {
    Keyboard.dismiss();
    router.replace('/(public)/login');
  };

  const handleContinue = async () => {
    if (!isFormValid) return;
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { first_name: form.firstName, last_name: form.lastName } },
      });
      if (error) {
        alert(error.message);
        return;
      }
      router.push({ pathname: '/(public)/signup-step2', params: { email: form.email } });
    } catch (err) {
      alert('Connection error.');
    }
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
          <View style={[styles.progressActive, { width: '16.6%' }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContent}>
              <View>
                <View style={styles.textSection}>
                  <Text style={styles.mainTitle}>{"Let's get to know you"}</Text>
                  <Text style={styles.mainSubtitle}>
                    {'Tell us a bit about yourself to get started'}
                  </Text>
                </View>

                <View style={styles.formStack}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>First Name</Text>
                    <AnimatedInputBox
                      focused={focusedField === 'firstName'}
                      hasError={!!errors.firstName}
                    >
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Alex"
                        placeholderTextColor="#94A3B8"
                        value={form.firstName}
                        onChangeText={(t) => updateField('firstName', t)}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => {
                          setFocusedField(null);
                          validateField('firstName', form.firstName);
                        }}
                      />
                    </AnimatedInputBox>
                    {errors.firstName ? (
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Last Name</Text>
                    <AnimatedInputBox
                      focused={focusedField === 'lastName'}
                      hasError={!!errors.lastName}
                    >
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Johnson"
                        placeholderTextColor="#94A3B8"
                        value={form.lastName}
                        onChangeText={(t) => updateField('lastName', t)}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => {
                          setFocusedField(null);
                          validateField('lastName', form.lastName);
                        }}
                      />
                    </AnimatedInputBox>
                    {errors.lastName ? (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <AnimatedInputBox
                      focused={focusedField === 'email'}
                      hasError={!!errors.email}
                    >
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="name@gcf.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        autoComplete="email"
                        value={form.email}
                        onChangeText={(t) => {
                          updateField('email', t);
                        }}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => {
                          setFocusedField(null);
                          validateField('email', form.email);
                        }}
                      />
                    </AnimatedInputBox>
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Create Password</Text>
                    <AnimatedInputBox
                      focused={focusedField === 'password'}
                      hasError={!!errors.password}
                    >
                      <TextInput
                        style={styles.passInput}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPass}
                        value={form.password}
                        onChangeText={(t) => updateField('password', t)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => {
                          setFocusedField(null);
                          validateField('password', form.password);
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                        {showPass ? (
                          <EyeOff size={22} color="#94A3B8" />
                        ) : (
                          <Eye size={22} color="#94A3B8" />
                        )}
                      </TouchableOpacity>
                    </AnimatedInputBox>
                    <Text style={styles.hintText}>
                      {'Must be 8+ characters, with uppercase, number & symbol'}
                    </Text>
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                    <AnimatedInputBox
                      focused={focusedField === 'confirmPassword'}
                      hasError={!!errors.confirmPassword}
                    >
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPass}
                        value={form.confirmPassword}
                        onChangeText={(t) => updateField('confirmPassword', t)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => {
                          setFocusedField(null);
                          validateField('confirmPassword', form.confirmPassword);
                        }}
                      />
                    </AnimatedInputBox>
                    {errors.confirmPassword ? (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.btnPrimary, !isFormValid && styles.btnDisabled]}
                  onPress={handleContinue}
                  disabled={!isFormValid}
                >
                  <Text style={styles.btnText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.termsWrapper}>
                  <Text style={styles.termsBaseText}>
                    By clicking Continue, you agree to our{' '}
                    <Text
                      style={styles.linkText}
                      onPress={() => router.push('/terms' as any)}
                    >
                      Terms
                    </Text>
                    {' and '}
                    <Text
                      style={styles.linkText}
                      onPress={() => router.push('/privacy' as any)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleLoginNavigation}
                  style={styles.loginLink}
                >
                  <Text style={styles.footerPrompt}>
                    {'Already have an account? '}
                    <Text style={{ color: BRAND_TEAL, fontWeight: '700' }}>Log in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navIcon: { padding: 6 },
  progressContainer: { height: 2, backgroundColor: '#F1F5F9', width: '100%' },
  progressActive: { height: '100%', backgroundColor: BRAND_TEAL },
  scrollContent: { flexGrow: 1 },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 5,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  textSection: { marginBottom: 15 },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 4,
  },
  mainSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '400', lineHeight: 22 },
  formStack: { gap: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
  },
  fieldInput: { flex: 1, fontSize: 16, color: '#0F172A', fontWeight: '600' },
  passInput: { flex: 1, fontSize: 16, color: '#0F172A', fontWeight: '600' },
  hintText: { fontSize: 11, color: '#94A3B8', marginTop: 4, paddingHorizontal: 4 },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  actionSection: { gap: 10, alignItems: 'center', marginTop: 20 },
  btnPrimary: {
    backgroundColor: BRAND_TEAL,
    height: 60,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#E2E8F0', opacity: 0.8 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  termsWrapper: { marginTop: 16, marginBottom: 8 },
  termsBaseText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  linkText: { color: BRAND_TEAL, fontWeight: '700' },
  loginLink: { marginTop: 5, padding: 2 },
  footerPrompt: { fontSize: 16, color: '#64748B' },
});
