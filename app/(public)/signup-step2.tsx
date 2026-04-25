import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MessagesSquare } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

const BRAND_TEAL = '#0F766E';

const AnimatedOtpBox = ({
  focused,
  value,
  children,
}: {
  focused: boolean;
  value: string;
  children: React.ReactNode;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(focused ? BRAND_TEAL : '#E2E8F0', { duration: 200 }),
      backgroundColor: withTiming(focused || value ? '#FFFFFF' : '#F8FAFC', {
        duration: 200,
      }),
      shadowColor: BRAND_TEAL,
      shadowOpacity: withTiming(focused ? 0.25 : 0, { duration: 200 }),
      shadowRadius: 10,
      elevation: withTiming(focused ? 4 : 0, { duration: 200 }),
      transform: [{ scale: withTiming(focused ? 1.05 : 1, { duration: 150 }) }],
    };
  });
  return (
    <Animated.View style={[styles.otpBoxWrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default function SignupStep2() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [timer, setTimer] = useState(59);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* NAV BAR */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
            <ChevronLeft size={30} color="#111827" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}>
            <MessagesSquare size={26} color="#111827" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressActive, { width: '33.3%' }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContent}>
              <View>
                <View style={styles.textSection}>
                  <Text style={styles.mainTitle}>{'Verify your email'}</Text>
                  <Text style={styles.mainSubtitle}>
                    {'Please enter the 6-digit code sent to '}
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                      {email || 'your email'}
                    </Text>
                  </Text>
                </View>

                {/* OTP INPUT ROW */}
                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <AnimatedOtpBox
                      key={index}
                      focused={focusedIndex === index}
                      value={digit}
                    >
                      <TextInput
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        style={styles.otpInput}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        onChangeText={(v) => handleOtpChange(v, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        autoFocus={index === 0}
                      />
                    </AnimatedOtpBox>
                  ))}
                </View>

                <View style={styles.resendWrapper}>
                  <Text style={styles.resendText}>{"Didn't receive the code? "}</Text>
                  <TouchableOpacity disabled={timer > 0}>
                    <Text
                      style={[styles.resendAction, timer > 0 && { color: '#94A3B8' }]}
                    >
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.btnPrimary, otp.join('').length < 6 && { opacity: 0.5 }]}
                  onPress={() => router.push('/(public)/signup-step3')}
                  disabled={otp.join('').length < 6}
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
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 8,
  },
  mainSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '400', lineHeight: 24 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpBoxWrapper: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  resendWrapper: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { fontSize: 15, color: '#64748B' },
  resendAction: { fontSize: 15, color: BRAND_TEAL, fontWeight: '700' },
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
