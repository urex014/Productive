// app/auth/register.tsx
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BASE_URL } from "../../baseUrl";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: "Passwords do not match" });
      return;
    }

    if (!username || !email || !password) {
        Toast.show({ type: 'error', text1: "Please fill in all fields" });
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

      if (!res.ok) {
        Toast.show({ type: 'error', text1: data?.error || "Registration failed" });
        return;
      }

      if (data.token && data.user) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("userId", String(data.user.id));

        registerForPushNotificationsAsync().then(async (token) => {
            if(token) {
                try {
                    await fetch(`${BASE_URL}/api/notifications/register-token`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${data.token}`,
                        },
                        body: JSON.stringify({ userId: data.user.id, expoPushToken: token }),
                    });
                } catch(e) { console.error(e); }
            }
        });
      }
      Toast.show({ type: 'success', text1: "Account created" });
      router.replace("/");
    } catch (err) {
      Toast.show({ type: 'error', text1: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#000000]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
                keyboardShouldPersistTaps="handled"
            >
              
              {/* Header */}
              <View className="items-start mb-10">
                <Text className="text-white text-3xl font-bold tracking-tight">Create Account</Text>
                <Text className="text-neutral-500 text-sm mt-1">Start your journey</Text>
              </View>

              {/* Inputs */}
              <View className="mb-8 space-y-4">
                
                {/* Username */}
                <View className="flex-row items-center bg-[#111] border border-[#222] rounded-xl px-4 h-12">
                  <Feather name="user" size={18} color="#555" />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username"
                    placeholderTextColor="#555"
                    className="flex-1 ml-3 text-white text-sm font-medium h-full"
                  />
                </View>

                {/* Email */}
                <View className="flex-row items-center bg-[#111] border border-[#222] rounded-xl px-4 h-12 mt-4">
                  <Feather name="mail" size={18} color="#555" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#555"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-white text-sm font-medium h-full"
                  />
                </View>

                {/* Password */}
                <View className="flex-row items-center bg-[#111] border border-[#222] rounded-xl px-4 h-12 mt-4">
                  <Feather name="lock" size={18} color="#555" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#555"
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-3 text-white text-sm font-medium h-full"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#555" />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View className="flex-row items-center bg-[#111] border border-[#222] rounded-xl px-4 h-12 mt-4">
                  <Feather name="check-circle" size={18} color="#555" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#555"
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 ml-3 text-white text-sm font-medium h-full"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#555" />
                  </TouchableOpacity>
                </View>

              </View>

              {/* Register Button */}
              <View className="items-center justify-center">
                  <Animated.View
                      style={{
                          width: '100%',
                          transform: [{ scale: pulseAnim }]
                      }}
                  >
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={loading}
                        className={`w-full h-12 rounded-xl flex-row justify-center items-center ${loading ? 'bg-[#333]' : 'bg-white'}`}
                    >
                        {loading ? (
                            <Text className="text-gray-400 font-semibold text-sm">
                                Creating...
                            </Text>
                        ) : (
                            <Text className="text-black font-bold text-sm">
                                Sign Up
                            </Text>
                        )}
                    </TouchableOpacity>
                  </Animated.View>
              </View>

              {/* Bottom Links */}
              <View className="flex-row justify-center items-center mt-8 pb-10">
                <Text className="text-neutral-600 text-xs">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/auth/login")}>
                  <Text className="text-white font-bold text-xs ml-1">Log In</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}