import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useMemo, useState, useEffect } from "react";
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import "./globals.css";
import ChatRoom from "./chat/ChatRoom";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const defaultScreenOptions = useMemo(() => ({ headerShown: false }), []);
  const [loading, setLoading] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [showSecondSplash, setShowSecondSplash] = useState(true);

  useEffect(() => {
    const init = async () => {
      const value = await AsyncStorage.getItem("hasOnboarded");
      if (value) setHasOnboarded(true);
      setLoading(false);

      await SplashScreen.hideAsync();

      const timer = setTimeout(() => setShowSecondSplash(false), 2500);
      return () => clearTimeout(timer);
    };
    init();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (showSecondSplash) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit." – Aristotle
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden={true} />
      <Stack screenOptions={defaultScreenOptions}>
        {!hasOnboarded && <Stack.Screen name="onboarding" />}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="chat/list" />
        <Stack.Screen name="chat/ChatRoom" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "bold",
    color: "#E0E0E0",
    textAlign: "center",
  },
});
