// app/auth/login.tsx
import React, { useState } from "react";
import { icons } from "@/constants/icons";
import { Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import only the async function, not the hook
import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";

export default function LoginScreen() {
  const BASE_URL = "http://192.168.100.30:5000";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token && data.user) {
        // Save token + user in storage
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("userId", String(data.user.id));
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        // Now get the expo push token
        const expoPushToken = await registerForPushNotificationsAsync();

        if (expoPushToken) {
          try {
            await fetch(`${BASE_URL}/api/notifications/register-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.token}`, // auth if needed
              },
              body: JSON.stringify({
                userId: data.user.id,
                expoPushToken,
              }),
            });
          } catch (pushErr) {
            console.error("Failed to register push token:", pushErr);
          }
        }

        // Go to home/root
        router.replace("/");
      } else {
        setError(data.error || "Invalid credentials");
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-primary px-6">
      <Text className="text-white text-4xl font-bold mb-10 text-center">
        Welcome Back
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full bg-[#1f1f3a] text-white px-6 py-3 rounded-lg mb-4"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        className="w-full bg-[#1f1f3a] text-white px-6 py-3 rounded-lg mb-6"
      />

      <TouchableOpacity
        onPress={handleLogin}
        className="w-full bg-white py-3 rounded-xl"
        disabled={loading}
      >
        <Text className="text-[#0a0a23] font-bold text-center text-lg">
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>

      {/* Divider with Google option */}
      <View className="flex mt-8 flex-col items-center justify-center">
        <View className="flex flex-row items-center w-full mb-6">
          <View className="flex-1 h-px bg-gray-600"></View>
          <Text className="text-gray-400 text-sm font-medium mx-4">
            or continue with
          </Text>
          <View className="flex-1 h-px bg-gray-600"></View>
        </View>

        <View className="flex flex-row items-center justify-center w-full">
          <TouchableOpacity className="flex flex-row items-center justify-center py-4 rounded-xl w-full bg-white border border-gray-300 shadow-lg active:scale-95 active:shadow-md transition-all duration-200">
            <Image className="w-5 h-5 mr-3" source={icons.google} />
            <Text className="text-gray-800 font-semibold text-base">
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="w-full items-center m-2">
        <Text className="text-red-500 font-bold">{error}</Text>
      </View>

      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-400">Don’t have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text className="text-white font-semibold">Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push("/auth/forgot-password")}
      >
        <Text className="text-gray-400 text-center">Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}
