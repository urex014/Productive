
import { Tabs } from 'expo-router'
import React from 'react'
import { Text, Vibration, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { Home, CheckSquare, BookOpen, User } from 'lucide-react-native' // Lucide icons

function TabIcon({ focused, Icon, title }: any) {
  if (focused) {
    return (
      <View className="flex flex-row w-full flex-1 min-w-[112px] min-h-16 mt-4 justify-center items-center rounded-full overflow-hidden bg-white/90">
        <Icon size={20} color="#151312" />
        <Text className="text-gray-70000 text-base font-bold ml-2">
          {title}
        </Text>
      </View>
    )
  } else {
    return (
      <View className="size-full justify-center items-center mt-4 rounded-full">
        <Icon size={20} color="#A8B5DB" />
      </View>
    )
  }
}

const _layout = () => {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Vibration.vibrate(50)
        },
      }}
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={80}
            style={{
              flex: 1,
              borderRadius: 50,
              overflow: 'hidden',
            }}
          />
        ),
        tabBarItemStyle: {
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(0,0,0, 0.5)',
          borderRadius: 50,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 60,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Home} title="home" />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'tasks',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={CheckSquare} title="tasks" />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'journal',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={BookOpen} title="journal" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} title="profile" />
          ),
        }}
      />
    </Tabs>
  )
}

export default _layout
