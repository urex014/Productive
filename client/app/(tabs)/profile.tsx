// app/profile.tsx
import * as React from "react"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"

import { LogOut, RectangleEllipsis, UserPen } from "lucide-react-native"

import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"
import Toast from "react-native-toast-message"

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)

  const [newUsername, setNewUsername] = useState("")
  const [newImage, setNewImage] = useState("")

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const API_BASE = "http://192.168.100.191:5000"

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
        Toast.show({
          type:"error",
          text1:"failed to fetch profile",
          text2: err
        })
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token")
    Toast.show({
      type:"success",
      text1:"you've been successfully logged out"
    });
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
      Toast.show({
        type:"success",
        text1:"profile updated successfully"
      })
      setEditModalVisible(false)
    } catch (err: any) {
      Toast.show({
        type:"error", 
        text1:"profile update failed",
        text2:err 
      })
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

      Toast.show({
        type:"success",
        text1:"password updated successfully"
      })
      setPasswordModalVisible(false)
      setOldPassword("")
      setNewPassword("")
    } catch (err: any) {
      Toast.show({
        type:"error",
        text1:"password update failed",
        text2:err
      })
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
      <View className="rounded-[8px] w-full p-6  flex flex-row bg-[rgb(0,0,0,0.7)] border border-y-orange-500 border-x-orange-300 mb-6">
        <Image
          source={{
            uri:
              user?.image && user.image.trim()
                ? // If the image is already an absolute URL (starts with http) use it, otherwise prefix API_BASE
                  user.image.startsWith("http")
                  ? user.image
                  : `${API_BASE}${user.image}`
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <View className="flex w-full items-center justify-center pl-6 ml-6 flex-col">
        <Text className="text-white text-2xl font-semibold">Username: {user?.username}</Text>
        <Text className="text-white font-semibold text-xl">Email: {user?.email}</Text>
        </View>
      </View>

     {/* Actions */}
<View className="flex-row flex-wrap justify-between mt-6">
  {/* Edit Profile */}
  <TouchableOpacity
    className="bg-[rgb(0,0,0,0.7)] border border-blue-300 h-40 flex-col w-[48%] p-6 rounded-2xl mb-4 items-center shadow-lg"
    onPress={() => setEditModalVisible(true)}
  >
    <UserPen size={48} color={"white"} />
    <Text className="text-white text-start font-bold text-lg">Edit Profile</Text>
  </TouchableOpacity>

  {/* Change Password */}
  <TouchableOpacity
    className="bg-[rgb(0,0,0,0.7)] border border-[#10b981] w-[48%] h-40 flex-col p-6 rounded-2xl mb-4 justify-center items-center shadow-lg"
    onPress={() => setPasswordModalVisible(true)}
  >
    <RectangleEllipsis color={"white"} size={48} />
    <Text className="text-white text-start font-bold text-lg">Change Password</Text>
  </TouchableOpacity>
  {/* Logout */}
  <TouchableOpacity
    className="bg-[rgb(0,0,0,0.7)] border border-red-300 w-[48%] flex-col h-40 p-6 rounded-2xl mb-4 items-center shadow-lg"
    onPress={handleLogout}
  >
    <LogOut size={48} color="white" />
    <Text className="text-white font-bold text-lg">Logout</Text>
  </TouchableOpacity>
</View>

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
