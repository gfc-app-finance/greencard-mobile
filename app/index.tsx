import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowUpDown,
  Globe,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_TEAL = '#0F766E';

const SLIDES = [
  {
    id: 1,
    title: 'No more pending, just paid',
    description:
      'Experience instant settlement. Your funds are cleared and ready the moment they arrive.',
  },
  {
    id: 2,
    title: 'Smart fx, better value',
    description:
      'Stop losing money to hidden spreads. Exchange at mid-market rates with total transparency.',
  },
  {
    id: 3,
    title: 'Everything you earn, instantly accessible',
    description:
      'Your global wealth in your pocket. Access USD, GBP, and EUR balances 24/7.',
  },
  {
    id: 4,
    title: 'Convert at rates that work for you',
    description:
      'Set your target price. Move between currencies seamlessly when the market is in your favor.',
  },
  {
    id: 5,
    title: 'Borderless payments without limit',
    description:
      'The ultimate global earner tool. Send and spend worldwide with zero geographic restrictions.',
  },
];

const ShadowGlow = ({ children }: { children: React.ReactNode }) => {
  const glowPulse = useSharedValue(1);
  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowPulse]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }, { translateY: -20 }],
    opacity: glowPulse.value > 1.05 ? 0.7 : 1,
  }));
  const iconLiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (glowPulse.value - 1) * -15 }],
  }));
  return (
    <View
      style={{ width: SCREEN_WIDTH, height: 400, overflow: 'visible' }}
      className="items-center justify-center"
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: 'rgba(15, 118, 110, 0.04)',
            shadowColor: '#0F766E',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.55,
            shadowRadius: 80,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 460,
            height: 460,
            borderRadius: 230,
            backgroundColor: 'rgba(15, 118, 110, 0.02)',
            shadowColor: '#0F766E',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 120,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View style={iconLiftStyle}>{children}</Animated.View>
    </View>
  );
};

const AnimatedPaid = () => {
  const tilt = useSharedValue(0);
  useEffect(() => {
    tilt.value = withRepeat(withTiming(15, { duration: 2000 }), -1, true);
  }, [tilt]);
  return (
    <ShadowGlow>
      <Animated.View
        style={useAnimatedStyle(() => ({
          transform: [{ perspective: 1000 }, { rotateY: `${tilt.value}deg` }],
        }))}
      >
        <View className="w-56 h-56 bg-teal-800 rounded-full shadow-2xl items-center justify-center border-4 border-teal-600">
          <ShieldCheck size={130} color="white" strokeWidth={1.5} />
        </View>
      </Animated.View>
    </ShadowGlow>
  );
};

const AnimatedFX = () => {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(-20, { duration: 2000 }), -1, true);
  }, [float]);
  return (
    <ShadowGlow>
      <Animated.View
        className="flex-row items-end gap-3 h-48"
        style={useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }))}
      >
        <View className="w-12 h-28 bg-teal-100/60 rounded-t-2xl border border-teal-200" />
        <View className="w-12 h-44 bg-teal-600 rounded-t-2xl shadow-2xl border border-teal-500" />
        <View className="w-12 h-36 bg-teal-800 rounded-t-2xl shadow-xl" />
        <View className="absolute -top-6 -right-6 bg-white p-3 rounded-full shadow-lg border border-teal-50">
          <TrendingUp size={32} color={BRAND_TEAL} strokeWidth={2.5} />
        </View>
      </Animated.View>
    </ShadowGlow>
  );
};

const AnimatedAccess = () => {
  const rotateY = useSharedValue(0);
  useEffect(() => {
    rotateY.value = withRepeat(withTiming(15, { duration: 3000 }), -1, true);
  }, [rotateY]);
  return (
    <ShadowGlow>
      <Animated.View
        style={useAnimatedStyle(() => ({
          transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
        }))}
      >
        <View className="w-64 h-40 bg-teal-800 rounded-3xl shadow-2xl items-center justify-center border border-teal-600">
          <Sparkles size={50} color="white" />
          <View className="absolute -top-6 -right-6 w-16 h-16 bg-white rounded-full shadow-lg items-center justify-center border border-teal-50">
            <Text className="text-teal-900 font-bold text-2xl">$</Text>
          </View>
        </View>
      </Animated.View>
    </ShadowGlow>
  );
};

const AnimatedRates = () => {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotate]);
  return (
    <ShadowGlow>
      <Animated.View
        style={useAnimatedStyle(() => ({
          transform: [{ rotate: `${rotate.value}deg` }],
        }))}
        className="w-64 h-64 items-center justify-center"
      >
        <View className="absolute top-0 w-16 h-16 bg-white rounded-full shadow-2xl border border-teal-50 items-center justify-center">
          <Text className="font-bold text-teal-900 text-xl">€</Text>
        </View>
        <View className="absolute bottom-0 w-16 h-16 bg-white rounded-full shadow-2xl border border-teal-50 items-center justify-center">
          <Text className="font-bold text-teal-900 text-xl">₦</Text>
        </View>
        <ArrowUpDown size={120} color={BRAND_TEAL} strokeWidth={1} />
      </Animated.View>
    </ShadowGlow>
  );
};

const AnimatedGlobe = () => {
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  useEffect(() => {
    rotateY.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false,
    );
    rotateZ.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotateY, rotateZ]);
  return (
    <ShadowGlow>
      <Animated.View
        style={useAnimatedStyle(() => ({
          transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
        }))}
      >
        <Globe size={240} color={BRAND_TEAL} strokeWidth={0.5} />
      </Animated.View>
      <Animated.View
        className="absolute w-[300px] h-[300px] rounded-full border-2 border-teal-100 border-dashed"
        style={useAnimatedStyle(() => ({
          transform: [{ rotate: `${rotateY.value}deg` }],
        }))}
      />
    </ShadowGlow>
  );
};

export default function StartScreen() {
  const router = useRouter();
  const { setColorScheme } = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<any>(null);

  const scalePrimary = useSharedValue(1);
  const scaleSecondary = useSharedValue(1);
  const primaryButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scalePrimary.value }],
  }));
  const secondaryButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSecondary.value }],
  }));

  useEffect(() => {
    setColorScheme('light');
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
  };

  useEffect(() => {
    if (!showSplash) resetTimer();
    return () => clearInterval(timerRef.current);
  }, [showSplash, currentIndex]);

  const handleManual = (type: 'next' | 'prev') => {
    setDirection(type);
    if (type === 'next') {
      setCurrentIndex((p) => (p + 1) % SLIDES.length);
    } else {
      setCurrentIndex((p) => (p - 1 + SLIDES.length) % SLIDES.length);
    }
    resetTimer();
  };

  const renderAnimation = () => {
    switch (currentIndex) {
      case 0:
        return <AnimatedPaid />;
      case 1:
        return <AnimatedFX />;
      case 2:
        return <AnimatedAccess />;
      case 3:
        return <AnimatedRates />;
      case 4:
        return <AnimatedGlobe />;
      default:
        return <AnimatedPaid />;
    }
  };

  if (showSplash) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <StatusBar style="dark" />
        <Animated.View entering={FadeIn} exiting={FadeOut} className="items-center">
          <Text className="text-teal-900 text-6xl font-black tracking-tighter">
            GreenCard
          </Text>
          <View className="h-1.5 w-12 bg-teal-800 rounded-full my-6" />
          <Text className="text-neutral-400 text-lg font-medium">
            Your Passport to Global Earnings
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        className="z-50 flex-row"
      >
        <Pressable className="w-1/2 h-[75%]" onPress={() => handleManual('prev')} />
        <Pressable className="w-1/2 h-[75%]" onPress={() => handleManual('next')} />
      </View>

      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center">
          <View
            className="h-[380px] justify-center items-center"
            style={{ overflow: 'visible' }}
          >
            <Animated.View
              key={`anim-${currentIndex}`}
              entering={
                direction === 'next'
                  ? SlideInRight.duration(800)
                  : SlideInLeft.duration(800)
              }
              exiting={
                direction === 'next'
                  ? SlideOutLeft.duration(800)
                  : SlideOutRight.duration(800)
              }
            >
              {renderAnimation()}
            </Animated.View>
          </View>

          <View className="px-10 mt-6 h-[125px] justify-center">
            <Animated.View key={`text-${currentIndex}`} entering={FadeIn.duration(400)}>
              <Text className="text-neutral-950 text-[34px] font-black tracking-[-0.03em] leading-[40px] text-center mb-4">
                {SLIDES[currentIndex].title}
              </Text>
              <Text className="text-neutral-600 text-[17px] leading-[26px] font-medium text-center">
                {SLIDES[currentIndex].description}
              </Text>
            </Animated.View>
          </View>

          <View className="p-8 pb-10">
            <View className="flex-row justify-center gap-3 mb-8">
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  className={`rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-teal-800 w-9 h-2.5' : 'bg-neutral-200 w-2.5 h-2.5'}`}
                />
              ))}
            </View>

            <View className="gap-4">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push('/(public)/signup-step1')}
              >
                <Animated.View
                  style={primaryButtonStyle}
                  className="bg-teal-800 py-6 rounded-3xl items-center shadow-xl shadow-teal-900/30"
                >
                  <Text className="text-white text-xl font-bold">Create account</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push('/(public)/login')}
              >
                <Animated.View
                  style={secondaryButtonStyle}
                  className="border-2 border-neutral-400 py-[18px] rounded-3xl items-center bg-white shadow-sm"
                >
                  <Text className="text-neutral-900 text-lg font-semibold">Log in</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
