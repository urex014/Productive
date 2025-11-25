import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as  React from "react";
import { useMemo, useState, useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import "./globals.css";
import { SocketProvider } from "./context/socketContext";
import usePushNotifications from "../hooks/usePushNotifications";
import Toast from 'react-native-toast-message';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Grab token + notifications from custom hook
  const { expoPushToken, notification } = usePushNotifications();

  const defaultScreenOptions = useMemo(() => ({ headerShown: false }), []);
  const [loading, setLoading] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
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

  // Log the token when it’s ready — later, send this to your backend
  useEffect(() => {
    if (expoPushToken) {
      //console.log("Expo Push Token:", expoPushToken);
      // TODO: send expoPushToken to your backend tied to the logged-in user
    }
  }, [expoPushToken]);

  // Log incoming notifications — later, you can show a banner or update UI
  useEffect(() => {
    if (notification) {
      //console.log("Notification received:", notification);
    }
  }, [notification]);

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
        &quot;We are what we repeatedly do. Excellence, then, is not an act, but a habit. – Aristotle &quot;
        </Text>
      </View>
    );
  }

  return (
    <SocketProvider>
      <StatusBar hidden={true} />
      <Stack screenOptions={defaultScreenOptions}>
        {!hasOnboarded && <Stack.Screen name="onboarding" />}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="chat/list" />
        <Stack.Screen name="chat/ChatRoom" />
      </Stack>
      <Toast />
    </SocketProvider>
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
