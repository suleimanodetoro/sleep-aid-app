// app/alarm-ringing.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { Audio } from 'expo-audio';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { BellOff } from 'lucide-react-native';
import { useAlarmStore } from '@/src/store/alarmStore';

export default function AlarmRingingScreen() {
  const router = useRouter();
  const { alarmId } = useLocalSearchParams<{ alarmId: string }>();
  const { getAlarmById, cancelAlarmNotification, updateAlarm } = useAlarmStore();
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [alarmDetails, setAlarmDetails] = useState(null);

  useEffect(() => {
    if (alarmId) {
      const currentAlarm = getAlarmById(alarmId);
      setAlarmDetails(currentAlarm);
    }
  }, [alarmId, getAlarmById]);

  // Play alarm sound
  useEffect(() => {
    const playSound = async () => {
      try {

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/default-alarm.mp3') // MAKE SURE YOU HAVE THIS FILE
        );
        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
        setSoundObject(sound);
      } catch (error) {
        console.error("Failed to play sound", error);
      }
    };
    playSound();

    return () => {
      soundObject?.unloadAsync();
    };
  }, []);

  // Prevent back button
  useEffect(() => {
    const backAction = () => {
      return true; // Prevent back button
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);


  const handleDismiss = async () => {
    await soundObject?.stopAsync();
    await soundObject?.unloadAsync();

    if (alarmId) {
      await cancelAlarmNotification(alarmId); // This cancels the OS notification
      
      // If it's a non-repeating alarm, mark it as inactive
      if (alarmDetails && alarmDetails.days.length === 0) {
        updateAlarm(alarmId, { ...alarmDetails, isActive: false, notificationId: null });
      } else if (alarmDetails) {
        // For repeating alarms, re-schedule for the next occurrence (more complex, for future)
        // For MVP, we just dismiss. The store's scheduleAlarmNotification handles repeats.
        // We need to ensure the original notificationId is cleared if it was a one-time trigger from a repeating alarm.
        // Or, if the alarm is still active, it will be rescheduled by the store logic.
        // For now, let's assume the alarm store handles rescheduling if necessary.
      }
    }
    router.replace('/(tabs)/alarm'); // Go back to alarm list
  };

  if (!alarmDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-red-700 p-5">
        <Text className="text-white text-2xl">Loading alarm...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-red-600 p-10">
      <Text className="text-white text-6xl font-bold mb-4 animate-pulse">ALARM!</Text>
      <Text className="text-white text-3xl mb-12">
        {new Date(alarmDetails.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      
      {/* MVP: Simple dismiss. Future: Add challenges here */}
      <TouchableOpacity
        onPress={handleDismiss}
        className="bg-white p-6 rounded-full shadow-2xl flex-row items-center"
      >
        <BellOff size={32} color="red" className="mr-3" />
        <Text className="text-red-600 text-2xl font-bold">Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}