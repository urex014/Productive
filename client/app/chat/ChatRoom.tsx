import { useRouter, useFocusEffect } from "expo-router";
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronLeft, Search, MessageSquare, User, Zap } from "lucide-react-native";
import { BASE_URL } from "../../baseUrl";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { getImageUrl } from "../../utils/imageUrl"; 

export default function ChatList() {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) setUserId(Number(storedId));
      } catch (err) {
        console.error("Error getting userId", err);
      }
    };
    fetchUserId();
  }, []);

  // Define fetch function
  const fetchChats = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/chats/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      setChats(data);
      setFilteredChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  // 1. FIX: Use useFocusEffect to refresh list whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [userId])
  );

  // 2. Keep interval for background updates while on screen
  useEffect(() => {
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const searchUsers = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setFilteredChats(chats);
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      // Ensure we send auth header if backend requires it for search
      const res = await fetch(`${BASE_URL}/api/chats/search/users?q=${encodeURIComponent(text)}`, {
         headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  const startChat = async (otherUserId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          participants: [Number(userId), Number(otherUserId)],
        }),
      });

      const chat = await res.json();
      if (chat.error) {
        Toast.show({ type: 'error', text1: chat.error });
        return;
      }

      await AsyncStorage.setItem("activeChat", JSON.stringify(chat));

      // Navigate immediately with the data we received
      router.push({
        pathname: "/chat/ChatRoom",
        params: {
          chatId: chat.id,
          displayName: chat.displayName || "Unknown User", // Fallback
          displayImage: chat.displayImage ? `${BASE_URL}${chat.displayImage}` : ""
        },
      });
      setQuery(""); 
    } catch (err) {
      Toast.show({ type: 'error', text1: "Error starting chat." });
    } finally {
      setLoading(false);
    }
  };

  // --- Render Items ---

  const renderChatItem = ({ item }: { item: any }) => {
    const isAI = item.type === "ai";
    const profilePic = getImageUrl(item.displayImage, isAI ? 'bot' : 'user'); 

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 mb-3 bg-neutral-900/60 border border-white/5 rounded-2xl"
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: "/chat/ChatRoom",
            params: {
              chatId: item.id,
              displayName: item.displayName,
              displayImage: item.displayImage ? `${BASE_URL}${item.displayImage}` : ""
            },
          });
        }}
      >
        <View className="relative">
          <Image
            source={{ uri: profilePic }}
            className="w-12 h-12 rounded-full bg-neutral-800"
          />
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121212]" />
        </View>

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-center">
            <Text className="text-white font-bold text-base tracking-wide">
              {item.displayName}
            </Text>
            {isAI && (
               <View className="bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                  <Text className="text-purple-400 text-[10px] font-bold">BOT</Text>
               </View>
            )}
          </View>
          <Text numberOfLines={1} className="text-neutral-500 text-xs mt-1">
            {isAI ? "Your productivity assistant" : item.lastMessage || "Start the conversation..."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mb-3 bg-neutral-900/40 border border-dashed border-white/10 rounded-2xl"
      onPress={() => startChat(item.id)}
    >
      <View className="w-12 h-12 rounded-full bg-neutral-800 items-center justify-center mr-4 border border-white/10">
         {item.image ? (
            <Image source={{ uri: item.image }} className="w-full h-full rounded-full" />
         ) : (
            <User size={20} color="#666" />
         )}
      </View>
      <View>
        <Text className="text-white font-bold text-base">{item.username}</Text>
        <Text className="text-neutral-500 text-xs">Tap to message</Text>
      </View>
      <View className="ml-auto bg-white/5 p-2 rounded-full">
         <Zap size={16} color="#fbbf24" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

      <SafeAreaView className="flex-1 px-5 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 items-center justify-center bg-white/5 rounded-full border border-white/10 mr-4"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View>
             <Text className="text-3xl font-bold text-white">Messages</Text>
             <Text className="text-neutral-500 text-xs uppercase tracking-widest">Find friends</Text>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center bg-neutral-900/80 border border-white/10 rounded-2xl px-4 py-3">
             <Search size={20} color="#666" />
             <TextInput
                value={query}
                onChangeText={searchUsers}
                placeholder="Search operatives..."
                placeholderTextColor="#666"
                className="flex-1 ml-3 text-white text-base"
             />
          </View>
        </View>

        {query.trim() && searchResults.length > 0 ? (
          <View className="flex-1">
             <Text className="text-white/50 text-xs font-bold mb-3 uppercase">Search Results</Text>
             <FlatList
               data={searchResults}
               keyExtractor={(item) => item.id.toString()}
               renderItem={renderUserItem}
               showsVerticalScrollIndicator={false}
             />
          </View>
        ) : filteredChats.length > 0 ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderChatItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center items-center opacity-50 pb-20">
              <View className="w-20 h-20 bg-neutral-900 rounded-full items-center justify-center border border-white/5 mb-4">
                 <MessageSquare size={32} color="#333" />
              </View>
              <Text className="text-neutral-500 font-medium text-center max-w-[250px]">
                 NO current chats. Search for users to start texting
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )}

        {loading && (
          <View className="absolute inset-0 bg-black/80 flex justify-center items-center z-50">
             <ActivityIndicator size="large" color="#DD2476" />
             <Text className="text-white mt-4 font-bold tracking-widest text-xs">ESTABLISHING LINK...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}