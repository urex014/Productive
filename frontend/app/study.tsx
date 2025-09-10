// app/study.tsx
import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native"
import { ArrowLeft, Flame, Award, Clock } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import Svg, { Circle } from "react-native-svg"

// ---------------- Duration Picker Component ----------------
const DurationPicker = ({ onSetDuration }: { onSetDuration: (seconds: number) => void }) => {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(30) // default 30 mins

  const confirm = () => {
    const totalSeconds = hours * 3600 + minutes * 60
    onSetDuration(totalSeconds)
  }

  return (
    <View className="bg-gray-900 rounded-2xl p-6 w-4/5">
      <Text className="text-white text-lg font-bold mb-4 text-center">
        Set Study Duration
      </Text>

      {/* Hours Input */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-gray-300 text-base">Hours</Text>
        <TouchableOpacity
          onPress={() => setHours(Math.max(0, hours - 1))}
          className="px-3 py-1 bg-gray-700 rounded-lg"
        >
          <Text className="text-white">-</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{hours}</Text>
        <TouchableOpacity
          onPress={() => setHours(hours + 1)}
          className="px-3 py-1 bg-gray-700 rounded-lg"
        >
          <Text className="text-white">+</Text>
        </TouchableOpacity>
      </View>

      {/* Minutes Input */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-gray-300 text-base">Minutes</Text>
        <TouchableOpacity
          onPress={() => setMinutes(Math.max(0, minutes - 1))}
          className="px-3 py-1 bg-gray-700 rounded-lg"
        >
          <Text className="text-white">-</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{minutes}</Text>
        <TouchableOpacity
          onPress={() => setMinutes(minutes + 1)}
          className="px-3 py-1 bg-gray-700 rounded-lg"
        >
          <Text className="text-white">+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={confirm}
        className="bg-green-600 py-3 rounded-xl items-center"
      >
        <Text className="text-white font-bold text-base">Confirm</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---------------- Study Screen ----------------
export default function StudyScreen() {
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(1800) // default 30 mins
  const [isRunning, setIsRunning] = useState(false)
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const intervalRef = useRef<NodeJS.Timer | null>(null)
  const BASE_URL = "http://192.168.100.30:5000"
  const navigation = useNavigation()

  const radius = 120
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const progress = (seconds / totalSeconds) * circumference

  const toggleTimer = () => {
    if (isRunning) {
      clearInterval(intervalRef.current as NodeJS.Timer)
      intervalRef.current = null
      setIsRunning(false)
    } else {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
      setIsRunning(true)
    }
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current as NodeJS.Timer)
    intervalRef.current = null
    setIsRunning(false)
    setSeconds(0)
  }

  useEffect(() => {
    if (seconds === totalSeconds && totalSeconds > 0) {
      updateStreak()
    }
  }, [seconds])

  const updateStreak = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(`${BASE_URL}/api/streaks/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to update streak")

      const data = await res.json()
      setStreak({
        current: data.currentStreak,
        longest: data.longestStreak,
      })

      Alert.alert("Streak Updated!", `🔥 Current: ${data.currentStreak}\n🏆 Longest: ${data.longestStreak}`)
      resetTimer()
    } catch (err) {
      console.error("Streak update failed", err)
      Alert.alert("Error", "Could not update streak")
    }
  }

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
    const seconds = sec % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  return (
    <SafeAreaView className="flex-1 bg-black px-6">
      {/* Header */}
      <View className="flex-row items-center mt-4 mb-8">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-3 rounded-full bg-gray-800"
        >
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Study Session</Text>
      </View>

      {/* Timer */}
      <View className="flex-1 justify-center items-center">
        <Svg height="280" width="280" className="mb-6">
          <Circle
            stroke="#2d2d2d"
            fill="none"
            cx="140"
            cy="140"
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke="#22c55e"
            fill="none"
            cx="140"
            cy="140"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </Svg>

        <Text className="text-white text-6xl font-bold mb-2">
          {formatTime(seconds)}
        </Text>
        <Text className="text-gray-400 text-base">
          Target: {formatTime(totalSeconds)}
        </Text>
      </View>

      {/* Controls */}
      <View className="flex-row justify-center mt-10 mb-12 space-x-6">
        <TouchableOpacity
          onPress={toggleTimer}
          className={`px-10 py-4 mx-4 rounded-3xl shadow-lg ${
            isRunning ? "bg-yellow-500" : "bg-green-600"
          }`}
        >
          <Text className="text-white text-lg font-bold">
            {isRunning ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resetTimer}
          className="px-10 py-4 rounded-3xl shadow-lg bg-red-500"
        >
          <Text className="text-white text-lg font-bold">Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Duration Picker Button */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-row justify-center items-center bg-blue-600 py-4 rounded-2xl mb-10"
      >
        <Clock color="white" size={20} />
        <Text className="text-white font-bold ml-2">Set Duration</Text>
      </TouchableOpacity>

      {/* Streak Card */}
      {streak && (
        <View className="bg-gray-900 rounded-2xl p-6 mb-10 shadow-lg">
          <Text className="text-white text-lg font-bold mb-5 text-center">
            Your Streak
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Flame color="#f97316" size={30} />
              <Text className="text-green-400 mt-2 text-xl font-bold">
                {streak.current}
              </Text>
              <Text className="text-gray-400 text-sm">Current</Text>
            </View>
            <View className="items-center">
              <Award color="#38bdf8" size={30} />
              <Text className="text-blue-400 mt-2 text-xl font-bold">
                {streak.longest}
              </Text>
              <Text className="text-gray-400 text-sm">Longest</Text>
            </View>
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
        <View className="flex-1 justify-center items-center bg-black/70">
          <DurationPicker
            onSetDuration={(seconds) => {
              setTotalSeconds(seconds)
              setShowPicker(false)
              setSeconds(0) // reset timer when duration changes
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  )
}
