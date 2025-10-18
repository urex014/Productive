// app/ChatList.jsx
import { useRouter } from "expo-router";
import * as React from 'react';
import {useState, useEffect} from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { icons } from "@/constants/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "@/components/SearchBar";
import { SearchX, ChevronLeft } from "lucide-react-native";
import { WebView } from 'react-native-webview';

export default function ChatList() {
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const BASE_API = 'http://192.168.100.30:5000'

  // Load userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) setUserId(Number(storedId));
        else console.error("No user ID found in storage");
      } catch (err) {
        console.error("Error getting userId from AsyncStorage", err);
      }
    };
    fetchUserId();
  }, []);

  // Fetch chats when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(
          `http://192.168.100.30:5000/api/chats/user/${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch chats");
        const data = await res.json();
        setChats(data);
        setFilteredChats(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  // Search users by username
  interface User {
    id: number;
    username: string;
    image?: string;
    email?: string;
  }

  interface Chat {
    id: number;
    type: string;
    displayName: string;
    displayImage?: string;
    lastMessage?: string;
  }

  const searchUsers = async (text: string): Promise<void> => {
    setQuery(text);

    if (!text.trim()) {
      setSearchResults([]);
      setFilteredChats(chats);
      return;
    }

    try {
      const res = await fetch(
        `http://192.168.100.30:5000/api/chats/search/users?q=${encodeURIComponent(
          text
        )}`
      );
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  // Start a direct chat and navigate to ChatRoom
  const startChat = async (otherUserId) => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.100.30:5000/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          participants: [Number(userId), Number(otherUserId)],
        }),
      });

      const chat = await res.json();
      if (chat.error) {
        Alert.alert("Error", chat.error);
        return;
      }

      await AsyncStorage.setItem("activeChat", JSON.stringify(chat));

      // Navigate to ChatRoom with chatId and the rest 
      router.push({
        pathname: "/chat/ChatRoom",
        params: {
          chatId: chat.id,
          displayName: chat.displayName || "New chat",
          displayImage: `${BASE_API}${chat.displayImage}` || null
        },
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      Alert.alert("Error", "Something went wrong while starting the chat");
    } finally {
      setLoading(false);
    }
  };

  // Render existing chat
  const renderChatItem = ({ item }) => {
    const isAI = item.type === "ai";
    const profilePic = isAI
      ? "https://img.icons8.com/color/96/bot.png"
      : `${BASE_API}${item.displayImage}` ||
        "https://img.icons8.com/ios-filled/100/user-male-circle.png";

    return (
      <Pressable
        className="flex-row items-center px-4 py-3 border-y border-neutral-700"
        onPress={() => {
          router.push({
            pathname: "/chat/ChatRoom",
            params: { chatId: item.id,
                      displayName:item.displayName,
                      displayImage:`${BASE_API}${item.displayImage}`
                },
          });
        }}
      >
        <Image
          source={{ uri: profilePic }}
          className="w-12 h-12 rounded-full mr-4"
        />
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {item.displayName}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {isAI ? "Your productivity assistant" : item.lastMessage || "Tap to chat"}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Render search result user
  const renderUserItem = ({ item }) => (
    <Pressable
      className="flex-row items-center px-4 py-3 border-b border-neutral-700"
      onPress={() => startChat(item.id)}
    >
      <Image
        source={{
          uri:
            item.image ||
            "https://img.icons8.com/ios-filled/100/user-male-circle.png",
        }}
        className="w-12 h-12 rounded-full mr-4"
      />
      <Text className="text-white font-semibold text-base">{item.username}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 pt-12 bg-primary">
      {/* Back button */}
      <TouchableOpacity className="ml-5 mb-1" onPress={() => router.back()}>
        <ChevronLeft size={24} color="white" />
      </TouchableOpacity>

      {/* Search bar */}
      <SearchBar query={query} setQuery={searchUsers} />

      <Text className="font-bold text-3xl text-white mx-3 my-4">All chats</Text>

      {/* Chat list or search results */}
      {query.trim() && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
        />
      ) : filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-12">
          <WebView scalesPageToFit={false}
          originWhitelist={['*']}
          domStorageEnabled={true}
          source={icons.book}
          />
          <Text className="text-gray-400 font-bold text-center mt-4">
            No chats available. Search for users using their username or email
            to start a new chat!
          </Text>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View className="flex-1 bg-primary">
  {/* Header */}
  <View className="pt-4 px-5">
    <TouchableOpacity onPress={() => router.back()} className="self-start">
      <ChevronLeft size={24} color="white" />
    </TouchableOpacity>
  </View>

  {/* Chat list skeleton */}
  <View className="flex-1 px-4 mt-6">
    {[1, 2, 3, 4, 5].map((item) => (
      <View key={item} className="flex-row items-center p-3 border-y border-gray-700">
        <View className="w-12 h-12 bg-gray-600 rounded-full mr-3"></View>
        <View className="flex-1">
          <View className="h-4 bg-gray-600 rounded-full mb-2 w-3/4"></View>
          <View className="h-3 bg-gray-600 rounded-full w-1/2"></View>
        </View>
        <View className="items-end">
          <View className="h-3 bg-gray-600 rounded-full w-10 mb-1"></View>
          <View className="w-5 h-5 bg-blue-500 rounded-full"></View>
        </View>
      </View>
    ))}
  </View>

  {/* Loading indicator */}
  <View className="items-center py-4">
    <ActivityIndicator size="small" color="#fff" />
    <Text className="text-white mt-2 text-sm">Loading messages...</Text>
  </View>
</View>
      )}
    </SafeAreaView>
  );
}
