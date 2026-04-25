import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, MessagesSquare } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_TEAL = '#0F766E';
const BRAND_SOFT = '#DFF4F1';

export default function SignupStep6() {
  const router = useRouter();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(200, withSpring(1));
  }, [scale, opacity]);

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleFinish = () => {
    const path = `/(protected)/(tabs)` as any;
    router.replace(path);
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topNav}>
          <View style={{ width: 30 }} />
          <TouchableOpacity style={styles.navIcon}>
            <MessagesSquare size={26} color="#0F172A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* PROGRESS (100%) */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressActive, { width: '100%' }]} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.centerSection}>
            <View style={styles.celebrationWrapper}>
              <Animated.View style={[styles.glowAura, animatedCircle]} />
              <Animated.View style={[styles.successCircle, animatedCircle]}>
                <Check size={40} color="white" strokeWidth={4} />
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeInUp.delay(400).duration(800)}
              style={styles.textSection}
            >
              <Text style={styles.mainTitle}>{"You're all set!"}</Text>
              <Text style={styles.mainSubtitle}>
                {
                  "Welcome to Greencard. You're now ready for seamless global payments without borders."
                }
              </Text>
            </Animated.View>
          </View>

          {/* FINAL CTA */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(800)}
            style={styles.actionSection}
          >
            <TouchableOpacity style={styles.btnPrimary} onPress={handleFinish}>
              <Text style={styles.btnText}>Get Started</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    justifyContent: 'space-between',
    paddingBottom: 50,
  },

  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },

  celebrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowAura: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: BRAND_SOFT,
    opacity: 0.6,
  },
  successCircle: {
    width: 90,
    height: 90,
    backgroundColor: BRAND_TEAL,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  textSection: { alignItems: 'center' },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 16,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 17,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  actionSection: { width: '100%' },
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
