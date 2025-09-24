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
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronLeft } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { useSocket } from "../context/socketContext.js";
import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";

export default function ChatRoom() {
  const BASE_URL = "http://192.168.100.30:5000";
  const { chatId, displayName, displayImage } = useLocalSearchParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  type Message = {
    id?: string | number;
    message: string | null;
    senderId: string | number;
    senderName?: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Load logged-in user id once
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUserId(JSON.parse(stored).id);
    };
    loadUser();
  }, []);

  // Register push token once userId is loaded
  useEffect(() => {
    const registerToken = async () => {
      if (!userId) return;
      try {
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          await fetch(`${BASE_URL}/api/users/push-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, token: expoPushToken }),
          });
        }
      } catch (err) {
        console.error("Failed to register push token:", err);
      }
    };
    registerToken();
  }, [userId]);

  // Foreground notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      if (data?.type === "chat_message" && data.chatId === chatId && data.senderId !== userId) {
        setMessages(prev => [
          ...prev,
          {
            message: body,
            senderId: data.senderId as string | number,
            senderName: data.senderName as string | undefined,
          },
        ]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    });
    return () => subscription.remove();
  }, [chatId, userId]);

  // Fetch chat messages
  const fetchChat = async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`);
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
      setMessages(prev => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });

      // Optional foreground logging
      if (msg.senderId !== userId) console.log("New incoming message:", msg.message);
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

    socket.emit("sendMessage", { chatId, senderId: userId, message: newMessage });
    setNewMessage("");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-primary">
  {/* Header */}
  <View className="pt-4 px-5">
    <TouchableOpacity onPress={() => router.back()} className="self-start">
      <ChevronLeft size={24} color="white" />
    </TouchableOpacity>
  </View>

  {/* Chat list skeleton */}
  <View className="flex-1 bg-primary">
  {/* Shimmer overlay for animation */}
  <View className="absolute inset-0 z-10">
    <View className="h-full w-20 bg-white/10 shimmer-animation" style={{transform: [{skewX: '-20deg'}]}}></View>
  </View>

  {/* Chat Header */}
  <View className="pt-4 px-5 pb-3 border-b border-gray-700">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="w-10 h-10 bg-gray-600 rounded-full"></View>
        <View className="ml-3">
          <View className="w-32 h-4 bg-gray-600 rounded-full mb-2"></View>
          <View className="w-20 h-3 bg-gray-600 rounded-full"></View>
        </View>
      </View>
      <View className="flex-row space-x-4">
        <View className="w-6 h-6 bg-gray-600 rounded"></View>
        <View className="w-6 h-6 bg-gray-600 rounded"></View>
      </View>
    </View>
  </View>

  {/* Simplified Messages */}
  <View className="flex-1 px-4 pt-4">
    {[1, 2, 3, 4, 5].map((item) => (
      <View key={item} className={`flex-row mb-4 ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        {item % 2 === 0 ? (
          // Outgoing message
          <View className="flex-row mr-4 items-end space-x-2 w-[70%]">
            <View className="flex-1 bg-blue-500 rounded-2xl rounded-tr-none p-3">
              <View className="h-4 bg-blue-400 rounded-full mb-1 w-3/4"></View>
            </View>
            {/* <View className="w-6 h-6 bg-blue-400 rounded-full"></View> */}
          </View>
        ) : (
          // Incoming message
          <View className="flex-row items-end space-x-2 max-w-[80%]">
            {/* <View className="w-6 h-6 bg-gray-600 rounded-full"></View> */}
            <View className="flex-1 bg-gray-700 rounded-2xl rounded-tl-none p-3">
              <View className="h-4 bg-gray-600 rounded-full w-1/2"></View>
            </View>
          </View>
        )}
      </View>
    ))}
  </View>

  {/* Input Area */}
  <View className="px-4 pb-6 pt-3">
    <View className="h-12 bg-gray-700 rounded-full"></View>
  </View>
</View>

  
  

</View>
    );
  }
  const uniqueMessages = messages.filter(
  (msg, idx, arr) => arr.findIndex(m => m.id === msg.id) === idx
);

  return (
    <KeyboardAvoidingView
    className="bg-primary"
    style={{flex:1}}
    behavior={Platform.OS === "android"?"height":"padding"}
    keyboardVerticalOffset={0}>
    <SafeAreaView className="flex-1 bg-primary">
      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-800 bg-primary">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri: Array.isArray(displayImage) ? displayImage[0] : (displayImage || "https://img.icons8.com/ios-filled/100/user-male-circle.png") }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <Text className="text-white text-xl font-bold">{displayName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={uniqueMessages}
        keyExtractor={item => item.id?.toString()||item.message}
        renderItem={({ item }) => (
          <View className={`p-3 my-1 rounded-3xl max-w-[75%] ${item.senderId === userId ? "bg-blue-600 self-end rounded-br-none" : "bg-gray-700 self-start rounded-bl-none"}`}>
            {item.senderId !== userId && <Text className="text-gray-300 text-xs mb-1">{item.senderName || "User"}</Text>}
            <Text className="text-white">{item.message}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={<Text className="text-gray-400 text-center mt-4">No messages yet. Start the conversation!</Text>}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
  
      <View className="flex-row items-center p-3 border-t bg-primary">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          className="flex-1 bg-gray-800 text-white p-3 rounded-2xl mr-2"
        />
        <TouchableOpacity onPress={sendMessage} className="bg-blue-600 p-3 rounded-full">
          <Text className="text-white font-bold">➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
