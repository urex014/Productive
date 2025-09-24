// app/auth/register.tsx
import React, { useState } from "react";
import { icons } from "@/constants/icons";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";

export default function RegisterScreen() {
  const BASE_URL = "http://192.168.100.30:5000";
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      console.warn("Register response:", data); 

      if (!res.ok) {
        const message = data?.error|| 'something went wrong' 
        setError(message);
        setLoading(false);
        setTimeout(() => setError(""), 5000);
        return;
      }

      if (data.token && data.user) {
        // Save token and user
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("userId", String(data.user.id));

        // Register push token
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          try {
            const pushRes = await fetch(`${BASE_URL}/api/notifications/register-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.token}`,
              },
              body: JSON.stringify({
                userId: data.user.id,
                expoPushToken,
              }),
            });

            const pushData = await pushRes.json();

            if (!pushRes.ok) {
              console.error("Failed to save push token:", pushData);
            }else{
              console.info("push token saved: ", pushData.message)
            }
          } catch (err) {
            console.error("Push token save error:", err);
          }
        }
      }

      // Navigate to home
      router.replace("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. Check your connection.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-black px-6">
      <Text className="text-white text-4xl font-bold mb-10 text-center">
        Create Account
      </Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#9ca3af"
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        className="w-full bg-[#1f1f3a] text-white px-4 py-3 rounded-xl mb-4"
      />

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

      <TouchableOpacity
        onPress={handleRegister}
        className="w-full bg-white py-3 rounded-xl"
        disabled={loading}
      >
        <Text className="text-[#0a0a23] font-bold text-center text-lg">
          {loading ? "Registering..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

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

      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-400">Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text className="text-white font-semibold">Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
