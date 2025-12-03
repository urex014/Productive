import * as React from "react";
import { useState, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator
} from "react-native";
import {
  Flame,
  Calendar,
  MessageCircle,
  Target,
  Bell,
  User,
  ChevronRight,
  Notebook
} from "lucide-react-native";
import PulsingDots from "../../components/PulsingDots";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import Toast from "react-native-toast-message";
import { BASE_URL } from "../../baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function getTimeOfDay():string{
    const hour = new Date().getHours();
    if(hour < 12) return `Morning ${user?.username || "User"}☀️`;
    if(hour < 18) return `Afternoon ${user?.username || "User"}🌤️` ;
    return `Evening ${user?.username || "User"}🌙`;
  }
  const time = getTimeOfDay();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        // 1. Fetch Reminders
        try {
            const remRes = await fetch(`${BASE_URL}/api/reminders`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            
            if (remRes.ok) {
                const remData = await remRes.json();
                const rawReminders = Array.isArray(remData) ? remData : remData.reminders || [];
                setReminders(rawReminders);
            }
        } catch(e) {
            console.error("Reminders fetch failed", e);
        }

        // 2. Fetch Streak
        try {
            const streakRes = await fetch(`${BASE_URL}/api/streaks`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            if (streakRes.ok) {
                const streakData = await streakRes.json();
                setStreak(streakData.currentStreak || 0);
            }
        } catch(e) {
            console.error("Streak fetch failed", e);
        }

        // 3. Fetch Profile - Critical for Header
        try {
            const profileRes = await fetch(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                // Ensure we are setting the user object correctly
                // If backend returns { user: { ... } }, we set profileData.user
                setUser(profileData.user || profileData);
            } else {
                console.error("Profile fetch failed status:", profileRes.status);
            }
        } catch(e) {
            console.error("Profile fetch failed", e);
        }

      } catch (err: any) {
        console.error("Dashboard global error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sort reminders by date
  const upcomingItems = reminders
    .map((r) => ({ 
        ...r, 
        id: r._id || r.id, 
        type: "reminder",
        remindAt: r.remindAt || r.dueDate 
    }))
    .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
    .slice(0, 5); 

  if (loading && !user) {
      return (
        <View className="flex-1 bg-black justify-center items-center">
            <ActivityIndicator size="large" color="#DD2476" />
        </View>
      );
  }

  // Helper to handle profile image URL
  const getProfileImage = (img: string) => {
      if (!img) return { uri: '' };
      if (img.startsWith('http') || img.startsWith('data:')) return { uri: img };
      return { uri: `${BASE_URL}${img}` };
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
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
              <View className="w-[90%]">
              <Text numberOfLines={1} className="text-3xl font-bold text-white mt-1">
                {time} 
              </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 p-0.5"
            >
              {user?.image ? (
                <Image
                  source={getProfileImage(user.image)}
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
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
              className="absolute inset-0"
            />
            
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
              icon={<Notebook color="#3b82f6" size={26} />} // Blue-500
              label="Notes"
              gradient={['rgba(59, 130, 246, 0.15)', 'transparent']}
              borderColor="border-blue-900/30"
              onPress={() => router.push("/notes")}
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
            <TouchableOpacity onPress={() => router.push("/tasks")}>
              <Text className="text-neutral-600 text-xs">View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingItems.length > 0 ? (
            upcomingItems.map((item) => (
              <View
              
                key={item.id} 
                className="flex-row items-center justify-between bg-neutral-900/60 rounded-2xl p-4 mb-3 border border-white/5"
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-black border border-neutral-800 p-3 rounded-full mr-4">
                    <Bell color="#fbbf24" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-200 font-semibold text-base mb-1" numberOfLines={1}>
                      {item.note || item.title}
                    </Text>
                    <Text className="text-neutral-600 text-xs">
                      {new Date(item.remindAt).toLocaleString([], { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/tasks")}>
                <ChevronRight color="#333" size={20} />
                </TouchableOpacity>
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

const QuickActionCard = ({ icon, label, onPress, gradient, borderColor }: any) => (
  <TouchableOpacity
    onPress={onPress}
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