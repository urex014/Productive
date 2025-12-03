import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { BASE_URL } from "../../baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, KeyRound, Lock, Mail } from "lucide-react-native";

export default function ResetPasswordScreen() {
  const router = useRouter();
  
  // 1. Retrieve email from navigation params
  const params = useLocalSearchParams<{ email: string }>();
  const passedEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  // 2. Initialize state with passed email (or empty string if accessed directly)
  const [email, setEmail] = useState(passedEmail || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !code.trim() || !newPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please ensure email, code, and password are filled."
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Password updated. Please login."
      });
      
      setTimeout(() => router.replace("/auth/login"), 1500);

    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: err.message
      });
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
            <View className="flex-1 justify-start px-6 pt-10">
              
              {/* Header */}
              <View className="mb-10">
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  className="w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/10 mb-6"
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-3xl font-bold tracking-tighter">Enter Code</Text>
                <Text className="text-neutral-500 text-sm mt-2 leading-5">
                  We sent a 6-digit code to <Text className="text-white font-bold">{email || "your email"}</Text>. Enter it below to reset your password.
                </Text>
              </View>

              {/* Form */}
              <View className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6">
                
                {/* Email Input - Pre-filled */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 h-14 mb-4">
                  <Mail size={20} color="#666" />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    // Optional: If you want to lock it when passed from previous screen
                    // editable={!passedEmail} 
                    className={`flex-1 ml-3 text-white text-base font-medium h-full ${passedEmail ? 'opacity-70' : ''}`}
                  />
                </View>

                {/* Code Input */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 h-14 mb-4">
                  <KeyRound size={20} color="#666" />
                  <TextInput
                    placeholder="6-Digit Code"
                    placeholderTextColor="#666"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    className="flex-1 ml-3 text-white text-base font-medium h-full tracking-widest"
                  />
                </View>

                {/* New Password Input */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 h-14 mb-6">
                  <Lock size={20} color="#666" />
                  <TextInput
                    placeholder="New Password"
                    placeholderTextColor="#666"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    className="flex-1 ml-3 text-white text-base font-medium h-full"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleReset}
                  disabled={loading}
                  className={`h-14 items-center justify-center rounded-2xl shadow-lg shadow-blue-500/20 ${loading ? 'bg-blue-800' : 'bg-blue-600'}`}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg tracking-wide">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>

              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}