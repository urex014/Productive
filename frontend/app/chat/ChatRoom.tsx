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
import io from "socket.io-client";
import { ChevronLeft } from "lucide-react-native";

const SOCKET_URL = "http://192.168.100.30:5000"; // adjust to your backend IP

export default function ChatRoom() {
  const { chatId, chatName, profilePic } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef(null);
  const [userId, setUserId] = useState(null);

  const socketRef = useRef(null);

  // Load logged-in user id
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id);
      }
    };
    loadUser();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!chatId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
      socket.emit("joinRoom", chatId);
    });

    // ✅ Only one listener: server always emits `receiveMessage`
    socket.on("receiveMessage", (msg) => {
      console.log("📩 Received:", msg);
      setMessages((prev) => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      socket.disconnect();
    };
  }, [chatId]);

  // Fetch old messages once (history)
  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `http://192.168.100.30:5000/api/chats/${chatId}/messages`
      );
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !userId) return;

    const msg = {
      chatId,
      senderId: userId,
      message: newMessage,
    };

    // ✅ Only emit — server echoes back via `receiveMessage`
    socketRef.current.emit("sendMessage", msg);
    setNewMessage("");
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#fff" />
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
          <ChevronLeft size={24} color={"white"} />
        </TouchableOpacity>
        {profilePic ? (
          <Image
            source={{ uri: profilePic }}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-400 mr-3" />
        )}
        <Text className="text-white text-xl font-bold">{chatName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString()} // ✅ use DB id only
        renderItem={({ item }) => (
          <View
            className={`p-3 my-1 rounded-2xl max-w-[75%] ${
              item.senderId == userId
                ? "bg-blue-600 self-end rounded-br-none"
                : "bg-gray-700 self-start rounded-bl-none"
            }`}
          >
            {/* Show sender name for received messages */}
            {item.senderId != userId && (
              <Text className="text-gray-300 text-xs mb-1">
                {item.senderName || "User"}
              </Text>
            )}
            <Text className="text-white">{item.message}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 10 }}
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
