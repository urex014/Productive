// app/auth/login.tsx
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const BASE_URL = "http://192.168.100.30:5000";

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // Store only if token exists
      await AsyncStorage.setItem("token", data.token);
      console.log("Logged in successfully!");
      router.replace("/");
    } else {
      // If token is missing, clear old value instead of storing null/undefined
      await AsyncStorage.removeItem("token");
      console.warn("Login failed:", data.error || "No token returned");
      
    }
  } catch (err) {
    console.error("Login error:", err);
    setTimeout(() => { setError("Login failed") }, 5000); // Clear error after 5 seconds
    
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
