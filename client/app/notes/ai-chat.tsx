import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, Sparkles, FileText } from 'lucide-react-native';
import { BASE_URL } from '../../baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';

interface AIMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function NoteAIChat() {
  const { noteId, title } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to ask AI (Summarize or Chat)
  const askAI = async (customPrompt?: string) => {
    const prompt = customPrompt || input;
    if (!prompt.trim()) return;

    // Add user message to UI immediately
    const userMsg: AIMessage = { role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      // This endpoint needs to be implemented on backend to handle chat context with the file
      const res = await fetch(`${BASE_URL}/api/notes/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ noteId, message: prompt })
      });

      const data = await res.json();
      const aiMsg: AIMessage = { role: 'ai', text: data.reply || "Oops! That wasn't supposed to happen💔" };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: AIMessage = { role: 'ai', text: "Sorry, I'm feeling down right now🤒" };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#000000', '#1a103c']} className="absolute inset-0" />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-white/10 bg-black/50">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white/5 rounded-full">
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-bold text-lg">Your PA</Text>
            <Text className="text-neutral-400 text-xs" numberOfLines={1}>Context: {title}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <View className="p-4 flex-row justify-center gap-3">
            <TouchableOpacity 
              onPress={() => askAI("Summarize this document for me.")}
              className="bg-purple-600/20 border border-purple-500/50 px-4 py-3 rounded-xl flex-row items-center"
            >
              <Sparkles size={18} color="#d8b4fe" />
              <Text className="text-purple-200 ml-2 font-bold">Summarize</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => askAI("What are the key takeaways?")}
              className="bg-blue-600/20 border border-blue-500/50 px-4 py-3 rounded-xl flex-row items-center"
            >
              <FileText size={18} color="#93c5fd" />
              <Text className="text-blue-200 ml-2 font-bold">Key Points</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Area */}
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
          {messages.map((msg, idx) => (
            <View key={idx} className={`mb-4 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              <View 
                className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 rounded-tr-sm' 
                    : 'bg-neutral-800 border border-white/10 rounded-tl-sm'
                }`}
              >
              
                <Markdown
                  style={{
                    body: { 
                      color: '#FFFFFF', 
                      fontSize: 16, 
                      lineHeight: 24 
                    },
                    // You can style other elements specifically here
                    heading1: { color: '#FFFFFF' },
                    code_inline: { backgroundColor: '#333', color: 'white' },
                  }}
                >
                  {msg.text}
                </Markdown>
              </View>
              <Text className="text-neutral-600 text-[10px] mt-1 ml-1 uppercase">
                {msg.role === 'user' ? 'You' : 'AI Analysis'}
              </Text>
            </View>
          ))}
          {loading && (
            <View className="self-start bg-neutral-800/50 p-4 rounded-2xl rounded-tl-sm">
              <ActivityIndicator color="#d8b4fe" size="small" />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'android' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View className="p-4 bg-black/80 border-t border-white/10 flex-row items-center">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this document..."
              placeholderTextColor="#666"
              className="flex-1 bg-neutral-900 text-white px-4 py-3 rounded-full border border-white/10 mr-3 max-h-24"
              multiline
            />
            <TouchableOpacity 
              onPress={() => askAI()} 
              disabled={loading || !input.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${input.trim() ? 'bg-purple-600' : 'bg-neutral-800'}`}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}