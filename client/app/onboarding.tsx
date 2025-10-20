// app/onboarding.tsx
import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import PagerView from "react-native-pager-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";



const slides = [
  { 
    id: "1", 
    title: "Master Your Time", 
    description: "Turn study sessions into streaks that keep you motivated every single day." 
  },
  { 
    id: "2", 
    title: "Stay in Flow", 
    description: "Organize tasks effortlessly and focus only on what truly matters." 
  },
  { 
    id: "3", 
    title: "Build Lasting Habits", 
    description: "Consistency creates results. Watch your small wins compound into success." 
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

  return (
    <View className="flex-1 bg-primary">
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {slides.map((slide, index) => (
          <View
            className="flex-1 items-center justify-center px-6"
            key={slide.id}
          >
            <Text className="text-white text-3xl font-bold mb-4">
              {slide.title}
            </Text>
            <Text className="text-gray-300 text-base text-center">
              {slide.description}
            </Text>

            {index === slides.length - 1 && (
              <TouchableOpacity
                onPress={handleDone}
                className="mt-8 bg-white px-6 py-3 rounded-full"
              >
                <Text className="text-[#0a0a23] font-bold text-base">
                  Get Started
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </PagerView>

      {/* Dots Indicator */}
      <View className="flex-row justify-center items-center pb-6">
        {slides.map((_, i) => (
          <View
            key={i}
            className={`h-2 w-2 rounded-full mx-1 ${
              i === page ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
