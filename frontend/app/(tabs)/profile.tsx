// app/profile.tsx
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from "react-native"
import { BlurView } from "expo-blur"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)

  const [newUsername, setNewUsername] = useState("")
  const [newImage, setNewImage] = useState("")

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const API_BASE = "http://192.168.100.30:5000"

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to load user")
        setUser(data.user)
      } catch (err: any) {
        console.error(err)
        Alert.alert("Error", err.message || "Failed to fetch profile")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token")
    Alert.alert("Logged out", "You have been logged out successfully");
    router.replace("/auth/login")
  }

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled) {
      setNewImage(`data:image/jpeg;base64,${result.assets[0].base64}`)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername || user.username,
          image: newImage || user.image,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Update failed")

      setUser(data.user)
      Alert.alert("Success", "Profile updated successfully")
      setEditModalVisible(false)
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile")
    }
  }

  const handleChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Password change failed")

      Alert.alert("Success", "Password updated successfully")
      setPasswordModalVisible(false)
      setOldPassword("")
      setNewPassword("")
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to change password")
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black px-6 pt-10">
      <Text className="text-white text-2xl font-bold mb-6">Profile</Text>

      {/* User Card */}
      <BlurView intensity={70} tint="dark" className="rounded-2xl p-6 items-center mb-6">
        <Image
          source={{
            uri: user?.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <Text className="text-white text-xl font-semibold">{user?.username}</Text>
        <Text className="text-gray-400 text-sm">{user?.email}</Text>
      </BlurView>

      {/* Actions */}
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-xl mb-4 items-center"
        onPress={() => setEditModalVisible(true)}
      >
        <Text className="text-white font-semibold">Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-yellow-500 p-4 rounded-xl mb-4 items-center"
        onPress={() => setPasswordModalVisible(true)}
      >
        <Text className="text-black font-semibold">Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-red-500 p-4 rounded-xl items-center"
        onPress={handleLogout}
      >
        <Text className="text-white font-semibold">Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-[#1f1f3a] p-6 rounded-2xl">
            <Text className="text-white text-lg font-bold mb-4">Edit Profile</Text>
            <TouchableOpacity
              className="bg-gray-700 p-3 rounded-xl mb-4 items-center"
              onPress={handlePickImage}
            >
              <Text className="text-white">Choose Image</Text>
            </TouchableOpacity>
            {newImage ? (
              <Image source={{ uri: newImage }} className="w-24 h-24 rounded-full mb-4 self-center" />
            ) : null}
            <TextInput
              placeholder="New Username"
              placeholderTextColor="#999"
              value={newUsername}
              onChangeText={setNewUsername}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-4"
            />
            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-xl mb-4 items-center"
              onPress={handleSaveProfile}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-600 p-4 rounded-xl items-center"
              onPress={() => setEditModalVisible(false)}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-[#1f1f3a] p-6 rounded-2xl">
            <Text className="text-white text-lg font-bold mb-4">Change Password</Text>
            <TextInput
              placeholder="Old Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-4"
            />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-4"
            />
            <TouchableOpacity
              className="bg-yellow-500 p-4 rounded-xl mb-4 items-center"
              onPress={handleChangePassword}
            >
              <Text className="text-black font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-600 p-4 rounded-xl items-center"
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
