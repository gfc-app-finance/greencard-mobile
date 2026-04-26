import { Eye, Lock, Plus, Settings, Snowflake } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

export default function CardsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-slate-900 text-2xl font-black tracking-tight">
            Your Cards
          </Text>
          <TouchableOpacity className="p-3 rounded-full bg-slate-50 border border-slate-100">
            <Plus size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          className="w-full aspect-[1.6/1] rounded-[24px] p-6 mb-8 shadow-2xl shadow-teal-900/40 overflow-hidden"
          style={{ backgroundColor: Colors.primary }}
        >
          <View className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />

          <View className="flex-row justify-between items-start">
            <Text className="text-white/80 font-bold text-sm uppercase tracking-widest">
              Virtual Card
            </Text>
            <Text className="text-white font-black italic text-xl">GREENCARD</Text>
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-white text-2xl font-bold tracking-[4px]">
              •••• •••• •••• 4821
            </Text>
          </View>

          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-white/60 text-[10px] uppercase font-bold mb-1">
                Card Holder
              </Text>
              <Text className="text-white font-bold text-sm">ALEX JOHNSON</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/60 text-[10px] uppercase font-bold mb-1">
                Expires
              </Text>
              <Text className="text-white font-bold text-sm">08/28</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between mb-10">
          {[
            { label: 'Show Info', icon: <Eye size={20} color="#475569" /> },
            { label: 'Freeze', icon: <Snowflake size={20} color="#475569" /> },
            { label: 'Settings', icon: <Settings size={20} color="#475569" /> },
          ].map((action, i) => (
            <TouchableOpacity key={i} className="items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-2">
                {action.icon}
              </View>
              <Text className="text-slate-600 text-xs font-bold">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-slate-900 text-lg font-black mb-4">Card Activity</Text>
        <View className="bg-slate-50 rounded-[24px] p-8 border border-slate-100 border-dashed items-center justify-center">
          <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center mb-4">
            <Settings size={24} color="#94A3B8" />
          </View>
          <Text className="text-slate-500 font-bold text-center">
            No transactions yet
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            Your card spend will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
