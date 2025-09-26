import { View, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

export default function PulsingDots() {
  const scale1 = useRef(new Animated.Value(0.5)).current;
  const scale2 = useRef(new Animated.Value(0.5)).current;
  const scale3 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const createPulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.linear, delay }),
          Animated.timing(anim, { toValue: 0.5, duration: 400, useNativeDriver: true, easing: Easing.linear }),
        ])
      );

    createPulse(scale1, 0).start();
    createPulse(scale2, 200).start();
    createPulse(scale3, 400).start();
  }, []);

  return (
    <View className="flex-row mt-6 space-x-2">
      <Animated.View style={{ transform: [{ scale: scale1 }], width: 8, height: 8, backgroundColor: '#f97316', borderRadius: 4 }} />
      <Animated.View style={{ transform: [{ scale: scale2 }], width: 8, height: 8, backgroundColor: '#a855f7', borderRadius: 4 }} />
      <Animated.View style={{ transform: [{ scale: scale3 }], width: 8, height: 8, backgroundColor: '#06b6d4', borderRadius: 4 }} />
    </View>
  );
}
