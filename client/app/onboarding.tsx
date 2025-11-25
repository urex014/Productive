import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View, Dimensions, StatusBar } from "react-native";
import PagerView from "react-native-pager-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Zap, TrendingUp, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const slides = [
  { 
    id: "1", 
    title: "Master Your Time", 
    description: "Turn study sessions into streaks that keep you motivated every single day.",
    icon: <Clock size={80} color="#FF512F" />,
    glow: "rgba(255, 81, 47, 0.3)",
    gradient: ['#FF512F', '#DD2476']
  },
  { 
    id: "2", 
    title: "Stay in Flow", 
    description: "Organize tasks effortlessly and focus only on what truly matters.",
    icon: <Zap size={80} color="#4facfe" />,
    glow: "rgba(79, 172, 254, 0.3)",
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: "3", 
    title: "Build Habits", 
    description: "Consistency creates results. Watch your small wins compound into success.",
    icon: <TrendingUp size={80} color="#00F260" />,
    glow: "rgba(0, 242, 96, 0.3)",
    gradient: ['#00F260', '#0575E6']
  },
];

export default function OnboardingScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const router = useRouter();

  const handleDone = async () => {
    await AsyncStorage.setItem("hasOnboarded", "true");
    router.replace("/auth/login");
  };

  const handleNext = () => {
    if (page < slides.length - 1) {
      pagerRef.current?.setPage(page + 1);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />
      
      <SafeAreaView className="flex-1">
        <PagerView
          style={{ flex: 1 }}
          initialPage={0}
          ref={pagerRef}
          onPageSelected={(e) => setPage(e.nativeEvent.position)}
        >
          {slides.map((slide) => (
            <View
              className="flex-1 items-center justify-center px-8"
              key={slide.id}
            >
              {/* Glowing Orb Background for Icon */}
              <View className="mb-12 relative items-center justify-center">
                <View 
                  style={{ 
                    width: width * 0.6, 
                    height: width * 0.6, 
                    backgroundColor: slide.glow,
                    borderRadius: 999,
                    filter: 'blur(60px)', // Note: standard React Native doesn't support CSS filter, relying on View transparency/opacity usually. 
                                          // If using Expo Image with blurhash it works, but here opacity + bg color creates the glow.
                    opacity: 0.2,
                    position: 'absolute'
                  }} 
                />
                
                {/* Icon Container */}
                <View className="w-40 h-40 bg-neutral-900 border border-white/10 rounded-full items-center justify-center shadow-2xl">
                   {slide.icon}
                </View>
              </View>

              <Text className="text-white text-4xl font-bold mb-4 text-center tracking-tight">
                {slide.title}
              </Text>
              <Text className="text-neutral-500 text-lg text-center leading-6 px-4">
                {slide.description}
              </Text>
            </View>
          ))}
        </PagerView>

        {/* Footer Controls */}
        <View className="px-8 pb-12 pt-4">
          
          {/* Dots Indicator */}
          <View className="flex-row justify-center mb-8 space-x-2">
            {slides.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page ? "w-8 bg-white" : "w-2 bg-neutral-700"
                }`}
              />
            ))}
          </View>

          {/* Action Button */}
          {page === slides.length - 1 ? (
            <TouchableOpacity
              onPress={handleDone}
              className="w-full rounded-2xl overflow-hidden shadow-lg shadow-purple-500/20"
              activeOpacity={0.8}
            >
               <LinearGradient
                  colors={['#FF512F', '#DD2476']}
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  className="py-4 items-center justify-center"
               >
                  <Text className="text-white font-bold text-lg tracking-wide uppercase">
                    Initialize System
                  </Text>
               </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              className="w-full bg-neutral-900 border border-white/10 py-4 rounded-2xl items-center flex-row justify-center"
            >
              <Text className="text-white font-bold text-base mr-2">Next</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          )}

          {/* Skip Button (Optional) */}
          {page < slides.length - 1 && (
            <TouchableOpacity onPress={handleDone} className="mt-6 items-center">
              <Text className="text-neutral-600 text-sm font-medium">Skip Intro</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}