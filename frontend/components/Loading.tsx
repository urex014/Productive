import React from 'react'
import { View, ViewStyle } from 'react-native'

const Loading = () => {
  const imageStyle: ViewStyle = { backgroundColor: 'rgba(255,255,255,0.06)' }
  const lineStyle: ViewStyle = { backgroundColor: 'rgba(255,255,255,0.08)' }

  return (
    <View className="w-1/3 mb-4 mx-6 animate-pulse pr-2">
      <View style={imageStyle} className="w-full h-52 rounded-lg mb-2" />
      <View style={lineStyle} className="h-3 animate-pulse rounded w-3/4 mb-2" />
      <View style={lineStyle} className="h-2 animate-pulse rounded w-1/2 mb-1" />
      <View style={lineStyle} className="h-2 animate-pulse rounded w-1/4" />
    </View>
  )
}

export default Loading