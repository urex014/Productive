// app/ChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronLeft } from "lucide-react-native";
import { useSocket } from "../context/socketContext.js";

// ✅ Import push notification hook
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function ChatRoom() {
  const BASE_URL = "http://192.168.100.30:5000";
  const { chatId, displayName, displayImage } = useLocalSearchParams();
  const router = useRouter();

  const { socket, isConnected } = useSocket(); // global socket instance

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  // ✅ Get push notification state from hook
  const { expoPushToken, notification } = usePushNotifications();

  // Load logged-in user id once
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUserId(JSON.parse(stored).id);
    };
    loadUser();
  }, []);

  // ✅ Send push token to backend when available
  useEffect(() => {
    if (expoPushToken && userId) {
      fetch(`${BASE_URL}/api/users/push-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: expoPushToken.data,
        }),
      }).catch((err) =>
        console.error("Failed to send push token:", err)
      );
    }
  }, [expoPushToken, userId]);

  // Fetch chat info + messages
  const fetchChat = async () => {
    if (!chatId) return;
    setLoading(true);

    try {
      console.log("Fetching chat with ID:", chatId);

      const res = await fetch(
        `${BASE_URL}/api/chats/${chatId}/messages`
      );
      if (!res.ok) throw new Error("Failed to fetch chat");
      const data = await res.json();

      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
  }, [chatId]);

  // WebSocket: join room and listen for new messages
  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;

    socket.emit("joinRoom", chatId);

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });

      // ✅ When a new message arrives, you can also trigger a local notification
      //    (This is optional – backend usually handles pushes for background)
      if (msg.senderId !== userId) {
        // foreground notification handling
        console.log("New incoming message:", msg.message);
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.emit("leaveRoom", chatId);
    };
  }, [socket, isConnected, chatId]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !userId || !socket) return;

    socket.emit("sendMessage", {
      chatId,
      senderId: userId,
      message: newMessage,
    });

    setNewMessage("");
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <View className="mb-4">
          <TouchableOpacity
            className="ml-5 mb-3"
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-3">getting chats...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-800 bg-primary">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <Image
            source={{
              uri: "https://img.icons8.com/ios-filled/100/user-male-circle.png",
            }}
            className="w-10 h-10 rounded-full mr-3"
          />
        )}
        <Text className="text-white text-xl font-bold">{displayName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View
            className={`p-3 my-1 rounded-2xl max-w-[75%] ${
              item.senderId === userId
                ? "bg-blue-600 self-end rounded-br-none"
                : "bg-gray-700 self-start rounded-bl-none"
            }`}
          >
            {item.senderId !== userId && (
              <Text className="text-gray-300 text-xs mb-1">
                {item.senderName || "User"}
              </Text>
            )}
            <Text className="text-white">{item.message}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-4">
            No messages yet. Start the conversation!
          </Text>
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Input */}
      <View className="flex-row items-center p-3 border-t border-gray-800 bg-primary">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          className="flex-1 bg-gray-800 text-white p-3 rounded-2xl mr-2"
        />
        <TouchableOpacity
          onPress={sendMessage}
          className="bg-blue-600 p-3 rounded-full"
        >
          <Text className="text-white font-bold">➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
