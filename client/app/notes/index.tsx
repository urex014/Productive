import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { FileText, UploadCloud, Cpu, File, Trash2 } from 'lucide-react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../baseUrl';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

export default function NotesScreen() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setNotes(data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load notes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploading(true);
      const token = await AsyncStorage.getItem("token");
      const asset = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream'
      } as any);
      formData.append('title', asset.name);

      const res = await fetch(`${BASE_URL}/api/notes/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Note uploaded!' });
        fetchNotes();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${BASE_URL}/api/notes/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (res.ok) {
                Toast.show({ type: 'success', text1: 'Note deleted' });
                setNotes(prev => prev.filter(n => n.id !== id));
              } else {
                Toast.show({ type: 'error', text1: 'Failed to delete' });
              }
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error deleting note' });
            }
          }
        }
      ]
    );
  };

  const renderNote = ({ item }: { item: any }) => (
    <View className="bg-neutral-900/60 border border-white/10 p-4 rounded-2xl mb-3 flex-row justify-between items-center">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-blue-500/10 rounded-lg items-center justify-center border border-blue-500/20 mr-3">
          <FileText size={20} color="#60a5fa" />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-white font-bold text-base" numberOfLines={1}>{item.title}</Text>
          <Text className="text-neutral-500 text-xs uppercase">{item.fileType.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <View className="flex-row gap-3 items-center">
        {/* Summarize / AI Button */}
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/notes/ai-chat', params: { noteId: item.id, title: item.title } })}
          className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30"
        >
          <Cpu size={18} color="#d8b4fe" />
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)}
          className="bg-red-500/20 p-2 rounded-lg border border-red-500/30"
        >
          <Trash2 size={18} color="#f87171" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />
      
      <SafeAreaView className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-bold text-white">Smart Notes</Text>
            <Text className="text-neutral-500 text-xs uppercase tracking-widest">AI Knowledge Base</Text>
          </View>
          <TouchableOpacity onPress={handleUpload} disabled={uploading} className="bg-blue-600 p-3 rounded-full">
            {uploading ? <ActivityIndicator color="white" size="small" /> : <UploadCloud size={24} color="white" />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#DD2476" />
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20 opacity-50">
                <File size={40} color="#555" />
                <Text className="text-neutral-500 mt-4">No documents found.</Text>
                <Text className="text-neutral-600 text-xs">Upload a PDF or Doc to get started.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}