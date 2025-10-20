// app/auth/login.tsx
import React, { useState} from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";
import { BASE_URL } from "../../baseUrl";
import { SafeAreaView } from "react-native-safe-area-context";
export default function LoginScreen() {
  // const BASE_URL = "http://192.168.43.116:5000";
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
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("userId", String(data.user.id));
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        const expoPushToken = await registerForPushNotificationsAsync();

        if (expoPushToken) {
          try {
            await fetch(`${BASE_URL}/api/notifications/register-token`, {
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
          } catch (pushErr) {
            console.error("Failed to register push token:", pushErr);
          }
        }

        router.replace("/");
      } else {
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
     <SafeAreaView className="bg-primary p-6 flex-1 items-center justify-center">

      {/* Overlay content */}

        {/* Login Card with visible blur */}
          <Text className="font-bold my-6 text-white text-3xl">Welcome Back</Text>

          {/* Email Input */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#c5c7ce"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Password Input */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#c5c7ce"
            secureTextEntry
            style={styles.input}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={styles.button}
            className={loading?"border w-[80%] flex items-center justify-center border-orange-500 p-4 rounded-full":"rounded-full  flex items-center justify-center w-full bg-orange-500 p-4"}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Sign Up + Forgot Password */}
        <View style={styles.bottomLinks}>
          <Text style={styles.grayText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.whiteText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
          <Text style={[styles.grayText, { textDecorationLine: "underline", marginTop: 10 }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  card: {
    width: "100%",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)", // semi-transparent black
  },
  heading: { color: "white", fontSize: 44, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  input: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: "#7b5fff",
    alignItems: "center",
    shadowColor: "#7b5fff",
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  buttonDisabled: {
    width: "90%",
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: "gray",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  error: { color: "red", marginTop: 15, fontWeight: "500" },
  bottomLinks: { flexDirection: "row", marginTop: 25, alignItems: "center" },
  grayText: { color: "#ccc" },
  whiteText: { color: "white", fontWeight: "600" },
});