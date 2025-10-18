// app/dashboard.tsx
import * as React from "react";
import { useState, useEffect} from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from "react-native"
import {
  Flame,
  Calendar,
  CheckCircle,
  MessageCircle,
  Target,
  Bell,
  User,
} from "lucide-react-native"
import PulsingDots from "@/components/PulsingDots"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function DashboardScreen() {
  const BASE_URL = "http://192.168.100.30:5000"
  const router = useRouter()
  const [reminders, setReminders] = useState<any[]>([])
  const [streak, setStreak] = useState<number>(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // only reminders, streak, and profile
    const fetchAll = async () => {
      try {
        const token = await AsyncStorage.getItem("token")

        // fetch reminders
        const remRes = await fetch(`${BASE_URL}/api/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const remData = await remRes.json()
        setReminders(Array.isArray(remData) ? remData : remData.reminders || [])

        // fetch streak
        const streakRes = await fetch(`${BASE_URL}/api/streaks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const streakData = await streakRes.json()
        setStreak(streakData.currentStreak || 0)

        // fetch profile
        const profileRes = await fetch(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const profileData = await profileRes.json()
        setUser(profileData.user)
      } catch (err) {
        console.warn("Error fetching dashboard data", err)
      }
    }

    // run once at mount
    fetchAll()

    // poll every 10 seconds
    const interval = setInterval(fetchAll, 1000)
    return () => clearInterval(interval)
  }, [])

  // upcoming = reminders only
  const upcomingItems = reminders
    .map((r) => ({ ...r, type: "reminder" }))
    .sort(
      (a, b) =>
        new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    )


  return (
    <View className="flex-1 pb-20 bg-black">
      <ScrollView
        className="flex-1 px-6 pt-12"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Welcome + Profile */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold tracking-tight text-gray-300">
            Welcome back, {user?.username || "Guest"}
          </Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden items-center justify-center"
            onPress={() => router.push("/profile")}
          >
            {user?.image ? (
              <Image
                source={{ uri: user.image?`${BASE_URL}${user.image}`:"https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                className="w-12 h-12 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <User color="white" size={28} />
            )}
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View className="bg-gradient-to-br from-[#2a2a4a] via-[#1f1f3a] to-[#151529] rounded-3xl p-8 mb-8 items-center border border-white/5 shadow-2xl shadow-purple-500/10">
  {/* Animated glow effect */}
  <View className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-md"></View>
  
  {/* Icon with gradient background */}
  <View className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-4 rounded-2xl mb-4 border border-orange-500/20">
    <Flame color="#f97316" size={44} />
  </View>
  
  {/* Streak number with gradient text */}
  <Text className="text-6xl  font-black mt-2  bg-clip-text bg-gradient-to-b text-white from-white to-gray-300">
    {streak}
  </Text>
  
  {/* Subtitle with better styling */}
  {streak==1?(
    <View>
    <Text className="text-gray-300/90 mt-3 text-lg font-medium tracking-wide">First day</Text>

    </View>
  ):(
    <View>
    <Text className="text-gray-300/90 mt-3 text-lg font-medium tracking-wide">
    days in a row
  </Text>
    </View>
  )}
  
  
  {/* Decorative elements */}
  <PulsingDots />
</View>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-10">
          <TouchableOpacity
            className="flex-1 mx-2 border bg-[rgb(0,0,0,0.7)] border-[#2563eb] rounded-2xl p-6 items-center"
            onPress={() => router.push("/chat/list")}
          >
            {/* <CheckCircle color="white" size={28} /> */}
            <MessageCircle color="white" size={28} />
            <Text className="text-white mt-3 font-semibold text-sm">
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 mx-2 border-[#10b981] border bg-[rgb(0,0,0,0.7)] rounded-2xl p-6 items-center"
            onPress={() => router.push("/study")}
          >
            <Target color="white" size={28} />
            <Text className="text-white mt-3 font-semibold text-sm">
              Study
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 mx-2 bg-[rgb(0,0,0,0.7)] border border-orange-500 rounded-2xl p-6 items-center"
            onPress={() => router.push("/timetable")}
          >
            <Calendar color="white" size={28} />
            <Text className="text-white mt-3 font-semibold text-sm">
              Timetable
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Section */}
        <Text className="text-white text-xl font-bold mb-5">Upcoming</Text>

        {upcomingItems.length > 0 ? (
          upcomingItems.map((item) => (
            <View
              key={item.id}
              className="bg-[#1f2937] rounded-2xl p-5 mb-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Bell color="#f59e0b" size={20} />
                  <Text
                    className="text-white font-semibold text-base ml-2"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.note}
                  </Text>
                </View>

                {/* Type label */}
                <Text className="text-xs px-2 py-1 rounded-full bg-yellow-600 text-white">
                  Reminder
                </Text>
              </View>

              <Text className="text-gray-400 text-sm">{item.remindAt}</Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-400 text-center mt-20">
            No upcoming reminders. Time to relax!
          </Text>
        )}
      </ScrollView>
    </View>
  )
}
