// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { AlarmClock, BedDouble, BarChart3 } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors'; 

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="alarm"
        options={{
          title: 'Alarms',
          tabBarIcon: ({ color }) => <AlarmClock color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color }) => <BedDouble color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}