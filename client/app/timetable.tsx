// app/timetable.tsx
import React, { useState, useEffect } from "react";
import { TimetableEntry, TimetableState } from "../types/timetable";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from "react-native";
import { BASE_URL } from "../baseUrl";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarPlus, ChevronLeft, Save, Clock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const { width } = Dimensions.get("window");

export default function TimetablePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<TimetableState>({});
  const [error, setError] = useState<string | null>(null);

  // --- Logic Section (Unchanged) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const JWT_TOKEN = await AsyncStorage.getItem("token");
        if (!JWT_TOKEN) {
          Toast.show({ type: "error", text1: "Authentication required" });
          router.replace("/auth/login");
          return;
        }

        const res = await fetch(`${BASE_URL}/api/timetable`, {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            await AsyncStorage.removeItem("token");
            router.replace("/auth/login");
            return;
          }
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        
        if (!Array.isArray(data)) throw new Error("Invalid data");

        const slots = Array.from(new Set(data.map((entry: any) => entry.time_slot))).sort();
        setTimeSlots(slots.length > 0 ? slots : ["08:00 - 09:00", "09:00 - 10:00"]); // Default slots if empty

        const table: Record<string, string[]> = {};
        daysOfWeek.forEach((day) => {
          table[day] = (slots.length > 0 ? slots : ["08:00 - 09:00", "09:00 - 10:00"]).map((slot) => {
            const entry = data.find((e: any) => e.day === day && e.time_slot === slot);
            return entry ? entry.task : "";
          });
        });
        setTimetable(table);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Could not sync schedule' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleInput = (day: string, index: number, value: string) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: prev[day].map((v, i) => (i === index ? value : v)),
    }));
  };

  const saveTimetable = async () => {
    setSaving(true);
    try {
      const JWT_TOKEN = await AsyncStorage.getItem("token");
      if (!JWT_TOKEN) {
        router.replace("/auth/login");
        return;
      }

      const savePromises = daysOfWeek.flatMap(day =>
        timeSlots.map(async (slot, index) => {
          const task = timetable[day]?.[index] || "";
          const res = await fetch(BASE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${JWT_TOKEN}`,
            },
            body: JSON.stringify({ day, time_slot: slot, task, duration: 120 }),
          });

          if (!res.ok) throw new Error("Save failed");
          return res.json();
        })
      );

      await Promise.all(savePromises);
      Toast.show({ type: "success", text1: "Schedule updated successfully" });
      
    } catch (err: any) {
      Toast.show({ type: 'error', text1: "Sync failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleTimeSlotChange = (index: number, value: string) => {
    setTimeSlots((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addTimeSlot = () => {
    setTimeSlots((prev) => [...prev, "00:00 - 00:00"]);
    setTimetable((prev) => {
      const updated: Record<string, string[]> = {};
      daysOfWeek.forEach((day) => {
        updated[day] = [...(prev[day] || []), ""];
      });
      return updated;
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#DD2476" />
        <Text className="text-neutral-500 mt-4 text-xs uppercase tracking-widest">Loading Schedule...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/10">
             <ChevronLeft size={24} color={"white"} />
          </TouchableOpacity>
          
          <View>
             <Text className="text-white text-xl font-bold text-center">Timetable</Text>
             <Text className="text-neutral-500 text-[10px] uppercase tracking-widest text-center">Weekly Schedule</Text>
          </View>

          <TouchableOpacity onPress={addTimeSlot} className="flex-row items-center bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/20">
             <CalendarPlus size={18} color="#60a5fa" />
             <Text className="text-blue-400 font-bold ml-2 text-xs">SLOT</Text>
          </TouchableOpacity>
        </View>

        {/* Data Grid */}
        <ScrollView horizontal className="flex-1" showsHorizontalScrollIndicator={false}>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="pb-24 pl-4 pr-4"> 
              
              {/* Header Row (Time Slots) */}
              <View className="flex-row mt-4">
                <View className="w-28 p-3 mr-2 bg-neutral-900 border border-white/10 rounded-xl justify-center items-center">
                  <Text className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Day / Time</Text>
                </View>
                {timeSlots.map((slot, index) => (
                  <View
                    key={index}
                    className="w-40 p-2 mr-2 bg-neutral-900/50 border border-white/10 rounded-xl"
                  >
                    <View className="flex-row items-center justify-center mb-1">
                       <Clock size={12} color="#666" />
                    </View>
                    <TextInput
                      value={slot}
                      onChangeText={(val) => handleTimeSlotChange(index, val)}
                      className="text-white font-medium text-center text-xs p-0"
                      placeholder="00:00"
                      placeholderTextColor="#444"
                    />
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {daysOfWeek.map((day) => (
                <View key={day} className="flex-row mt-2">
                  {/* Day Label */}
                  <View className="w-28 p-3 mr-2 bg-neutral-900/80 border border-white/5 rounded-xl justify-center">
                    <Text className="text-white font-bold text-sm">{day}</Text>
                  </View>

                  {/* Task Inputs */}
                  {timeSlots.map((_, index) => (
                    <View
                      key={index}
                      className="w-40 mr-2 bg-black border border-white/10 rounded-xl overflow-hidden"
                    >
                      <TextInput
                        placeholder="Free Slot"
                        placeholderTextColor="#333"
                        value={timetable[day]?.[index] || ""}
                        onChangeText={(val) => handleInput(day, index, val)}
                        className="flex-1 text-white px-3 py-3 text-sm"
                        multiline
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        {/* Floating Save Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={saveTimetable}
            disabled={saving}
            className="rounded-2xl overflow-hidden shadow-lg shadow-purple-500/20"
          >
             <LinearGradient
                colors={['#FF512F', '#DD2476']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 flex-row items-center justify-center"
             >
                {saving ? (
                   <ActivityIndicator color="white" size="small" />
                ) : (
                   <>
                     <Save color="white" size={20} />
                     <Text className="text-white font-bold ml-2 text-base tracking-wide">SAVE CHANGES</Text>
                   </>
                )}
             </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}