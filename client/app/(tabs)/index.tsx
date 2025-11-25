// app/dashboard.tsx
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import {
  Flame,
  Calendar,
  MessageCircle,
  Target,
  Bell,
  User,
  ChevronRight
} from "lucide-react-native";
import PulsingDots from "../../components/PulsingDots";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { BASE_URL } from "../../baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        const remRes = await fetch(`${BASE_URL}/api/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const remData = await remRes.json();
        setReminders(Array.isArray(remData) ? remData : remData.reminders || []);

        const streakRes = await fetch(`${BASE_URL}/api/streaks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const streakData = await streakRes.json();
        setStreak(streakData.currentStreak || 0);

        const profileRes = await fetch(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        setUser(profileData.user);
      } catch (err: any) {
        Toast.show({ type: "error", text1: "Connection Error" });
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const upcomingItems = reminders
    .map((r) => ({ ...r, type: "reminder" }))
    .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* "Void" Background: Pure Black to Very Dark Gray */}
      <LinearGradient
        colors={['#000000', '#050505', '#121212']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-neutral-500 text-xs font-bold tracking-[0.2em] uppercase">
                Dashboard
              </Text>
              <Text className="text-3xl font-bold text-white mt-1">
                Hello, {user?.username || "Guest"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 p-0.5"
            >
              {user?.image ? (
                <Image
                  source={{ uri: `${BASE_URL}${user.image}` }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <View className="w-full h-full rounded-full bg-black items-center justify-center">
                  <User color="#555" size={24} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Hero Card: Streak (Darker Base) */}
          <View className="rounded-3xl overflow-hidden mb-8 border border-white/5 bg-neutral-900/30 relative">
            {/* Very subtle color tint, mostly black */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
              className="absolute inset-0"
            />
            
            {/* Top Glowing Edge */}
            <LinearGradient
              colors={['#FF512F', '#DD2476', 'transparent']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              className="h-[1px] w-full opacity-70 absolute top-0"
            />

            <View className="p-6 flex-row justify-between items-center">
              <View>
                <View className="flex-row items-center space-x-2 mb-2">
                  <Flame color="#FF512F" size={20} fill="rgba(255, 81, 47, 0.1)" />
                  <Text className="text-white/60 font-bold tracking-widest text-[10px] uppercase ml-2">
                    Current Streak
                  </Text>
                </View>
                <Text className="text-5xl font-black text-white shadow-black shadow-md">
                  {streak} <Text className="text-lg font-medium text-neutral-600">days</Text>
                </Text>
                <Text className="text-neutral-500 text-xs mt-2 w-32">
                  Consistency is key.
                </Text>
              </View>
              
              <View className="scale-110 opacity-80">
                <PulsingDots /> 
              </View>
            </View>
          </View>

          {/* Quick Actions Grid (Darkened) */}
          <Text className="text-white/90 text-lg font-bold mb-4 mt-2">Modules</Text>
          <View className="flex-row justify-between mb-8">
            <QuickActionCard 
              icon={<MessageCircle color="#3b82f6" size={26} />} // Blue-500
              label="Chat"
              // Dark gradient
              gradient={['rgba(59, 130, 246, 0.15)', 'transparent']}
              borderColor="border-blue-900/30"
              onPress={() => router.push("/chat/list")}
            />
            <QuickActionCard 
              icon={<Target color="#22c55e" size={26} />} // Green-500
              label="Study"
              gradient={['rgba(34, 197, 94, 0.15)', 'transparent']}
              borderColor="border-green-900/30"
              onPress={() => router.push("/study")}
            />
            <QuickActionCard 
              icon={<Calendar color="#f472b6" size={26} />} // Pink-400
              label="Timetable"
              gradient={['rgba(244, 114, 182, 0.15)', 'transparent']}
              borderColor="border-pink-900/30"
              onPress={() => router.push("/timetable")}
            />
          </View>

          {/* Upcoming Reminders (Dark Cards) */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-white/90 text-lg font-bold">Upcoming</Text>
            <TouchableOpacity>
              <Text className="text-neutral-600 text-xs">View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingItems.length > 0 ? (
            upcomingItems.map((item) => (
              <View 
                key={item.id} 
                // Using neutral-900 for the card background
                className="flex-row items-center justify-between bg-neutral-900/60 rounded-2xl p-4 mb-3 border border-white/5"
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-black border border-neutral-800 p-3 rounded-full mr-4">
                    <Bell color="#fbbf24" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-200 font-semibold text-base mb-1" numberOfLines={1}>
                      {item.note}
                    </Text>
                    <Text className="text-neutral-600 text-xs">
                      {new Date(item.remindAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#333" size={20} />
              </View>
            ))
          ) : (
             <View className="items-center justify-center p-10 bg-neutral-900/20 rounded-2xl border border-dashed border-neutral-800">
               <Target color="#333" size={40} />
               <Text className="text-neutral-600 mt-2 text-sm">No tasks pending</Text>
             </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Helper for Grid Buttons (Updated for Dark Theme)
const QuickActionCard = ({ icon, label, onPress, gradient, borderColor }: any) => (
  <TouchableOpacity
    onPress={onPress}
    // Using bg-neutral-950 for a very dark card base
    className={`w-[30%] aspect-square rounded-2xl items-center justify-center overflow-hidden border bg-neutral-950 ${borderColor || 'border-neutral-800'}`}
  >
    <LinearGradient
      colors={gradient}
      className="absolute inset-0 opacity-50"
    />
    <View className="z-10 items-center">
      {icon}
      <Text className="text-neutral-300 mt-3 font-medium text-xs tracking-wide">
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);