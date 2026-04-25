import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessagesSquare,
} from 'lucide-react-native';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_TEAL = '#0F766E';
const BRAND_SOFT = '#DFF4F1';

const AnimatedInputBox = ({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(focused ? BRAND_TEAL : '#E5E7EB', { duration: 250 }),
      backgroundColor: withTiming(focused ? '#FFFFFF' : '#F8FAFC', { duration: 250 }),
      shadowColor: BRAND_TEAL,
      shadowOpacity: withTiming(focused ? 0.3 : 0, { duration: 250 }),
      shadowRadius: withTiming(focused ? 15 : 0, { duration: 250 }),
      elevation: withTiming(focused ? 5 : 0, { duration: 250 }),
      transform: [{ scale: withTiming(focused ? 1.01 : 1, { duration: 200 }) }],
    };
  });

  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>{children}</Animated.View>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />

      <View style={styles.blackHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
              <ChevronLeft size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.gLogoBox}>
                <Text style={styles.gLogoText}>G</Text>
              </View>
              <Text style={styles.greencardText}>Greencard</Text>
            </View>
            <TouchableOpacity style={styles.headerIcon}>
              <MessagesSquare size={24} color="white" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteBody}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.loginBox}>
                <View style={styles.iconContainer}>
                  <View style={styles.softGlowAura} />
                  <View style={styles.lockCircle}>
                    <Lock size={32} color={BRAND_TEAL} strokeWidth={2.5} />
                  </View>
                </View>

                <Text style={styles.title}>Enter your login details</Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <AnimatedInputBox focused={focusedField === 'email'}>
                      <Mail
                        size={20}
                        color={focusedField === 'email' ? BRAND_TEAL : '#94A3B8'}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="name@email.com"
                        placeholderTextColor="#94A3B8"
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </AnimatedInputBox>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Password</Text>
                      <TouchableOpacity>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
                    <AnimatedInputBox focused={focusedField === 'password'}>
                      <Lock
                        size={20}
                        color={focusedField === 'password' ? BRAND_TEAL : '#94A3B8'}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color="#94A3B8" />
                        ) : (
                          <Eye size={20} color="#94A3B8" />
                        )}
                      </TouchableOpacity>
                    </AnimatedInputBox>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Log in</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <TouchableOpacity onPress={() => router.push('/(public)/signup-step1')}>
                  <Text style={styles.switchText}>
                    New user?{' '}
                    <Text style={{ color: BRAND_TEAL, fontWeight: '700' }}>
                      Create account
                    </Text>
                  </Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>v1.0.0 (1)</Text>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0A0A0A' },
  blackHeader: { backgroundColor: '#0A0A0A', paddingBottom: 60, paddingHorizontal: 20 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerIcon: { padding: 5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gLogoBox: {
    width: 32,
    height: 32,
    backgroundColor: BRAND_TEAL,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gLogoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  greencardText: { color: 'white', fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5 },
  whiteBody: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  loginBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  softGlowAura: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_SOFT,
    opacity: 1,
  },
  lockCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: { width: '100%', gap: 24 },
  inputGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginLeft: 4 },
  forgotText: { fontSize: 13, fontWeight: '700', color: BRAND_TEAL },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    gap: 12,
  },
  input: { flex: 1, color: '#111827', fontSize: 16, fontWeight: '600' },
  primaryButton: {
    width: '100%',
    backgroundColor: BRAND_TEAL,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: '800' },

  footerContainer: { alignItems: 'center', marginTop: 30, gap: 12 },
  switchText: { fontSize: 15, color: '#6B7280' },
  versionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
