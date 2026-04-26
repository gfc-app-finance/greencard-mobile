import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Fingerprint,
  HelpCircle,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useSession } from '@/hooks/use-session';

export default function AccountScreen() {
  const router = useRouter();
  const { signOut } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(public)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full bg-teal-50 items-center justify-center border-4 border-white shadow-lg mb-4">
            <Text className="text-teal-700 text-3xl font-black">AJ</Text>
          </View>
          <Text className="text-slate-900 text-2xl font-black tracking-tight">
            Alex Johnson
          </Text>
          <Text className="text-slate-500 font-medium">alex.johnson@example.com</Text>

          <TouchableOpacity className="mt-4 px-6 py-2 bg-slate-100 rounded-full">
            <Text className="text-slate-700 font-bold text-sm">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-10">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">
            Security & Privacy
          </Text>

          <View className="bg-slate-50 rounded-[24px] overflow-hidden border border-slate-100">
            {[
              {
                label: 'Face ID / Biometrics',
                icon: <Fingerprint size={20} color="#475569" />,
                type: 'toggle',
              },
              {
                label: 'Security Center',
                icon: <ShieldCheck size={20} color="#475569" />,
                type: 'link',
              },
              {
                label: 'Notifications',
                icon: <Bell size={20} color="#475569" />,
                type: 'link',
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                className={`flex-row items-center justify-between p-5 ${i !== 2 ? 'border-b border-slate-100' : ''}`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-4">
                    {item.icon}
                  </View>
                  <Text className="text-slate-900 font-bold">{item.label}</Text>
                </View>
                {item.type === 'toggle' ? (
                  <Switch value={true} trackColor={{ true: Colors.primary }} />
                ) : (
                  <ChevronRight size={20} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">
            Support
          </Text>
          <View className="bg-slate-50 rounded-[24px] overflow-hidden border border-slate-100">
            <TouchableOpacity className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-4">
                  <HelpCircle size={20} color="#475569" />
                </View>
                <Text className="text-slate-900 font-bold">Help & Support</Text>
              </View>
              <ChevronRight size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="flex-row items-center justify-center p-6 bg-red-50 rounded-[24px] border border-red-100 mb-10"
        >
          <LogOut size={20} color={Colors.danger} />
          <Text className="text-red-600 font-black ml-3 text-lg">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-slate-300 text-xs font-bold mb-10">
          GREENCARD MOBILE V1.0.4
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
