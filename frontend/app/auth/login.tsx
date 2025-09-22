// app/auth/login.tsx
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {registerForPushNotificationAsync} from '../notification.js'

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
        // Store token and user object
        await AsyncStorage.setItem("token", data.token);
        // Save userId to AsyncStorage
        await AsyncStorage.setItem("userId", String(data.user.id));

        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        const expoPushToken = await registerForPushNotificationAsync();
        if(expoPushToken){
          await fetch(`${BASE_URL}/api/profile/push-token`, {
            method:"POST",
            headers:{
              'content-Type':'application/json',
              Authorization: `Bearer ${data.token}`,
            },
            body:JSON.stringify({expoPushToken})
          })
        }

        // Navigate to home/root
        router.replace("/");
      } else {
        // Handle invalid credentials or missing token/user
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
