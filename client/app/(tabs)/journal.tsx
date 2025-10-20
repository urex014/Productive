// app/journal.tsx
import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from "react-native"
import { BlurView } from "expo-blur"
import { Plus, Trash2, Edit3 } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message";

export default function JournalScreen() {
  const [notes, setNotes] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const BASE_URL = "http://192.168.100.191:5000"

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        if (!token) return

        const res = await fetch(`${BASE_URL}/api/journals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()

        if (res.ok) {
          setNotes(data)
        } else {
          console.error("Fetch error:", data.error)
        }
      } catch (err) {
        console.error("Failed to fetch notes", err)
      }
    }
    fetchNotes()
  }, [])

  // Add a new note
  const handleAddNote = async () => {
    if (!newContent.trim()) {
      Alert.alert("Missing fields", "Please add a title and content")
      return
    }

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const res = await fetch(`${BASE_URL}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setNotes((prev) => [data, ...prev])
        setNewTitle("")
        setNewContent("")
      } else {
        console.error("Add note error:", data.error)
      }
    } catch (err) {
      console.error("Failed to add note", err)
    }
  }

  //update a note 
  const handleUpdateNote = async (id:string) => {
  if (!newContent.trim() || !newTitle.trim()) {
    Toast.show({
      type: 'error',
      text1: 'Missing fields',
      text2: 'Please add both title and content',
    });
    return;
  }

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    // Send PUT request to update existing note
    const res = await fetch(`${BASE_URL}/api/journals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // Update note in local state
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...data } : note
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Note updated successfully',
      });

      setNewTitle("");
      setNewContent("");
    } else {
      console.error("Update note error:", data.error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update note',
        text2: data.error || 'Something went wrong',
      });
    }
  } catch (err) {
    console.error("Failed to update note", err);
    Toast.show({
      type: 'error',
      text1: 'Network or server error',
    });
  }
};

  // Delete a single note
  const handleDeleteNote = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const res = await fetch(`${BASE_URL}/api/journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      } else {
        const data = await res.json()
        console.error("Delete error:", data.error)
      }
    } catch (err) {
      console.error("Failed to delete note", err)
    }
  }

  // Delete all notes
  const handleDeleteAllNotes = () => {
    Alert.alert("Confirm", "Delete all notes?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token")
            if (!token) return

            const res = await fetch(`${BASE_URL}/api/journals`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (res.ok) {
              setNotes([])
            } else {
              const data = await res.json()
              console.error("Delete all error:", data.error)
            }
          } catch (err) {
            console.error("Failed to delete all notes", err)
          }
        },
        style: "destructive",
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black px-6 pt-10"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold mb-6">Journal</Text>

          {/* Note Form */}
          <View className="bg-[0,0,0,0.7] border border-y-white rounded-2xl p-4 mb-6 shadow-lg">
            <Text className="text-white text-lg font-bold mb-3">New Journal</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Note title"
              placeholderTextColor="#777"
              className="bg-[rgb(0,0,0,0.7)] border border-orange-500 text-white px-4 py-3 rounded-xl mb-3"
            />
            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Write your thoughts..."
              placeholderTextColor="#777"
              multiline
              className="bg-[rgb(0,0,0,0.7)] border border-orange-300 text-white px-4 py-3 my-3 rounded-xl min-h-[80px]"
            />

            {/* Buttons Row */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={handleAddNote}
                className="bg-blue-500 flex-1 py-3 rounded-xl mr-2 items-center"
              >
                <Plus color="white" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAllNotes}
                className="bg-red-500 flex-1 py-3 rounded-xl items-center"
              >
                <Trash2 color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes List */}
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <BlurView
                intensity={70}
                tint="dark"
                className="flex-col rounded-xl p-4 mb-3 overflow-hidden"
              >
                <Text className="text-white font-semibold text-lg mb-1">
                  {item.title}
                </Text>
                <Text className="text-gray-300 text-base mb-2">
                  {item.content}
                </Text>
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => handleUpdateNote(item.id)}
                    className="mr-4"
                  >
                    <Edit3 color="#60a5fa" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            )}
            ListEmptyComponent={
              <Text className="text-gray-400 text-center mt-20">
                No notes yet. Start journaling your thoughts!
              </Text>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
