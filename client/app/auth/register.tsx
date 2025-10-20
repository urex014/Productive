// app/auth/register.tsx
import * as React from "react";
import {useState} from 'react'
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";

export default function RegisterScreen() {
  const BASE_URL = "http://192.168.100.191:5000";
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
    <View className="bg-primary p-6 flex-1 items-center justify-center">
      
      <Text style={styles.heading}>Create Account</Text>

      {/* Username */}
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      {/* Email */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      {/* Password */}
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        style={styles.input}
      />

      {/* Confirm Password */}
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        style={[styles.input, { marginBottom: 20 }]}
      />

      {/* Error Message */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {/* Register Button */}
      <TouchableOpacity
        onPress={handleRegister}
        style={styles.button}
        className={loading?"border flex items-center justify-center border-orange-500 p-4 rounded-full":"rounded-full  flex items-center justify-center w-full bg-purple-500 p-4"}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Registering..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {/* Already have an account */}
      <View style={styles.bottomLinks}>
        <Text style={styles.grayText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.whiteText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:"#000000",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  heading: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "80%",
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
    width: "80%",
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: "#7b5fff",
    alignItems: "center",
    shadowColor: "#7b5fff",
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  buttonDisabled: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: "gray",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  error: {
    color: "red",
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  bottomLinks: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  grayText: { color: "#ccc" },
  whiteText: { color: "white", fontWeight: "600" },
});
