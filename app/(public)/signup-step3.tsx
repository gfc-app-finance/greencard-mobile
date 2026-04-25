import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MessagesSquare } from 'lucide-react-native';
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

const BRAND_TEAL = '#0F766E';

const AnimatedInputBox = ({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(focused ? BRAND_TEAL : '#E2E8F0', { duration: 250 }),
      backgroundColor: withTiming(focused ? '#FFFFFF' : '#F8FAFC', { duration: 250 }),
      shadowColor: BRAND_TEAL,
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
  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleContinue = () => {
    router.push({
      pathname: '/(public)/signup-step4',
      params: { phone: `+234 ${phone}` },
    });
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
          <View style={[styles.progressActive, { width: '50%' }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContent}>
              <View>
                <View style={styles.textSection}>
                  <Text style={styles.mainTitle}>{"What's your phone number?"}</Text>
                  <Text style={styles.mainSubtitle}>
                    {"We'll send a verification code to this number"}
                  </Text>
                </View>

                {/* PHONE INPUT GROUP */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <AnimatedInputBox focused={isFocused}>
                    <View style={styles.countryPicker}>
                      <Text style={styles.flag}>🇳🇬</Text>
                      <Text style={styles.countryCode}>+234</Text>
                      <View style={styles.divider} />
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="803 000 0000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </AnimatedInputBox>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.btnPrimary, phone.length < 10 && { opacity: 0.5 }]}
                  onPress={handleContinue}
                  disabled={phone.length < 10}
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
