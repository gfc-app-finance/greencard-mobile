import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowUpDown,
  Circle,
  CreditCard,
  Globe,
  Plane,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_TEAL = '#064E3B';
const BRAND_SOFT = '#DFF4F1';

const SLIDES = [
  {
    id: 1,
    title: 'Get paid from abroad with ease',
    description: 'Receive your salary and freelance fees in multiple currencies.',
  },
  {
    id: 2,
    title: 'Your global income all in one place',
    description: 'Hold balances in three major currencies. ' + 'USD • GBP • EUR',
  },
  {
    id: 3,
    title: 'Payments should not be a mystery',
    description: `Stay in the know at every stage\nTransparent fees, exchange rates, and payment status`,
  },

  {
    id: 4,
    title: 'USD cards for global spending',
    description: 'Pay for subscriptions and shop online anywhere in the world.',
  },
  {
    id: 5,
    title: 'Your money has no boundaries',
    description: 'Financial freedom designed for the modern global earner.',
  },
];

// --- 1. GLOBE ANIMATION ---
const AnimatedGlobe = () => {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Globe size={180} color={BRAND_TEAL} strokeWidth={1.5} />
    </Animated.View>
  );
};

// --- 2. CURRENCY ANIMATION ---
const AnimatedCurrency = () => {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 1000 }),
        withTiming(-30, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);
  return (
    <View style={styles.animationContainer}>
      <Animated.View
        style={useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }))}
      >
        <Circle size={80} color={BRAND_TEAL} fillOpacity={0.2} fill={BRAND_TEAL} />
        <Text style={styles.currencySymbol}>$</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.absoluteCenter,
          useAnimatedStyle(() => ({ transform: [{ translateY: -offset.value }] })),
        ]}
      >
        <Circle size={80} color={BRAND_SOFT} fillOpacity={0.4} fill={BRAND_SOFT} />
        <Text style={[styles.currencySymbol, { color: BRAND_TEAL }]}>₦</Text>
      </Animated.View>
    </View>
  );
};

// --- 3. PLANE ANIMATION ---
const AnimatedPlane = () => {
  const translateX = useSharedValue(-100);
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: '-10deg' }],
  }));
  return (
    <View style={styles.animationContainer}>
      <View style={styles.cardBackground} />
      <Animated.View style={style}>
        <Plane size={60} color={BRAND_TEAL} />
      </Animated.View>
    </View>
  );
};

// --- 4. SHIELD ANIMATION ---
const AnimatedShield = () => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.animationContainer}>
      <CreditCard size={150} color="#262626" />
      <Animated.View style={[styles.absoluteCenter, style]}>
        <Shield size={80} color={BRAND_TEAL} fill={BRAND_TEAL} fillOpacity={0.1} />
      </Animated.View>
    </View>
  );
};

// --- 5. NETWORK ANIMATION ---
const AnimatedNetwork = () => {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  return (
    <View style={styles.animationContainer}>
      <Sparkles size={60} color={BRAND_SOFT} />
      <Animated.View style={[styles.dashedRing, style]} />
    </View>
  );
};

export default function StartScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash) return;
    const interval = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % SLIDES.length),
      4000,
    );
    return () => clearInterval(interval);
  }, [showSplash]);

  const renderAnimation = () => {
    switch (currentIndex % 5) {
      case 0:
        return <AnimatedGlobe />;
      case 1:
        return <AnimatedCurrency />;
      case 2:
        return <AnimatedPlane />;
      case 3:
        return <AnimatedShield />;
      case 4:
        return <AnimatedNetwork />;
      default:
        return <AnimatedGlobe />;
    }
  };

  if (showSplash) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Animated.View
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(800)}
          style={styles.splashContainer}
        >
          <Text style={styles.splashTitle}>Greencard</Text>
          <View style={styles.splashBar} />
          <Text style={styles.splashSubtitle}>Global banking without borders</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(1000)} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0A0A0A', '#111111']} style={styles.gradientContainer}>
          <View style={styles.contentContainer}>
            <View style={styles.animationWrapper}>
              <View style={styles.glowAura} />
              <Animated.View
                key={`anim-${currentIndex}`}
                entering={FadeIn.duration(600)}
                exiting={FadeOut.duration(300)}
              >
                {renderAnimation()}
              </Animated.View>
            </View>

            <View style={styles.textContainer}>
              <Animated.View key={`text-${currentIndex}`} entering={FadeIn.duration(600)}>
                <Text style={styles.title}>{SLIDES[currentIndex].title}</Text>
                <Text style={styles.description}>{SLIDES[currentIndex].description}</Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.pagination}>
              {SLIDES.map((_, index) => (
                <Animated.View
                  layout={Layout.springify()}
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(public)/signup-step1')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Create account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(public)/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  splashBar: {
    height: 4,
    width: 40,
    backgroundColor: BRAND_TEAL,
    borderRadius: 2,
    marginVertical: 15,
  },
  splashSubtitle: { fontSize: 16, fontWeight: '500', color: BRAND_TEAL, opacity: 0.8 },
  gradientContainer: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 40 },
  animationWrapper: {
    width: 256,
    height: 256,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowAura: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: BRAND_TEAL,
    opacity: 0.1,
  },
  animationContainer: { alignItems: 'center', justifyContent: 'center', height: 192 },
  absoluteCenter: { position: 'absolute' },
  currencySymbol: {
    position: 'absolute',
    top: 22,
    left: 30,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  cardBackground: {
    position: 'absolute',
    width: 200,
    height: 120,
    backgroundColor: '#171717',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  dashedRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: BRAND_TEAL,
    borderStyle: 'dashed',
  },
  textContainer: { alignItems: 'center', paddingHorizontal: 16 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
  },
  description: { fontSize: 16, color: '#A1A1AA', textAlign: 'center', lineHeight: 24 },
  bottomSection: { width: '100%', gap: 24, marginBottom: 20 },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  paginationDot: { height: 6, borderRadius: 3, width: 8, backgroundColor: '#262626' },
  paginationDotActive: { width: 28, backgroundColor: BRAND_TEAL },
  buttonContainer: { gap: 16 },
  primaryButton: {
    width: '100%',
    backgroundColor: BRAND_TEAL,
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});
