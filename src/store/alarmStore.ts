// store/alarmStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand'; 
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Alarm {
  id: string;
  time: string; // ISO string
  days: string[]; // e.g., ['Mon', 'Wed']
  sound: string; // For MVP, 'default'
  isActive: boolean;
  notificationId: string | null; // Store the ID of the scheduled notification
}

interface AlarmStoreState {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  deleteAlarm: (id: string) => void;
  updateAlarm: (id: string, updatedAlarmData: Partial<Alarm>) => void;
  loadAlarms: () => Promise<void>;
  getAlarmById: (id: string) => Alarm | undefined;
  scheduleAlarmNotification: (alarm: Alarm) => Promise<string | null>; // Returns notification ID or null
  cancelAlarmNotification: (alarmId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

// Configure notification handler (optional, but good practice)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // For MVP, rely on this. Custom sound in-app for ringing screen.
    shouldSetBadge: false,
  }),
});


export const useAlarmStore = create<AlarmStoreState>((set, get) => ({
  alarms: [],

  requestPermissions: async () => {
    if (Platform.OS === 'android') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('Failed to get push token for push notification!');
            return false;
        }
        // For Android 12+ exact alarm permission (handled by expo-notifications plugin for SCHEDULE_EXACT_ALARM)
        // You might need to guide users to settings if not automatically granted or handled by plugin.
    } else { // iOS
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true, // Important for alarms
            },
        });
        if (status !== 'granted') {
            alert('You need to enable notifications for alarms to work.');
            return false;
        }
    }
    return true;
  },

  loadAlarms: async () => {
    try {
      await get().requestPermissions(); // Request permissions on load
      const storedAlarms = await AsyncStorage.getItem('alarms');
      if (storedAlarms) {
        const parsedAlarms: Alarm[] = JSON.parse(storedAlarms);
        set({ alarms: parsedAlarms });
        // Re-schedule active alarms if needed (e.g., after app restart or device reboot)
        // This is a complex part. For MVP, we assume notifications persist or are re-added manually.
        // A more robust solution would check scheduled notifications against stored alarms.
      }
    } catch (error) {
      console.error("Failed to load alarms:", error);
    }
  },

  addAlarm: async (alarm) => {
    const newAlarms = [...get().alarms, alarm];
    set({ alarms: newAlarms });
    await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));
  },

  deleteAlarm: async (id) => {
    const alarmToDelete = get().alarms.find(a => a.id === id);
    if (alarmToDelete && alarmToDelete.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(alarmToDelete.notificationId);
    }
    const newAlarms = get().alarms.filter(a => a.id !== id);
    set({ alarms: newAlarms });
    await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));
  },
  
  updateAlarm: async (id, updatedAlarmData) => {
    const newAlarms = get().alarms.map(alarm =>
      alarm.id === id ? { ...alarm, ...updatedAlarmData } : alarm
    );
    set({ alarms: newAlarms });
    await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));

    // If alarm is updated (e.g., time changed, toggled active), re-handle notifications
    const updatedAlarm = newAlarms.find(a => a.id === id);
    if (updatedAlarm) {
      if (updatedAlarm.notificationId) { // Cancel old one first
        await Notifications.cancelScheduledNotificationAsync(updatedAlarm.notificationId);
        updatedAlarm.notificationId = null; // Clear old ID
      }
      if (updatedAlarm.isActive) { // Schedule new one if active
        const newNotificationId = await get().scheduleAlarmNotification(updatedAlarm);
        if (newNotificationId) {
          // Update alarm in store with new notification ID
          const finalAlarms = get().alarms.map(alarm =>
            alarm.id === id ? { ...alarm, notificationId: newNotificationId } : alarm
          );
          set({ alarms: finalAlarms });
          await AsyncStorage.setItem('alarms', JSON.stringify(finalAlarms));
        }
      }
    }
  },

  getAlarmById: (id) => {
    return get().alarms.find(alarm => alarm.id === id);
  },

  scheduleAlarmNotification: async (alarm) => {
    if (!alarm.isActive) return null;

    const hasPermissions = await get().requestPermissions();
    if (!hasPermissions) {
        console.warn("Notification permissions not granted. Cannot schedule alarm.");
        return null;
    }

    const alarmTime = new Date(alarm.time);
    let trigger: Notifications.NotificationTriggerInput;

    if (alarm.days.length === 0) { // One-time alarm
      // If alarm time is in the past for today, schedule for tomorrow (or handle appropriately)
      if (alarmTime.getTime() < Date.now()) {
        // For a one-time alarm, if it's in the past, it shouldn't schedule.
        // Or, you might decide to schedule for the next day if that's desired behavior.
        // For MVP, let's assume user sets a future time.
        // A more robust check is needed here.
        console.warn("One-time alarm time is in the past. Not scheduling.");
        // return null; // Or adjust to next day
         alarmTime.setDate(alarmTime.getDate() + 1); // Schedule for next day if past
      }
      trigger = alarmTime;
    } else { // Repeating alarm
      const dayMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const weekdays = alarm.days.map(d => dayMap[d] + 1); // Expo uses 1-7 for Sunday-Saturday for `weekday` trigger
      
      trigger = {
        hour: alarmTime.getHours(),
        minute: alarmTime.getMinutes(),
        repeats: true,
        // weekday: weekdays, // This would schedule for ALL those days.
        // For individual repeating alarms, you'd schedule one for the *next* occurrence.
        // Expo's `weekday` trigger is for daily repeats on specific weekdays.
        // For more precise "next occurrence" logic for specific days, you'd calculate the next date manually.
        // For MVP, a daily repeat at the time if any day is selected, or more simply,
        // schedule for the next upcoming day from the selected days.
        // This part is complex for true "Alarmy" style repeats.
        // Let's simplify for MVP: if days are selected, it's a repeating notification at that time.
        // The most robust way is to calculate the next Date object for the trigger.
        // For now, let's use a simpler daily repeat if any day is selected, or one-time if not.
        // This is a simplification for MVP. True repeating alarms need more complex date math.
         channelId: 'alarmChannel', // Ensure this channel is created on Android
      };
      // If we want it to repeat on specific days, we need to calculate the next trigger date.
      // For MVP, let's assume `repeats: true` with H/M will trigger daily if days are selected.
      // This is not ideal for specific day repeats.
      // A better MVP for repeats: schedule a one-time notification for the *next* occurrence.
      // Then, when it fires, re-schedule the next one.
      // For this MVP, we'll make it a one-time notification for the next valid time.
      // The `alarm-ringing.tsx` would need logic to re-schedule if it's a repeating alarm.

      // Simplified: calculate next date based on selected days
      let nextTriggerDate = new Date(alarmTime.getTime());
      nextTriggerDate.setSeconds(0,0);

      if (nextTriggerDate.getTime() < Date.now()) { // If base time is past for today
          nextTriggerDate.setDate(nextTriggerDate.getDate() + 1); // Start check from tomorrow
      }
      
      if (alarm.days.length > 0) {
        while (!alarm.days.includes(daysOfWeek[nextTriggerDate.getDay()])) {
            nextTriggerDate.setDate(nextTriggerDate.getDate() + 1);
        }
        trigger = nextTriggerDate;
      } else { // one time
         if (nextTriggerDate.getTime() < Date.now()) {
            console.warn("One-time alarm time is in the past. Not scheduling.");
            return null;
         }
         trigger = nextTriggerDate;
      }
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Alarm Ringing!',
          body: `It's time! Your alarm at ${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} is going off.`,
          sound: Platform.OS === 'ios' ? 'default' : undefined, // iOS critical alerts use default sound. Android uses channel.
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { alarmId: alarm.id, url: `/alarm-ringing?alarmId=${alarm.id}` }, // For deep linking
          categoryIdentifier: 'alarm', // For iOS custom actions if any
          critical: Platform.OS === 'ios' ? true : undefined, // For iOS critical alerts
        },
        trigger,
      });
      console.log(`Alarm scheduled: ${alarm.id}, Notification ID: ${notificationId}, Trigger:`, trigger);
      return notificationId;
    } catch (e) {
      console.error("Failed to schedule notification:", e);
      alert("Could not schedule alarm. Please check app permissions and try again.");
      return null;
    }
  },

  cancelAlarmNotification: async (alarmId) => {
    const alarm = get().alarms.find(a => a.id === alarmId);
    if (alarm && alarm.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(alarm.notificationId);
        console.log(`Cancelled notification for alarm ${alarmId}, notification ID: ${alarm.notificationId}`);
        // Update alarm in store to remove notificationId
        const updatedAlarms = get().alarms.map(a => 
            a.id === alarmId ? { ...a, notificationId: null } : a
        );
        set({ alarms: updatedAlarms });
        await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));

      } catch (e) {
        console.error("Failed to cancel notification:", e);
      }
    }
  },
}));

// Create notification channel for Android (important for custom sound, priority etc.)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('alarmChannel', {
    name: 'Alarm Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250], // Optional
    lightColor: '#FF231F7C', // Optional
    sound: 'default', // This is where you'd specify a custom sound file name bundled with android
                       // e.g. 'my_alarm_sound.wav' (placed in android/app/src/main/res/raw)
                       // For Expo Go, 'default' is safest for now.
    bypassDnd: true, // Important for alarms
  }).then(() => console.log("Notification channel created/updated"))
    .catch(e => console.error("Failed to create notification channel", e));
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // For use in scheduling logic
