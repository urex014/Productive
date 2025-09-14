// app/ChatList.jsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "@/components/SearchBar";
import { SearchX, ChevronLeft } from "lucide-react-native";

export default function ChatList() {
  const router = useRouter();

  const [userId, setUserId] = useState(null); // user ID from storage
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");



  // Load userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log("All keys:", keys);
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) setUserId(Number(storedId)); // convert to number
        else console.error("No user ID found in storage");
      } catch (err) {
        console.error("Error getting userId from AsyncStorage", err);
      }
    };
    fetchUserId();
  }, []);

  // Fetch chats once userId is loaded
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://192.168.100.30:5000/api/chats/user/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch chats");
        const data = await res.json();
        setChats(data);
        setFilteredChats(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  // Search users by username
  const searchUsers = async (text) => {
    setQuery(text);

    if (text.trim() === "") {
      setSearchResults([]);
      setFilteredChats(chats);
      return;
    }

    try {
      const res = await fetch(
        `http://192.168.100.30:5000/api/chats/search/users?q=${encodeURIComponent(text)}`
      );
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  // Start a direct chat
  const startChat = async (otherUserId, otherUsername, otherImage) => {
    if (!userId || !otherUserId) {
      console.error("Invalid participant IDs", { userId, otherUserId });
      Alert.alert("Error", "Invalid participant IDs");
      return;
    }

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
      console.log("Chat response:", chat);

      if (chat.error) {
        console.error("Error creating chat:", chat.error);
        Alert.alert("Error", chat.error);
        return;
      }

      router.push({
        pathname: "chat/ChatRoom",
        params: {
          chatId: chat.id,
          chatName: otherUsername,
          profilePic: otherImage || "https://img.icons8.com/ios-filled/100/user-male-circle.png",
          type: chat.type,
        },
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      Alert.alert("Error", "Failed to start chat");
    }
  };

  // Render a chat
  const renderChatItem = ({ item }) => {
    const isAI = item.type === "ai";
    const profilePic = isAI
      ? "https://img.icons8.com/color/96/bot.png"
      : item.displayImage || "https://img.icons8.com/ios-filled/100/user-male-circle.png";

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 border-b border-gray-800"
        onPress={() =>
          router.push({
            pathname: "/ChatRoom",
            params: {
              chatId: item.id,
              chatName: item.displayName,
              profilePic,
              type: item.type,
            },
          })
        }
      >
        <Image source={{ uri: profilePic }} className="w-12 h-12 rounded-full mr-4" />
        <View className="flex-1">
          <Text className="text-base font-semibold text-white">{item.displayName}</Text>
          <Text className="text-sm text-gray-400 mt-0.5">
            {isAI ? "Your productivity assistant" : item.lastMessage || "Tap to chat"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render user search result
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row w-full items-center px-4 py-3 border-b border-gray-800"
      onPress={() => startChat(item.id, item.username, item.image)}
    >
      <Image
        source={{ uri: item.image || "https://img.icons8.com/ios-filled/100/user-male-circle.png" }}
        className="w-12 h-12 rounded-full mr-4"
      />
      <Text className="text-base font-semibold text-white">{item.username}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 pt-12 bg-primary">
      <TouchableOpacity className="ml-5 mb-3" onPress={() => router.back()}>
        <ChevronLeft size={24} color="white" />
      </TouchableOpacity>

      <SearchBar query={query} setQuery={searchUsers} />

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
        <View className="flex-1 justify-center px-12 items-center">
          <SearchX size={80} color="white" />
          <Text className="text-gray-400 font-bold text-center">
            No chats available. Search for users using their username or email to start a new chat!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
