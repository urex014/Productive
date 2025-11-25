// app/study.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  Dimensions,
  Platform
} from "react-native";
  import { BASE_URL } from "../baseUrl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, Award, Clock, ChevronLeft, Play, Pause, RotateCcw, X, AlertTriangle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// ---------------- Duration Picker Component ----------------

const DurationPicker = ({ onSetDuration, onClose }: { onSetDuration: (seconds: number) => void, onClose: () => void }) => {
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");

  const confirm = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const validHours = Math.max(0, h);
    const validMinutes = Math.min(Math.max(0, m), 59);
    const totalSeconds = validHours * 3600 + validMinutes * 60;
    onSetDuration(totalSeconds);
  };

  return (
    <View className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-[85%] relative">
      <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 z-10">
        <X color="#666" size={20} />
      </TouchableOpacity>
      
      <Text className="text-white text-xl font-bold mb-6 text-center tracking-wide">
        Target Duration
      </Text>

      <View className="flex-row justify-center items-center space-x-4 mb-8">
        {/* Hours */}
        <View className="items-center">
          <TextInput
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            className="w-20 h-20 text-center text-3xl font-bold text-white bg-black border border-white/10 rounded-2xl"
            maxLength={2}
          />
          <Text className="text-neutral-500 text-xs uppercase mt-2 font-bold tracking-widest">Hrs</Text>
        </View>

        <Text className="text-white text-3xl font-bold pb-6">:</Text>

        {/* Minutes */}
        <View className="items-center">
          <TextInput
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
            className="w-20 h-20 text-center text-3xl font-bold text-white bg-black border border-white/10 rounded-2xl"
            maxLength={2}
          />
          <Text className="text-neutral-500 text-xs uppercase mt-2 font-bold tracking-widest">Mins</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={confirm}
        className="rounded-xl overflow-hidden shadow-lg shadow-blue-500/20"
      >
        <LinearGradient
            colors={['#00F260', '#0575E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center"
        >
            <Text className="text-white font-bold text-base uppercase tracking-widest">Confirm Sync</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


// ---------------- Study Screen ----------------
export default function StudyScreen() {
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(1800); 
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);


  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // const BASE_URL = "http://192.168.100.191:5000";
  const navigation = useNavigation();

  // SVG Config
  const radius = width * 0.35;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / totalSeconds) * circumference;

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setSeconds(0);
  };

  const toggleTimer = () => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
    } else {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
            if(prev + 1 >= totalSeconds) {
                // Timer finished logic handled in useEffect
                return prev + 1;
            }
            return prev + 1;
        });
      }, 1000);
      setIsRunning(true);
    }
  };

  useEffect(() => {
    if (seconds >= totalSeconds && totalSeconds > 0 && isRunning) {
      updateStreak();
    }
  }, [seconds]);

  const updateStreak = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/streaks/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to update streak");

      const data = await res.json();
      setStreak({
        current: data.currentStreak,
        longest: data.longestStreak,
      });
      resetTimer();
      Toast.show({ type: 'success', text1: 'Session Complete!', text2: 'Streak updated.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: "Network error", text2: "Could not sync streak" });
      resetTimer();
    }
  };

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return {
        m: minutes.toString().padStart(2, "0"),
        s: seconds.toString().padStart(2, "0")
    };
  };

  const timeDisplay = formatTime(seconds);
  const targetDisplay = formatTime(totalSeconds);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#101010']} className="absolute inset-0" />

      <SafeAreaView className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/10"
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={"white"} />
          </TouchableOpacity>
          <View>
             <Text className="text-white text-xl font-bold text-center">Focus Mode</Text>
             <Text className="text-neutral-500 text-xs uppercase tracking-widest text-center">Deep Work Session</Text>
          </View>
          <View className="w-10" /> 
        </View>

        {/* Warning Badge */}
        <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex-row items-center mb-6">
            <AlertTriangle color="#fbbf24" size={20} />
            <Text className="text-yellow-500/90 text-xs ml-3 flex-1 font-medium">
                Leaving this screen will pause your progress. Stay focused to maintain your streak.
            </Text>
        </View>

        {/* Timer Visualization */}
        <View className="flex-1 items-center justify-center relative">
          
          {/* Background Glow */}
          <View className="absolute w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />

          <Svg height={radius * 2 + strokeWidth + 20} width={radius * 2 + strokeWidth + 20} className="mb-6">
            <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#00F260" stopOpacity="1" />
                    <Stop offset="1" stopColor="#0575E6" stopOpacity="1" />
                </SvgGradient>
            </Defs>
            
            {/* Background Track */}
            <Circle
              stroke="#1a1a1a"
              fill="none"
              cx={radius + strokeWidth / 2 + 10}
              cy={radius + strokeWidth / 2 + 10}
              r={radius}
              strokeWidth={strokeWidth}
            />
            
            {/* Progress Ring */}
            <Circle
              stroke="url(#grad)"
              fill="none"
              cx={radius + strokeWidth / 2 + 10}
              cy={radius + strokeWidth / 2 + 10}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              rotation="-90"
              origin={`${radius + strokeWidth / 2 + 10}, ${radius + strokeWidth / 2 + 10}`}
            />
          </Svg>

          {/* Time Text Overlay */}
          <View className="absolute items-center justify-center pb-6">
             <Text className="text-neutral-500 text-sm uppercase tracking-[0.2em] mb-2 font-bold">Elapsed</Text>
             <View className="flex-row items-baseline">
                <Text className="text-white text-7xl font-bold tabular-nums tracking-tighter shadow-lg shadow-black">
                    {timeDisplay.m}:{timeDisplay.s}
                </Text>
             </View>
             <Text className="text-neutral-500 text-sm mt-2 font-medium bg-white/5 px-3 py-1 rounded-full overflow-hidden">
                TARGET: {targetDisplay.m} MIN
             </Text>
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row justify-center items-center mt-4 mb-8 space-x-6">
          <TouchableOpacity
            onPress={resetTimer}
            className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 items-center justify-center"
          >
            <RotateCcw color="#ef4444" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTimer}
            className="shadow-xl shadow-blue-500/20 rounded-full overflow-hidden mx-6"
          >
            <LinearGradient
                colors={isRunning ? ['#FFB75E', '#ED8F03'] : ['#00F260', '#0575E6']}
                className="w-24 h-24 items-center justify-center"
            >
                {isRunning ? (
                    <Pause color="white" size={32} fill="white" />
                ) : (
                    <Play color="white" size={32} fill="white" style={{ marginLeft: 4 }} />
                )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
             onPress={() => setShowPicker(true)}
             className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 items-center justify-center"
          >
            <Clock color="#white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Streak Stats (Footer) */}
        {streak && (
          <View className="flex-row gap-3 mb-6">
             <View className="flex-1 bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex-row items-center justify-between">
                <View>
                    <Text className="text-neutral-400 text-[10px] uppercase font-bold">Current</Text>
                    <Text className="text-white text-xl font-bold">{streak.current}</Text>
                </View>
                <Flame color="#f97316" size={24} fill="rgba(249, 115, 22, 0.2)" />
             </View>
             
             <View className="flex-1 bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex-row items-center justify-between">
                <View>
                    <Text className="text-neutral-400 text-[10px] uppercase font-bold">Best</Text>
                    <Text className="text-white text-xl font-bold">{streak.longest}</Text>
                </View>
                <Award color="#38bdf8" size={24} fill="rgba(56, 189, 248, 0.2)" />
             </View>
          </View>
        )}

        {/* Duration Picker Modal */}
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/80 backdrop-blur-sm">
          <Clock size={48} color="#666" className="absolute top-20" />
            <DurationPicker
              onClose={() => setShowPicker(false)}
              onSetDuration={(seconds) => {
                setTotalSeconds(seconds);
                setShowPicker(false);
                setSeconds(0);
              }}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}