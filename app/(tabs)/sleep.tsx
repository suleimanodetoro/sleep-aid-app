// app/(tabs)/sleep.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MoonStar } from 'lucide-react-native';

export default function SleepScreen() {
  const router = useRouter();

  const handleStartSleepSession = () => {
    router.push('/sleep-session');
  };

  return (
    <View className="flex-1 justify-center items-center p-5 bg-neutral-900">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Ready to Wind Down?</Text>
      <TouchableOpacity
        onPress={handleStartSleepSession}
        className="bg-indigo-600 p-6 rounded-full shadow-lg flex-row items-center"
      >
        <MoonStar size={32} color="white" className="mr-3" />
        <Text className="text-white text-xl font-semibold">Start Sleep Session</Text>
      </TouchableOpacity>
      <Text className="text-neutral-400 mt-6 text-center px-4">
        This will start a focused session with calming sounds to help you relax and fall asleep.
      </Text>
    </View>
  );
}