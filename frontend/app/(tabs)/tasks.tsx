// app/tasks.tsx
import * as React from "react";
import { useState, useEffect , useRef } from "react";
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
  TouchableWithoutFeedback,
} from "react-native"
import { BlurView } from "expo-blur"
import { Plus, Trash2, Edit, Calendar } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePickerModal from "react-native-modal-datetime-picker"

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newDueDate, setNewDueDate] = useState<Date | null>(null)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const API_BASE = "http://192.168.100.30:5000/api/tasks"

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(API_BASE, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()

      // handle backend sending { tasks: [] } or plain []
      setTasks(Array.isArray(data) ? data : data.tasks || [])
    } catch (err) {
      console.error("Failed to fetch tasks", err)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // Add a task
  const handleAddTask = async () => {
    if (!newTask.trim() || !newDescription.trim() || !newDueDate) {
      Alert.alert("Missing fields", "Please fill all fields")
      return
    }

    const task = {
      title: newTask,
      description: newDescription,
      dueDate: newDueDate.toISOString(),
    }

    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(task),
      })

      if (!res.ok) throw new Error("Failed to add task")
      const savedTask = await res.json()

      setTasks((prev) => [...prev, savedTask])
      setNewTask("")
      setNewDescription("")
      setNewDueDate(null)
    } catch (err) {
      console.error("Failed to add task", err)
    }
  }

  // Update a task
  const handleUpdateTask = async () => {
    if (!editingTask?.title?.trim()) return

    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(
        `${API_BASE}/${editingTask.id || editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editingTask.title,
            description: editingTask.description,
            dueDate: editingTask.dueDate,
          }),
        }
      )

      if (!res.ok) throw new Error("Failed to update task")
        const result = await res.json()
      const updatedTask = result.task || result

      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id || t._id === updatedTask._id
            ? updatedTask
            : t
        )
      )
      setEditingTask(null)
      setNewTask("")
      setNewDescription("")
      setNewDueDate(null)
    } catch (err) {
      console.error("Failed to update task", err)
    }
  }

  // Delete a task
  const handleDeleteTask = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete task")
      setTasks((prev) => prev.filter((t) => t.id !== id && t._id !== id))
    } catch (err) {
      console.error("Failed to delete task", err)
    }
  }

  // Delete all tasks
  const handleDeleteAllTasks = async () => {
    Alert.alert("Confirm", "Delete all tasks?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token")
            const res = await fetch(API_BASE, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })

            if (!res.ok) throw new Error("Failed to delete all tasks")
            setTasks([])
          } catch (err) {
            console.error("Failed to delete all tasks", err)
          }
        },
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
          <Text className="text-white text-4xl font-bold mb-6">Tasks</Text>

          {/* Task Form */}
          <View className="rounded-3xl p-8 mb-8 items-center border border-y-white shadow-2xl shadow-purple-500/10">
            <Text className="text-white text-lg font-bold mb-3">
              {editingTask ? "Update Task" : "Create Task"}
            </Text>
            <TextInput
              value={editingTask ? editingTask.title : newTask}
              onChangeText={(text) =>
                editingTask
                  ? setEditingTask((prev: any) => ({ ...prev, title: text }))
                  : setNewTask(text)
              }
              placeholder={editingTask ? "Edit task title" : "New task title"}
              placeholderTextColor="#777"
              className="bg-[rgb(0,0,0,0.7)] border-orange-500 border text-white px-4 m-3 w-full py-3 rounded-xl mb-3"
            />

            <TextInput
              value={editingTask ? editingTask.description : newDescription}
              onChangeText={(text) =>
                editingTask
                  ? setEditingTask((prev: any) => ({
                      ...prev,
                      description: text,
                    }))
                  : setNewDescription(text)
              }
              placeholder="Description"
              placeholderTextColor="#777"
              className="bg-[rgb(0,0,0,0.7)] border-orange-300 border text-white px-4 m-3 w-full py-3 rounded-xl mb-3 "
            />

            {/* Date Picker Trigger */}
            <TouchableOpacity
              onPress={() => setDatePickerVisibility(true)}
              className="bg-black border border-orange-200 px-4 pt-3 py-3 rounded-xl mb-3 flex-row items-center"
            >
              <Calendar color="white" size={18} />
              <Text
                className={`ml-2 ${
                  editingTask?.dueDate || newDueDate
                    ? "text-white"
                    : "text-gray-400"
                }`}
              >
                {editingTask?.dueDate
                  ? new Date(editingTask.dueDate).toLocaleString()
                  : newDueDate
                  ? newDueDate.toLocaleString()
                  : "Pick Due Date & Time"}
              </Text>
            </TouchableOpacity>

            {/* DateTime Modal */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={(date) => {
                editingTask
                  ? setEditingTask((prev: any) => ({
                      ...prev,
                      dueDate: date.toISOString(),
                    }))
                  : setNewDueDate(date)
                setDatePickerVisibility(false)
              }}
              onCancel={() => setDatePickerVisibility(false)}
            />

            {/* Buttons Row */}
            <View className="flex-row justify-between mt-2">
              {!editingTask ? (
                <>
                  <TouchableOpacity
                    onPress={handleAddTask}
                    className="bg-green-500 flex-1 py-3 rounded-xl mr-2 items-center"
                  >
                    <Plus color="white" size={20} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteAllTasks}
                    className="bg-red-500 flex-1 py-3 rounded-xl items-center"
                  >
                    <Trash2 color="white" size={20} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleUpdateTask}
                    className="bg-blue-500 flex-1 py-3 rounded-xl mr-2 items-center"
                  >
                    <Text className="text-white font-bold">Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEditingTask(null)
                      setNewTask("")
                      setNewDescription("")
                      setNewDueDate(null)
                    }}
                    className="bg-gray-500 flex-1 py-3 rounded-xl items-center"
                  >
                    <Text className="text-white font-bold">Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Task List */}
          <FlatList
            data={tasks}
            keyExtractor={(item, index) =>
              item.id?.toString() || item._id?.toString() || index.toString()
            }
            renderItem={({ item }) => (
              <BlurView
                intensity={70}
                tint="dark"
                className="flex-row justify-between items-center rounded-xl p-4 mb-3 overflow-hidden"
              >
                <View className="flex-col">
                  <Text className="text-white text-lg font-semibold">
                    {item.title || "Untitled Task"}
                  </Text>
                  <Text numberOfLines={1} className="text-gray-300 text-sm">
                    {item.description}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Due: {new Date(item.dueDate).toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setEditingTask(item)
                      setNewTask(item.title)
                      setNewDescription(item.description)
                      setNewDueDate(new Date(item.dueDate))
                    }}
                    className="mr-4"
                  >
                    <Edit color="#60a5fa" size={20} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTask(item.id || item._id)}
                  >
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            )}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
