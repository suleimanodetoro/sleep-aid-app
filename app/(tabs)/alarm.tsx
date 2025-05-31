// app/(tabs)/alarm.tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, AppState } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { PlusCircle, Trash2 } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAlarmStore } from '@/src/store/alarmStore';

// Basic Alarm Card Component
const AlarmCard = ({ alarm, onDelete }) => (
  <View className="bg-neutral-800 p-4 rounded-lg mb-3 shadow">
    <View className="flex-row justify-between items-center">
      <Text className="text-3xl font-bold text-white">
        {new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <TouchableOpacity onPress={() => onDelete(alarm.id)} className="p-2">
        <Trash2 size={24} color="tomato" />
      </TouchableOpacity>
    </View>
    <Text className="text-sm text-neutral-400">
      Repeats: {alarm.days.length > 0 ? alarm.days.join(', ') : 'Once'}
    </Text>
    <Text className="text-sm text-neutral-400">
      Active: {alarm.isActive ? 'Yes' : 'No'}
    </Text>
  </View>
);

export default function AlarmScreen() {
  const { alarms, loadAlarms, deleteAlarm, scheduleAlarmNotification, cancelAlarmNotification } = useAlarmStore();
  const router = useRouter();

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  // Handle notification responses (e.g., user taps notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const alarmId = response.notification.request.content.data?.alarmId;
      if (alarmId) {
        router.push({ pathname: '/alarm-ringing', params: { alarmId } });
      }
    });
    return () => subscription.remove();
  }, [router]);

  // Handle notifications received while app is foregrounded
   useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const alarmId = notification.request.content.data?.alarmId;
      if (alarmId && AppState.currentState === 'active') {
         // Optionally, directly navigate to ringing screen or show in-app alert
        router.push({ pathname: '/alarm-ringing', params: { alarmId } });
      }
    });
    return () => subscription.remove();
  }, [router]);


  const handleDeleteAlarm = async (id: string) => {
    Alert.alert("Delete Alarm", "Are you sure you want to delete this alarm?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await cancelAlarmNotification(id); // Cancel notification first
          deleteAlarm(id); // Then delete from store
        }
      }
    ]);
  };

  return (
    <View className="flex-1 p-5 bg-neutral-900">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-3xl font-bold text-white">Your Alarms</Text>
        <Link href="/modal-add-alarm" asChild>
          <TouchableOpacity className="p-2">
            <PlusCircle size={32} color="#34D399" />
          </TouchableOpacity>
        </Link>
      </View>

      {alarms.length === 0 ? (
        <Text className="text-center text-neutral-400 mt-10">No alarms set yet. Tap '+' to add one!</Text>
      ) : (
        <FlatList
          data={alarms}
          renderItem={({ item }) => <AlarmCard alarm={item} onDelete={handleDeleteAlarm} />}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}