// app/forgot-password.tsx
import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { BlurView } from "expo-blur"

const API_BASE = "http://your-api-url.com/api/auth" // replace with your backend URL

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGetCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to send code")

      Alert.alert("Success", "A reset code has been sent to your email.")
    } catch (err: any) {
      console.error("Forgot password error:", err)
      Alert.alert("Error", err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-white text-2xl font-bold mb-6">Forgot Password</Text>

      <BlurView intensity={70} tint="dark" className="rounded-xl p-4 mb-6">
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="text-white text-base"
        />
      </BlurView>

      <TouchableOpacity
        onPress={handleGetCode}
        disabled={loading}
        className={`p-4 rounded-xl items-center ${
          loading ? "bg-gray-700" : "bg-blue-500"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            Get Reset Code
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
