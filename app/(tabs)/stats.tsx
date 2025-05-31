// app/(tabs)/stats.tsx
import { useAlarmStore } from '@/src/store/alarmStore';
import React from 'react';
import { View, Text } from 'react-native';

export default function StatsScreen() {
  const { alarms } = useAlarmStore(); 

  return (
    <View className="flex-1 justify-center items-center p-5 bg-neutral-900">
      <Text className="text-2xl font-bold text-white mb-4">Sleep Stats</Text>
      <Text className="text-lg text-neutral-300">Total Alarms Set: {alarms.length}</Text>
      <Text className="text-neutral-400 mt-10 text-center">
        More detailed sleep statistics and trends will be available in future updates.
      </Text>
    </View>
  );
}