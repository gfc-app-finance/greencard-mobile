import {
  ChevronRight,
  Landmark,
  Receipt,
  Search,
  Send,
  Smartphone,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

export default function PaymentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-slate-900 text-2xl font-black tracking-tight">
            Payments
          </Text>
          <Text className="text-slate-500 text-sm font-medium mt-1">
            Send money and pay bills globally
          </Text>
        </View>

        <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 py-4 mb-8 border border-slate-100">
          <Search size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search name, bank, or @tag"
            className="flex-1 ml-3 font-semibold text-slate-900"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View className="flex-row flex-wrap justify-between mb-10">
          {[
            {
              label: 'Bank Transfer',
              icon: <Landmark size={24} color={Colors.primary} />,
              color: '#F0FDFA',
            },
            {
              label: 'Airtime/Data',
              icon: <Smartphone size={24} color="#6366F1" />,
              color: '#EEF2FF',
            },
            {
              label: 'Pay Bills',
              icon: <Receipt size={24} color="#F59E0B" />,
              color: '#FFFBEB',
            },
            {
              label: 'GCF Tag',
              icon: <Send size={24} color="#EC4899" />,
              color: '#FDF2F8',
            },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className="w-[48%] bg-white border border-slate-100 rounded-3xl p-5 mb-4 shadow-sm"
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </View>
              <Text className="text-slate-900 font-black text-sm">{item.label}</Text>
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                Instant
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-slate-900 text-lg font-black">Recent Recipients</Text>
          <TouchableOpacity>
            <Text className="text-teal-700 font-bold text-sm">Add New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-10"
        >
          {[
            { name: 'Sodiq', initials: 'SO', color: '#DFF4F1' },
            { name: 'Wale', initials: 'WA', color: '#F5F3FF' },
            { name: 'Amaka', initials: 'AM', color: '#FFFBEB' },
            { name: 'Tunde', initials: 'TU', color: '#FDF2F8' },
          ].map((person, i) => (
            <TouchableOpacity key={i} className="items-center mr-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: person.color }}
              >
                <Text className="font-black text-slate-800">{person.initials}</Text>
              </View>
              <Text className="text-slate-600 text-xs font-bold">{person.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity className="bg-slate-900 rounded-[24px] p-6 flex-row items-center justify-between mb-10">
          <View className="flex-1">
            <Text className="text-white font-black text-lg">Scheduled Payments</Text>
            <Text className="text-slate-400 text-xs font-medium mt-1">
              You have 2 payments due this week
            </Text>
          </View>
          <View className="bg-white/10 p-2 rounded-full">
            <ChevronRight size={24} color="white" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
