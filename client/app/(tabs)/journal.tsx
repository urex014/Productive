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
  Platform,
  Alert,
  StatusBar,
  Keyboard
} from "react-native";
import { Plus, Trash2, Edit3, X, BookOpen, Save } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL } from "../../baseUrl";

export default function JournalScreen() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  
  // UI State to track which note we are editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Logic Section (Preserved) ---
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/api/journals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setNotes(data);
        } else {
          Toast.show({ type: "error", text1: "Failed to load notes" });
        }
      } catch (err: any) {
        Toast.show({ type: "error", text1: "Network error" });
      }
    };
    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newContent.trim()) {
      Toast.show({ type: "error", text1: "Please add content" });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => [data, ...prev]);
        setNewTitle("");
        setNewContent("");
        Keyboard.dismiss();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to add note' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to add note' });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingId || !newContent.trim() || !newTitle.trim()) {
      Toast.show({ type: 'error', text1: 'Missing fields' });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/api/journals/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === editingId ? { ...note, ...data } : note
          )
        );
        Toast.show({ type: 'success', text1: 'Note updated' });
        setNewTitle("");
        setNewContent("");
        setEditingId(null); // Exit edit mode
        Keyboard.dismiss();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to update' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Network error' });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/api/journals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        // If we deleted the note currently being edited, clear the form
        if (editingId === id) {
           setEditingId(null);
           setNewTitle("");
           setNewContent("");
        }
      } else {
        Toast.show({ type: 'error', text1: 'Failed to delete' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to delete' });
    }
  };

  const handleDeleteAllNotes = () => {
    Alert.alert("Confirm", "Delete all notes?", [
      { text: "Cancel", style: 'cancel' },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const res = await fetch(`${BASE_URL}/api/journals`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setNotes([]);
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to delete all' });
          }
        },
        style: "destructive",
      },
    ]);
  };

  // --- Visual Helper for the Form ---
  const renderHeader = () => (
    <View>
      <View className="mb-6">
        <Text className="text-4xl font-bold text-white tracking-widest">Journal</Text>
        <Text className="text-sm text-neutral-500 mt-1 uppercase tracking-widest">Chronicles of the Void</Text>
      </View>

      {/* Note Form */}
      <View className="bg-neutral-900/50 border border-white/5 rounded-3xl p-5 mb-8">
        <View className="flex-row justify-between items-center mb-4">
           <Text className="text-white/80 font-semibold text-base uppercase tracking-widest">
             {editingId ? "Editing Entry" : "New Entry"}
           </Text>
           {editingId && (
              <TouchableOpacity onPress={() => {
                 setEditingId(null);
                 setNewTitle("");
                 setNewContent("");
                 Keyboard.dismiss();
              }}>
                 <X color="#ef4444" size={20} />
              </TouchableOpacity>
           )}
        </View>

        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Title your thought..."
          placeholderTextColor="#555"
          className="bg-black text-white px-4 py-4 rounded-xl mb-3 border border-neutral-800 font-medium"
        />
        
        <TextInput
          value={newContent}
          onChangeText={setNewContent}
          placeholder="Write your thoughts here..."
          placeholderTextColor="#555"
          multiline
          className="bg-black text-white px-4 py-4 rounded-xl mb-4 border border-neutral-800 min-h-[100px]"
          style={{ textAlignVertical: 'top' }}
        />

        {/* Buttons Row */}
        <View className="flex-row justify-between gap-3">
          <TouchableOpacity
            onPress={editingId ? handleUpdateNote : handleAddNote}
            className="flex-1 rounded-xl overflow-hidden shadow-sm bg-white/5  py-4 flex-row justify-center items-center "
          >
             
                {editingId ? <Save color="white" size={20} /> : <Plus color="white" size={20} />}
                <Text className="text-white font-bold ml-2">
                   {editingId ? "Save Changes" : "Add Entry"}
                </Text>
            
          </TouchableOpacity>

          {!editingId && (
            <TouchableOpacity
              onPress={handleDeleteAllNotes}
              className="w-14 items-center justify-center bg-red-900/20 border border-red-900/30 rounded-xl"
            >
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-white/90 text-lg font-bold mb-4">Recent Entries</Text>
    </View>
  );

  return (
    <View className="flex-1 pt-8 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 px-6"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader()} // Call as function!
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            
            renderItem={({ item }) => (
              <View className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5 mb-4 relative overflow-hidden">
                {/* Visual Decoration */}
                <View className="absolute top-0 left-0 w-1 h-full bg-neutral-800" />
                
                <View className="pl-2">
                   <Text className="text-white font-bold text-lg mb-2 leading-tight">
                     {item.title}
                   </Text>
                   <Text className="text-neutral-400 text-sm leading-6 mb-4">
                     {item.content}
                   </Text>
                </View>

                <View className="flex-row justify-end gap-4 border-t border-white/5 pt-3">
                  <TouchableOpacity
                    onPress={() => {
                      setNewTitle(item.title);
                      setNewContent(item.content);
                      setEditingId(item.id);
                      // Optional: scroll to top here if needed
                    }}
                    className="flex-row items-center bg-blue-500/10 px-3 py-2 rounded-lg"
                  >
                    <Edit3 color="#60a5fa" size={16} />
                    <Text className="text-blue-400 text-xs font-semibold ml-2">Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                     onPress={() => handleDeleteNote(item.id)}
                     className="flex-row items-center bg-red-500/10 px-3 py-2 rounded-lg"
                  >
                    <Trash2 color="#ef4444" size={16} />
                    <Text className="text-red-400 text-xs font-semibold ml-2">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20 opacity-50">
                 <BookOpen color="#333" size={60} />
                 <Text className="text-neutral-500 text-center mt-4">
                   No notes yet. Start journaling your thoughts.
                 </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}