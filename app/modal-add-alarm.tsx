// app/modal-add-alarm.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { ChevronLeft } from 'lucide-react-native';
import { useAlarmStore } from '@/src/store/alarmStore';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddAlarmModal() {
  const router = useRouter();
  const { addAlarm, scheduleAlarmNotification } = useAlarmStore();
  const [time, setTime] = useState(new Date());
  const [isPickerVisible, setPickerVisibility] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(true);

  const showDatePicker = () => setPickerVisibility(true);
  const hideDatePicker = () => setPickerVisibility(false);

  const handleConfirm = (selectedTime: Date) => {
    setTime(selectedTime);
    hideDatePicker();
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveAlarm = async () => {
    const newAlarm = {
      id: Date.now().toString(),
      time: time.toISOString(),
      days: selectedDays,
      sound: 'default', // MVP: basic sound
      isActive: isAlarmActive,
      notificationId: null, // Will be set by scheduleAlarmNotification
    };
    
    if (isAlarmActive) {
      const notificationId = await scheduleAlarmNotification(newAlarm);
      if (notificationId) {
        newAlarm.notificationId = notificationId; // Store the notification ID
        addAlarm(newAlarm);
        router.back();
      } else {
        // Handle error: notification could not be scheduled
        alert("Failed to schedule alarm notification. Please check permissions.");
      }
    } else {
      addAlarm(newAlarm); // Add inactive alarm
      router.back();
    }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-900 p-5 pt-10">
      {router.canGoBack() && (
         <TouchableOpacity onPress={() => router.back()} className="mb-5 p-2 self-start">
            <ChevronLeft size={28} color="white" />
        </TouchableOpacity>
      )}
      <Text className="text-3xl font-bold text-white mb-8 text-center">Set Alarm Time</Text>

      <TouchableOpacity onPress={showDatePicker} className="bg-neutral-800 p-4 rounded-lg mb-6">
        <Text className="text-white text-2xl text-center">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={time}
        is24Hour
      />

      <Text className="text-xl font-semibold text-white mb-3">Repeat</Text>
      <View className="flex-row justify-around mb-8 bg-neutral-800 p-3 rounded-lg">
        {daysOfWeek.map(day => (
          <TouchableOpacity
            key={day}
            onPress={() => toggleDay(day)}
            className={`p-3 rounded-full w-12 h-12 items-center justify-center ${selectedDays.includes(day) ? 'bg-indigo-600' : 'bg-neutral-700'}`}
          >
            <Text className={`font-medium ${selectedDays.includes(day) ? 'text-white' : 'text-neutral-300'}`}>{day.slice(0,1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className="flex-row justify-between items-center bg-neutral-800 p-4 rounded-lg mb-8">
        <Text className="text-lg text-white">Active</Text>
        <Switch
            trackColor={{ false: "#767577", true: "#818cf8" }}
            thumbColor={isAlarmActive ? "#4f46e5" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setIsAlarmActive}
            value={isAlarmActive}
        />
      </View>


      <TouchableOpacity
        onPress={handleSaveAlarm}
        className="bg-green-500 p-4 rounded-lg items-center"
      >
        <Text className="text-white text-lg font-bold">Save Alarm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}