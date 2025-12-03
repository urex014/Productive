/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { BASE_URL } from "../../baseUrl";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mail } from "lucide-react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetCode = async () => {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your registered email address."
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code");

      Toast.show({
        type: "success",
        text1: "Check your inbox",
        text2: "A reset link has been sent to your email."
      });
      
      // Optional: Navigate back to login after a delay
      setTimeout(() => router.push({
        pathname: "/auth/reset-password",
        params: { email }
      }), 1000);

    } catch (err: any) {
      console.error("Forgot password error:", err);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: err.message || 'Something went wrong. Please try again.'
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
            {/* Changed justify-center to justify-start and added padding-top (pt-10) to fix layout shifting */}
            <View className="flex-1 justify-start px-6 pt-10">
              
              {/* Header */}
              <View className="mb-10">
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  className="w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/10 mb-6"
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-4xl font-bold tracking-tighter">Forgot Password?</Text>
                <Text className="text-neutral-500 text-sm mt-2 leading-5">
                  Don't worry! It happens. Please enter the email associated with your account.
                </Text>
              </View>

              {/* Form Container */}
              <View className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6">
                
                {/* Email Input */}
                <View className="flex-row items-center bg-black border border-neutral-800 rounded-2xl px-4 h-14 mb-6">
                  <Mail size={20} color="#666" />
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-white text-base font-medium h-full"
                  />
                </View>

                {/* Submit Button - Changed from Gradient to Solid Color */}
                <TouchableOpacity
                  onPress={handleGetCode}
                  disabled={loading}
                  className={`h-14 items-center justify-center rounded-2xl shadow-lg ${loading ? 'bg-blue-800' : 'bg-white/10 border border-white/20'}`}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg tracking-wide">
                      Send Reset Link
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