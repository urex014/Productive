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
  Keyboard,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";
import { BASE_URL } from "../../baseUrl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as LocalAuthentication from 'expo-local-authentication'; // Import this

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check for Biometric Support on Mount
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
    })();
  }, []);

  // Pulsing Animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  // Handle Biometric Login
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your dashboard',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        // LOGIC: You usually need a token saved from a previous successful login to auto-login.
        // For this example, we will check if a token exists in storage.
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
           Toast.show({ type: 'success', text1: "Biometric verified!" });
           router.replace("/");
        } else {
           Toast.show({ type: 'error', text1: "Please log in with password first to enable biometrics." });
        }
      } else {
        // result.error contains error code (e.g., 'user_cancel')
      }
    } catch (error) {
      console.error(error);
    }
  };

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

        // Register Push Token
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
    <View className="flex-1 bg-[#050505]">
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
              <View className="items-start mb-12">
                <Text className="text-white text-3xl font-bold tracking-tight">Welcome Back</Text>
                <Text className="text-neutral-500 text-sm mt-1">Sign in to continue</Text>
              </View>

              {/* Inputs */}
              <View className="mb-8 space-y-4">
                <View className="flex-row items-center bg-[#111] border border-[#222] rounded-xl px-4 h-12">
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
              </View>

              {/* Buttons */}
              <View className="items-center justify-center space-y-4">
                  {/* Main Login Button */}
                  <Animated.View
                      style={{ width: '100%', transform: [{ scale: pulseAnim }] }}
                  >
                      <TouchableOpacity
                          onPress={handleLogin}
                          disabled={loading}
                          className={`w-full h-12 rounded-xl flex-row justify-center items-center ${loading ? 'bg-[#333]' : 'bg-white'}`}
                      >
                          {loading ? (
                              <Text className="text-gray-400 font-semibold text-sm">Verifying...</Text>
                          ) : (
                              <Text className="text-black font-bold text-sm">Sign In</Text>
                          )}
                      </TouchableOpacity>
                  </Animated.View>

                  {/* Biometric Button (Only shows if supported) */}
                  {isBiometricSupported && (
                     <TouchableOpacity 
                        onPress={handleBiometricLogin}
                        className="mt-4 p-3 bg-[#111] border border-[#222] rounded-full"
                     >
                        <MaterialIcons name="fingerprint" size={32} color="#888" />
                     </TouchableOpacity>
                  )}
              </View>

              {/* Footer Links */}
              <View className="items-center mt-8 gap-6 pb-10">
                <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
                    <Text className="text-neutral-600 text-xs">Forgot Password?</Text>
                </TouchableOpacity>

                <View className="flex-row">
                    <Text className="text-neutral-600 text-xs">New user? </Text>
                    <TouchableOpacity onPress={() => router.push("/auth/register")}>
                        <Text className="text-white font-bold text-xs ml-1">Create account</Text>
                    </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}