// app/profile.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";

import { LogOut, RectangleEllipsis, UserPen, Camera, X, Check, Lock, User } from "lucide-react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { BASE_URL } from "../../baseUrl";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newImage, setNewImage] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // --- Logic Section (Preserved) ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load user");
        setUser(data.user);
      } catch (err: any) {
        Toast.show({ type: "error", text1: "Failed to fetch profile" });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    Toast.show({ type: "success", text1: "Logged out successfully" });
    router.replace("/auth/login");
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setNewImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername || user.username,
          image: newImage || user.image,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setUser(data.user);
      Toast.show({ type: "success", text1: "Profile updated" });
      setEditModalVisible(false);
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Update failed", text2: err.message });
    }
  };

  const handleChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password change failed");

      Toast.show({ type: "success", text1: "Password updated" });
      setPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Update failed", text2: err.message });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#DD2476" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

      <SafeAreaView className="flex-1 px-6 pt-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-white tracking-widest">Identity</Text>
          <Text className="text-sm text-neutral-500 mt-1 uppercase tracking-widest">User Configuration</Text>
        </View>

        {/* User Identity Card */}
        <View className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 mb-8 relative overflow-hidden">
          {/* Subtle background glow */}
          <LinearGradient 
            colors={['rgba(255, 81, 47, 0.05)', 'rgba(0,0,0,0)']} 
            className="absolute inset-0" 
          />
          
          <View className="flex-row items-center">
            <View className="relative">
              <Image
                source={{
                  uri: user?.image && user.image.trim()
                    ? user.image.startsWith("http")
                      ? user.image
                      : `${BASE_URL}${user.image}`
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                className="w-24 h-24 rounded-full border-2 border-neutral-800"
              />
              {/* Glowing ring effect */}
              <View className="absolute inset-0 rounded-full border border-white/20" />
            </View>

            <View className="ml-6 flex-1">
              <Text className="text-white text-2xl font-bold mb-1">{user?.username}</Text>
              <Text numberOfLines={1} className="text-neutral-500 font-medium text-sm tracking-wide">
                {user?.email}
              </Text>
              <View className="flex-row mt-3">
                 <View className="bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <Text className="text-green-500 text-[10px] font-bold uppercase">Online</Text>
                 </View>
              </View>
            </View>
          </View>
        </View>

        {/* Control Grid */}
        <Text className="text-white/90 text-lg font-bold mb-4">Settings</Text>
        <View className="flex-row flex-wrap justify-between">
          
          {/* Edit Profile */}
          <TouchableOpacity
            className="w-[48%] h-40 bg-neutral-900/50 border border-blue-500/20 rounded-3xl p-5 justify-between mb-4"
            onPress={() => setEditModalVisible(true)}
          >
            <View className="bg-blue-500/10 w-12 h-12 rounded-full items-center justify-center">
               <UserPen size={24} color="#3b82f6" />
            </View>
            <View>
               <Text className="text-white font-bold text-lg">Edit</Text>
               <Text className="text-neutral-500 text-xs">Update details</Text>
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            className="w-[48%] h-40 bg-neutral-900/50 border border-emerald-500/20 rounded-3xl p-5 justify-between mb-4"
            onPress={() => setPasswordModalVisible(true)}
          >
            <View className="bg-emerald-500/10 w-12 h-12 rounded-full items-center justify-center">
               <Lock size={24} color="#10b981" />
            </View>
            <View>
               <Text className="text-white font-bold text-lg">Security</Text>
               <Text className="text-neutral-500 text-xs">Change Password</Text>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            className="w-full bg-red-500/5 border border-red-500/20 rounded-3xl p-5 flex-row items-center justify-between mt-2"
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <View className="bg-red-500/10 w-10 h-10 rounded-full items-center justify-center mr-4">
                 <LogOut size={20} color="#ef4444" />
              </View>
              <Text className="text-red-500 font-bold text-lg">System Logout</Text>
            </View>
            <View className="bg-red-500/10 px-3 py-1 rounded-full">
              <Text className="text-red-500 text-xs font-bold">END SESSION</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Modals --- */}

        {/* Edit Profile Modal */}
        <Modal visible={editModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 bg-black/80 justify-end">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View className="flex-1" /></TouchableWithoutFeedback>
            <View className="bg-[#121212] border-t border-white/10 p-6 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-6">
                 <Text className="text-white text-xl font-bold">Edit Profile</Text>
                 <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <X color="#666" size={24} />
                 </TouchableOpacity>
              </View>

              {/* Image Picker */}
              <View className="items-center mb-6">
                <TouchableOpacity onPress={handlePickImage} className="relative">
                   <Image 
                      source={{ uri: newImage || (user?.image?.startsWith("http") ? user.image : `${BASE_URL}${user?.image}`) }} 
                      className="w-24 h-24 rounded-full border-2 border-neutral-700 opacity-80" 
                   />
                   <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                      <Camera color="white" size={24} />
                   </View>
                </TouchableOpacity>
                <Text className="text-neutral-500 text-xs mt-2">Tap to change avatar</Text>
              </View>

              <Text className="text-neutral-400 text-xs uppercase tracking-widest mb-2 ml-1">Username</Text>
              <TextInput
                placeholder="Username"
                placeholderTextColor="#555"
                value={newUsername}
                onChangeText={setNewUsername}
                className="bg-black text-white px-4 py-4 rounded-xl mb-6 border border-neutral-800"
              />

              <TouchableOpacity
                className="bg-blue-600 p-4 rounded-xl items-center mb-4"
                onPress={handleSaveProfile}
              >
                <Text className="text-white font-bold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Change Password Modal */}
        <Modal visible={passwordModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 bg-black/80 justify-end">
             <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View className="flex-1" /></TouchableWithoutFeedback>
            <View className="bg-[#121212] border-t border-white/10 p-6 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-6">
                 <Text className="text-white text-xl font-bold">Security</Text>
                 <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                    <X color="#666" size={24} />
                 </TouchableOpacity>
              </View>

              <Text className="text-neutral-400 text-xs uppercase tracking-widest mb-2 ml-1">Current Password</Text>
              <TextInput
                placeholder="••••••"
                placeholderTextColor="#555"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                className="bg-black text-white px-4 py-4 rounded-xl mb-4 border border-neutral-800"
              />

              <Text className="text-neutral-400 text-xs uppercase tracking-widest mb-2 ml-1">New Password</Text>
              <TextInput
                placeholder="••••••"
                placeholderTextColor="#555"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                className="bg-black text-white px-4 py-4 rounded-xl mb-8 border border-neutral-800"
              />

              <TouchableOpacity
                className="bg-emerald-600 p-4 rounded-xl items-center mb-4"
                onPress={handleChangePassword}
              >
                <Text className="text-white font-bold">Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}