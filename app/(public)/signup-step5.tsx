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
    };
  });
  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>{children}</Animated.View>
  );
};

export default function SignupStep5() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.outerWrapper}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* CORRECTED NAV BAR */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
            <ChevronLeft size={30} color="#0F172A" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}>
            <MessagesSquare size={26} color="#0F172A" strokeWidth={2.5} />
          </TouchableOpacity>
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
                  <Text style={styles.mainTitle}>{'Got any referral code?'}</Text>
                  <Text style={styles.mainSubtitle}>
                    {'Enter your referral code to get exclusive benefits'}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Referral Code (Optional)</Text>
                  <AnimatedInputBox focused={isFocused}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Enter code"
                      placeholderTextColor="#94A3B8"
                      value={code}
                      onChangeText={setCode}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      autoCapitalize="characters"
                    />
                  </AnimatedInputBox>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => router.push('/(public)/signup-step6')}
                >
                  <Text style={styles.btnText}>Submit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => router.push('/(public)/signup-step6')}
                >
                  <Text style={styles.btnSecondaryText}>Skip</Text>
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

  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
  mainSubtitle: { fontSize: 17, color: '#64748B', fontWeight: '400', lineHeight: 24 },

  fieldGroup: { gap: 10 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 18,
    height: 64,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  fieldInput: { fontSize: 18, color: '#0F172A', fontWeight: '700' },

  actionSection: { gap: 16, alignItems: 'center' },
  btnPrimary: {
    backgroundColor: BRAND_TEAL,
    height: 64,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  btnSecondary: {
    height: 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#64748B', fontSize: 17, fontWeight: '700' },
});
