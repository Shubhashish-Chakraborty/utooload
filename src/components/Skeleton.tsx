import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, type ViewStyle } from "react-native";

import { colors } from "@/lib/theme";

interface Props {
  width?: ViewStyle["width"];
  /** Provide either a fixed height or an aspectRatio. */
  height?: number;
  aspectRatio?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Gently pulsing placeholder — present, but not attention-grabbing. */
export function Skeleton({ width = "100%", height, aspectRatio, borderRadius = 8, style }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      style={[styles.base, { width, height, aspectRatio, borderRadius, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border },
});
