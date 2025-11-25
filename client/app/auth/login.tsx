/* eslint-disable react/no-unescaped-entities */
// app/auth/login.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";
import { BASE_URL } from "../../baseUrl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
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

  const handleLogin = async () => {
    if (!email || !password) {
        Toast.show({ type: 'error', text1: "Please fill in all fields" });
        return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token && data.user) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("userId", String(data.user.id));
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        registerForPushNotificationsAsync().then(async (token) => {
            if (token) {
                try {
                    await fetch(`${BASE_URL}/api/notifications/register-token`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${data.token}`,
                        },
                        body: JSON.stringify({ userId: data.user.id, expoPushToken: token }),
                    });
                } catch (e) { console.error(e); }
            }
        });

        Toast.show({ type: 'success', text1: "Welcome back!" });
        router.replace("/");
      } else {
        Toast.show({ type: 'error', text1: data.error || "Invalid credentials" });
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }
    } catch (err) {
      console.error("Login error:", err);
      Toast.show({ type: 'error', text1: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

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
              <View className="items-center mb-12">
                <Text className="text-white text-4xl font-bold tracking-tighter">Welcome Back</Text>
                <Text className="text-neutral-500 text-sm mt-2 uppercase tracking-widest">Re-establish Connection</Text>
              </View>

              {/* Form Container (Glass Card) */}
              <View className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 mb-6">
                
                {/* Email Input */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 py-4 mb-4">
                  <Feather name="mail" size={20} color="#666" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-white font-medium text-base"
                  />
                </View>

                {/* Password Input */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 py-4 mb-6">
                  <Feather name="lock" size={20} color="#666" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-3 text-white font-medium text-base"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Login Button with Pulsing Border */}
                <View className="relative items-center justify-center">
                    {loading && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: -4, bottom: -4, left: -4, right: -4,
                                borderRadius: 20,
                                borderWidth: 2,
                                borderColor: '#8b5cf6', 
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.5],
                                    outputRange: [1, 0]
                                }),
                                transform: [{ scale: pulseAnim }]
                            }}
                        />
                    )}
                    
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl flex-row justify-center items-center ${loading ? 'bg-violet-900' : 'bg-violet-600'}`}
                        style={{
                            shadowColor: "#8b5cf6",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                        }}
                    >
                        {loading ? (
                            <Text className="text-violet-200 font-bold text-lg tracking-wide uppercase">
                                Authenticating...
                            </Text>
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide uppercase">
                                Access System
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

              </View>

              {/* Bottom Links */}
              <View className="items-center mt-4 gap-6 pb-10">
                <View className="flex-row">
                    <Text className="text-neutral-500">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/auth/register")}>
                    <Text className="text-white font-bold ml-1">Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
                    <Text className="text-neutral-600 text-sm underline">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}