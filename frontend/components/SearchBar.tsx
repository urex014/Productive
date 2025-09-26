// components/SearchBar.jsx
import React from "react";
import { View } from "react-native";
import {  TextInput } from "react-native";
import { Search } from 'lucide-react-native';

export default function SearchBar({ query, setQuery }) {
  return (
    <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1 mx-4 my-2">
      <Search size={20} />
      <TextInput
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
        className="flex-1 ml-2 text-base text-gray-800"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
