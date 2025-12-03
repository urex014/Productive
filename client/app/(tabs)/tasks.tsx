import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
} from "react-native";
import { BASE_URL } from "../../baseUrl";
import { Plus, Trash2, Edit, Calendar, CheckCircle, Clock, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // --- Fetch Tasks ---
  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log(`Fetching tasks from: ${BASE_URL}/api/tasks`);
      
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
          console.error("Fetch failed status:", res.status);
          Toast.show({ type: 'error', text1: `Error: ${res.status}` });
          return;
      }

      const data = await res.json();
      console.log("Tasks fetched:", data);
      
      // Handle { tasks: [...] } or [...] structure
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error("Fetch error:", err);
      Toast.show({ type: 'error', text1: 'Failed to fetch tasks' });
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // --- Add Task ---
  const handleAddTask = async () => {
    if (!newTask.trim() || !newDescription.trim() || !newDueDate) {
      Toast.show({ type: 'error', text1: "Missing fields" });
      return;
    }
    
    const task = { title: newTask, description: newDescription, dueDate: newDueDate.toISOString() };
    
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(task),
      });
      
      const data = await res.json();

      if (res.ok) {
        setTasks((prev) => [...prev, data]); // Append new task
        setNewTask(""); setNewDescription(""); setNewDueDate(null);
        Keyboard.dismiss();
        Toast.show({ type: 'success', text1: 'Task created!' });
      } else {
        console.error("Create error:", data);
        Toast.show({ type: 'error', text1: 'Failed to create task' });
      }
    } catch (err) { console.error(err); }
  };

  // --- Update Task ---
  const handleUpdateTask = async () => {
    if (!editingTask?.title?.trim()) return;
    
    // MongoDB uses _id, ensure we grab the correct one
    const taskId = editingTask._id || editingTask.id;
    if (!taskId) {
        console.error("No Task ID found for update");
        return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            title: editingTask.title, 
            description: editingTask.description, 
            dueDate: editingTask.dueDate 
        }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) => prev.map((t) => (t._id === taskId || t.id === taskId ? updatedTask : t)));
        setEditingTask(null); setNewTask(""); setNewDescription(""); setNewDueDate(null);
        Keyboard.dismiss();
        Toast.show({ type: 'success', text1: 'Task updated!' });
      }
    } catch (err) { console.error(err); }
  };

  // --- Delete Task ---
  const handleDeleteTask = async (id: string) => {
    console.log("Deleting task:", id);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
          setTasks((prev) => prev.filter((t) => (t._id !== id && t.id !== id)));
          Toast.show({ type: 'success', text1: 'Task deleted' });
      } else {
          console.error("Delete failed status:", res.status);
      }
    } catch (err) { console.error(err); }
  };

  // --- Delete All Tasks ---
  const handleDeleteAllTasks = async () => {
    Alert.alert("Confirm Purge", "Delete all pending missions?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete All", style: "destructive", onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/tasks`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            if (res.ok) setTasks([]);
          } catch (err) { console.error(err); }
        }},
    ]);
  };

  // --- Render Header with Glass Form ---
  const renderHeader = () => (
    <View>
      <View className="mb-5 pt-8">
        <Text className="text-4xl font-bold text-white tracking-widest">Tasks</Text>
        <Text className="text-sm text-neutral-500 mt-1 uppercase tracking-widest">Manage objectives</Text>
      </View>

      {/* Dark Glass Form */}
      <View className="bg-neutral-900/50 rounded-3xl p-5 border border-white/5 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white/80 font-semibold text-base uppercase tracking-widest">
            {editingTask ? "Update Objective" : "New Objective"}
          </Text>
          {editingTask && (
             <TouchableOpacity onPress={() => {
                setEditingTask(null); setNewTask(""); setNewDescription(""); setNewDueDate(null);
             }}>
                <X color="#ef4444" size={20} />
             </TouchableOpacity>
          )}
        </View>
        
        {/* Title Input */}
        <TextInput
          value={editingTask ? editingTask.title : newTask}
          onChangeText={(text) => editingTask ? setEditingTask((prev: any) => ({ ...prev, title: text })) : setNewTask(text)}
          placeholder="Task Title"
          placeholderTextColor="#555"
          className="bg-black text-white rounded-xl p-4 mb-3 border border-neutral-800"
        />

        {/* Description Input */}
        <TextInput
          value={editingTask ? editingTask.description : newDescription}
          onChangeText={(text) => editingTask ? setEditingTask((prev: any) => ({ ...prev, description: text })) : setNewDescription(text)}
          placeholder="Description / Notes"
          placeholderTextColor="#555"
          multiline
          className="bg-black text-white rounded-xl p-4 mb-3 border border-neutral-800 h-20"
          style={{ textAlignVertical: 'top' }}
        />

        {/* Date Picker Button */}
        <TouchableOpacity
          onPress={() => setDatePickerVisibility(true)}
          className="flex-row items-center bg-black p-4 rounded-xl mb-4 border border-neutral-800"
        >
          <Calendar color={editingTask?.dueDate || newDueDate ? "#DD2476" : "#555"} size={20} />
          <Text className={`ml-3 font-medium ${editingTask?.dueDate || newDueDate ? "text-white" : "text-neutral-500"}`}>
            {editingTask?.dueDate
              ? new Date(editingTask.dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
              : newDueDate
              ? newDueDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
              : "Select Deadline"}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row mt-2">
          <TouchableOpacity
            onPress={editingTask ? handleUpdateTask : handleAddTask}
            className="flex-1 mr-3 rounded-xl overflow-hidden shadow-sm shadow-white/10"
          >
            <LinearGradient
              colors={editingTask ? ['#FF512F', '#DD2476'] : ['#222', '#333']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              className="flex-row items-center justify-center py-4 border border-white/10"
            >
              {editingTask ? <CheckCircle color="white" size={20} /> : <Plus color="white" size={20} />}
              <Text className="text-white font-bold ml-2">
                {editingTask ? "Save Changes" : "Add Task"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!editingTask && (
            <TouchableOpacity
              onPress={handleDeleteAllTasks}
              className="w-14 items-center justify-center bg-red-900/20 rounded-xl border border-red-900/30"
            >
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-white/90 text-lg font-bold mb-4">Pending Tasks</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#050505', '#121212']} className="absolute inset-0" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined} 
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="flex-1 px-5">
            <FlatList
              data={tasks}
              // Support both MongoDB _id and SQLite id
              keyExtractor={(item, i) => item._id?.toString() || item.id?.toString() || i.toString()}
              
              ListHeaderComponent={renderHeader()} 
              
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              
              keyboardShouldPersistTaps="handled" 

              ListEmptyComponent={
                <View className="items-center justify-center mt-12 opacity-50">
                    <CheckCircle color="#333" size={60} />
                    <Text className="text-white text-lg font-bold mt-3">All systems nominal.</Text>
                    <Text className="text-neutral-600 text-sm">No active tasks.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View className="bg-neutral-900/60 rounded-2xl p-4 mb-3 border border-white/5 flex-row justify-between items-center">
                  <View className="flex-1 mr-3">
                    <Text className="text-neutral-200 text-base font-semibold mb-1" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-neutral-500 text-xs mb-2" numberOfLines={2}>{item.description}</Text>
                    <View className="flex-row items-center">
                      <Clock color="#DD2476" size={12} />
                      <Text className="text-[#DD2476] text-[11px] font-semibold ml-1">
                         {new Date(item.dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-col gap-2 pl-3 border-l border-white/5">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingTask(item); 
                        setNewTask(item.title); 
                        setNewDescription(item.description); 
                        setNewDueDate(new Date(item.dueDate));
                      }}
                      className="p-2 rounded-lg bg-white/5"
                    >
                      <Edit color="#4facfe" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteTask(item._id || item.id)}
                      className="p-2 rounded-lg bg-red-900/20"
                    >
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
          <DateTimePickerModal
            isVisible={isDatePickerVisible} mode="datetime"
            onConfirm={(date) => {
              editingTask ? setEditingTask((prev: any) => ({ ...prev, dueDate: date.toISOString() })) : setNewDueDate(date);
              setDatePickerVisibility(false);
            }}
            onCancel={() => setDatePickerVisibility(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}