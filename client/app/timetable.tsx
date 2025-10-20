// app/timetable.tsx
import React, { useState, useEffect } from "react"
import { TimetableEntry, TimetableState } from "../types/timetable"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BASE_URL } from "../baseUrl";
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
import { CalendarPlus, ChevronLeft } from "lucide-react-native"
import Toast from "react-native-toast-message"

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

// const BASE_URL = `http://192.168.100.191:5000/api/timetable`

export default function TimetablePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [timetable, setTimetable] = useState<TimetableState>({})
  const [error, setError] = useState<string | null>(null)

  // Fetch timetable from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const JWT_TOKEN = await AsyncStorage.getItem("token")
        if (!JWT_TOKEN) {
          console.error("No auth token found")
          Toast.show({
            type:"error",
            text1:"please log in again"
          })
          router.replace("/auth/login")
          return
        }

        const res = await fetch(`${BASE_URL}/api/timetable`, {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
        })

        if (!res.ok) {
          if (res.status === 401) {
            console.error("Invalid or expired token")
            await AsyncStorage.removeItem("token")
            Toast.show({
              type:'error',
              text1:'session expired please login again'
            })
            router.replace("/auth/login")
            return
          }
          throw new Error(`API error: ${res.status}`)
        }

        const data = await res.json()
        console.log("Timetable data received:", data) // Debug log

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format from API")
        }

        const slots = Array.from(
          new Set(data.map((entry: any) => entry.time_slot))
        ).sort()
        setTimeSlots(slots)

        const table: Record<string, string[]> = {}
        daysOfWeek.forEach((day) => {
          table[day] = slots.map((slot) => {
            const entry = data.find(
              (e: any) => e.day === day && e.time_slot === slot
            )
            return entry ? entry.task : ""
          })
        })
        setTimetable(table)
      } catch (err) {
        console.error("Failed to fetch timetable:", err)
        Toast.show({
          type:'error',
          text1:'failed to load timetable. check your internet connection'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router]) // Add router to dependencies

  // Update subject/task in a cell (LOCAL ONLY)
  const handleInput = (day: string, index: number, value: string) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: prev[day].map((v, i) => (i === index ? value : v)),
    }))
  }

  // Save entire timetable to API
  const saveTimetable = async () => {
    setSaving(true)
    try {
      const JWT_TOKEN = await AsyncStorage.getItem("token")
      if (!JWT_TOKEN) {
        Toast.show({
          type:"info",
          text1:"please log in again"
        })
        router.replace("/auth/login")
        return
      }

      const savePromises = daysOfWeek.flatMap(day =>
        timeSlots.map(async (slot, index) => {
          const task = timetable[day]?.[index] || ""
          const res = await fetch(BASE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${JWT_TOKEN}`,
            },
            body: JSON.stringify({
              day,
              time_slot: slot,
              task,
              duration: 120,
            }),
          })

          if (!res.ok) {
            if (res.status === 401) {
              throw new Error("Unauthorized")
            }
            const data = await res.json()
            throw new Error(data.error || `Failed to save entry for ${day} at ${slot}`)
          }

          return res.json()
        })
      )

      await Promise.all(savePromises)
      Toast.show({
        type:"success",
        text1:"timetable saved successfully"
      })
      
    } catch (err) {
      console.error("Failed to save timetable:", err)
      if (err.message === "Unauthorized") {
        await AsyncStorage.removeItem("token")
        Toast.show({
          type:'error',
          text1:'session expired please login again'
        })
        router.replace("/auth/login")
      } else {
        Toast.show({
          type:'error',
          text1:"❌ Failed to save timetable. Try again."
        })
      }
    } finally {
      setSaving(false)
    }
  }


  // Update the header (time slot) locally only
  const handleTimeSlotChange = (index: number, value: string) => {
    setTimeSlots((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const addTimeSlot = () => {
    setTimeSlots((prev) => [...prev, "time"])
    setTimetable((prev) => {
      const updated: Record<string, string[]> = {}
      daysOfWeek.forEach((day) => {
        updated[day] = [...(prev[day] || []), ""]
      })
      return updated
    })
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white mt-4">Loading timetable...</Text>
        {error && (
          <Text className="text-red-500 mt-2 text-center px-4">{error}</Text>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-[rgb(0,0,0,0.7)]">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-400 text-base"><ChevronLeft size={24} color={"white"} /></Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Weekly Timetable</Text>
        <TouchableOpacity onPress={addTimeSlot}>
          <View className=" flex items-center">
          <CalendarPlus size={24} color={"white"} />
          <Text className="text-green-400 font-semibold">new time Slot</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal className="flex-1">
        <View>
          {/* Column Headers */}
          <View className="flex-row">
            <View className="w-28 p-2 bg-gray-800">
              <Text className="text-white font-semibold">Day</Text>
            </View>
            {timeSlots.map((slot, index) => (
              <View
                key={index}
                className="w-40 p-2 bg-gray-800 border-l border-gray-700"
              >
                <TextInput
                  value={slot}
                  onChangeText={(val) => handleTimeSlotChange(index, val)}
                  className="text-white border border-gray-600 rounded-lg px-2 py-1 text-center"
                />
              </View>
            ))}
          </View>

          {/* Rows */}
          {daysOfWeek.map((day) => (
            <View key={day} className="flex-row border-b border-gray-700">
              <View className="w-28 p-2 bg-[rgb(0,0,0,0.7)]">
                <Text className="text-white font-semibold">{day}</Text>
              </View>
              {timeSlots.map((_, index) => (
                <View
                  key={index}
                  className="w-40 p-2 border-l border-gray-700 bg-[rgb()]"
                >
                  <TextInput
                    placeholder=""
                    placeholderTextColor="#6b7280"
                    value={timetable[day]?.[index] || ""}
                    onChangeText={(val) => handleInput(day, index, val)}
                    className="text-white border border-gray-600 rounded-lg px-2 py-1"
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="p-4 bg-[rgb(0,0,0,0.7)] border-t">
        <TouchableOpacity
          onPress={saveTimetable}
          disabled={saving}
          className={`py-3 border rounded-xl ${
            saving ? "border-gray-600" : "border-blue-600"
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {saving ? "Saving..." : "Save Timetable"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
