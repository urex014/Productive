// app/auth/register.tsx
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For storing token

export default function RegisterScreen() {
  const BASE_URL = "http://192.168.100.30:5000";

  const router = useRouter();
  const [username, setUsername] = useState(""); // Changed from name to username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      console.warn(data)

      if (!res.ok) {
        const message = data?.message || "Something went wrong...";
        // show error immediately, clear after 5s
        setError(message);
        setLoading(false);
        setTimeout(() => setError(""), 5000);
        return;
      }

      // Save token to AsyncStorage
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      

      // Navigate to dashboard/home
      router.replace("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. Check your connection.");
      setTimeout(() => setError(""), 5000);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-black px-6">
      {/* Title */}
      <Text className="text-white text-4xl font-bold mb-10 text-center">
        Create Account
      </Text>

      {/* Username Input */}
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#9ca3af"
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

      {/* Email Input */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

      {/* Password Input */}
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

      {/* Confirm Password Input */}
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-6"
      />
      <View className="w-full items-center mb-3">
        <Text className="font-bold text-red-500 uppercase">{error}</Text>
      </View>
      {/* Register Button */}
      <TouchableOpacity
        onPress={handleRegister}
        className="w-full bg-white py-3 rounded-xl"
        disabled={loading}
      >
        <Text className="text-[#0a0a23] font-bold text-center text-lg">
          {loading ? "Registering..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {/* Already have account */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-400">Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text className="text-white font-semibold">Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
