import { ArrowDownLeft, ArrowUpRight, Bell, Plus, Wallet } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-slate-500 text-sm font-medium">Good Morning,</Text>
            <Text className="text-slate-900 text-2xl font-black tracking-tight">
              Alex Johnson
            </Text>
          </View>
          <TouchableOpacity className="p-3 rounded-full bg-slate-50 border border-slate-100">
            <Bell size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <View
          className="rounded-[32px] p-8 mb-8 shadow-xl shadow-teal-900/20"
          style={{ backgroundColor: Colors.primary }}
        >
          <View className="flex-row items-center mb-2">
            <Wallet size={16} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 ml-2 font-semibold text-xs uppercase tracking-widest">
              Total Balance
            </Text>
          </View>
          <Text className="text-white text-4xl font-black tracking-tighter mb-6">
            $12,480.00
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-white/20 h-14 rounded-2xl flex-row items-center justify-center border border-white/10">
              <Plus size={20} color="white" />
              <Text className="text-white font-bold ml-2">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white h-14 rounded-2xl flex-row items-center justify-center">
              <ArrowUpRight size={20} color={Colors.primary} />
              <Text className="font-bold ml-2" style={{ color: Colors.primary }}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-slate-900 text-lg font-black mb-4">Quick Actions</Text>
        <View className="flex-row justify-between mb-8">
          {[
            {
              label: 'Cards',
              icon: <Plus size={24} color={Colors.primary} />,
              color: '#F0FDFA',
            },
            {
              label: 'Bills',
              icon: <ArrowDownLeft size={24} color="#6366F1" />,
              color: '#EEF2FF',
            },
            { label: 'Save', icon: <Plus size={24} color="#F59E0B" />, color: '#FFFBEB' },
            {
              label: 'Limit',
              icon: <Plus size={24} color="#EC4899" />,
              color: '#FDF2F8',
            },
          ].map((item, i) => (
            <View key={i} className="items-center">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </View>
              <Text className="text-slate-600 text-xs font-bold">{item.label}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-slate-900 text-lg font-black">Recent Activity</Text>
          <Text className="text-teal-700 font-bold text-sm">See all</Text>
        </View>

        <View className="bg-slate-50 rounded-[24px] p-4 mb-10 border border-slate-100">
          <Text className="text-slate-400 text-center py-4 font-medium italic">
            No recent transactions to show yet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
