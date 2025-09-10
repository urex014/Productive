import { Link } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

const MovieCard = ({id, poster_path, title, vote_average,release_date}:Movie) => {
  
  return (
    <Link href={`/movies/${id}`} asChild>
      <TouchableOpacity className='w-[30%]'>
        <Image
          source={{
            uri:poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : 'https://placeholder.co/600x400/1a1a1a/ffffff.png'
          }}
          className='w-full h-52 rounded-lg mb-2'
          resizeMode='cover'
          />
          <View className='px-1'>
            <Text numberOfLines={1} className='text-white text-sm font-semibold'>{title}</Text>
            <Text className='text-gray-400 text-xs'>Realease date: {release_date?.split('-')[0]}</Text>
            {/*@ts-ignore*/}
            <Text className={`${Math.round(vote_average)<5.0 ? 'text-red-500': 'text-green-500'} text-xs font-semibold mt-1 `}>Rating: {Math.round(vote_average)}</Text>
            {/* <Text numberOfLines={3} className='text-gray-400 text-xs'>{overview}</Text> */}
          </View>
      </TouchableOpacity>
        
    </Link>
  )
}

export default MovieCard