// app/sleep-session.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, BackHandler } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { XCircle, PlayCircle, PauseCircle, Volume2, VolumeX } from 'lucide-react-native';

// Mock sounds - replace with actual sound files in assets/sounds/
const SOUNDS = [
  { id: '1', title: 'Rain', file: require('../assets/sounds/rain.mp3') }, // Placeholder
  { id: '2', title: 'Forest Ambience', file: require('../assets/sounds/forest.mp3') }, // Placeholder
  { id: '3', title: 'White Noise', file: require('../assets/sounds/whitenoise.mp3') }, // Placeholder
];
// IMPORTANT: You'll need to create these dummy .mp3 files in assets/sounds/
// e.g., assets/sounds/rain.mp3, assets/sounds/forest.mp3, assets/sounds/whitenoise.mp3
// They can be short, silent files for the MVP if you don't have actual sounds yet.

export default function SleepSessionScreen() {
  const router = useRouter();
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [currentSound, setCurrentSound] = useState<{id: string, title: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Configure audio mode to play in background (iOS) and duck others (Android)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true, // Important for background play
      interruptionModeIOS: Audio.InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      soundObject?.unloadAsync(); // Unload sound when component unmounts
    };
  }, [soundObject]);

  // Prevent back button during session (simulated lockdown)
  useEffect(() => {
    const backAction = () => {
      // Optionally show a confirm dialog before exiting
      return true; 
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);


  const playSound = async (soundItem: typeof SOUNDS[0]) => {
    if (soundObject) {
      await soundObject.unloadAsync();
    }
    try {
      const { sound } = await Audio.Sound.createAsync(soundItem.file, { isLooping: true });
      setSoundObject(sound);
      setCurrentSound(soundItem);
      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error loading or playing sound:", error);
      alert("Error: Could not play sound.");
    }
  };

  const togglePlayPause = async () => {
    if (!soundObject) return;
    if (isPlaying) {
      await soundObject.pauseAsync();
    } else {
      await soundObject.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = async () => {
    if (!soundObject) return;
    await soundObject.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleEndSession = async () => {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
    }
    setSoundObject(null);
    setCurrentSound(null);
    setIsPlaying(false);
    router.replace('/(tabs)/sleep');
  };

  const SoundItem = ({ item }: { item: typeof SOUNDS[0] }) => (
    <TouchableOpacity
      onPress={() => playSound(item)}
      className={`p-4 rounded-lg mb-3 ${currentSound?.id === item.id ? 'bg-indigo-700' : 'bg-neutral-700'}`}
    >
      <Text className="text-white text-lg">{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-neutral-950 p-5 pt-16 items-center">
      <TouchableOpacity onPress={handleEndSession} className="absolute top-16 right-5 p-2">
        <XCircle size={32} color="white" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-white mb-2 mt-8">Sleep Session</Text>
      <Text className="text-neutral-400 mb-8">Select a sound to begin relaxation.</Text>

      <View className="w-full max-w-md mb-8">
        <FlatList
          data={SOUNDS}
          renderItem={SoundItem}
          keyExtractor={(item) => item.id}
        />
      </View>

      {currentSound && (
        <View className="items-center p-4 bg-neutral-800 rounded-lg w-full max-w-md">
          <Text className="text-xl text-white font-semibold mb-4">Now Playing: {currentSound.title}</Text>
          <View className="flex-row items-center justify-around w-full">
            <TouchableOpacity onPress={toggleMute} className="p-3">
              {isMuted ? <VolumeX size={36} color="white" /> : <Volume2 size={36} color="white" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} className="p-3">
              {isPlaying ? <PauseCircle size={64} color="#34D399" /> : <PlayCircle size={64} color="#34D399" />}
            </TouchableOpacity>
             {/* Placeholder for timer or other controls */}
            <View style={{width: 36}} /> 
          </View>
        </View>
      )}
    </View>
  );
}