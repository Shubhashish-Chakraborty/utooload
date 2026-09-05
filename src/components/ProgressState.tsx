import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { formatElapsed } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  /** Timestamp (ms) the request started, so the copy tracks real elapsed time. */
  startedAt: number;
}

function statusFor(seconds: number): string {
  if (seconds < 3) return "Fetching video…";
  if (seconds < 10) return "Converting…";
  return "Almost done…";
}

/**
 * The backend is a single request/response, so there's no meaningful byte-level
 * progress to show — an indeterminate bar plus an elapsed counter is honest and
 * still reassures the user that something is happening.
 */
export function ProgressState({ startedAt }: Props) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  const [trackWidth, setTrackWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (trackWidth === 0) return;
    slide.setValue(0);
    const loop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [slide, trackWidth]);

  const barWidth = Math.max(trackWidth * 0.4, 1);
  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-barWidth, trackWidth],
  });

  return (
    <View style={styles.container}>
      <View
        style={styles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <Animated.View
            style={[styles.bar, { width: barWidth, transform: [{ translateX }] }]}
          />
        )}
      </View>

      <Text style={styles.status} accessibilityLiveRegion="polite">
        {statusFor(elapsed)}
      </Text>
      <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
      <Text style={styles.hint}>Keep the app open while this finishes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  track: {
    width: "100%",
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  bar: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  status: { ...type.h2, color: colors.textPrimary },
  elapsed: { ...type.caption, color: colors.primary },
  hint: { ...type.bodySmall, color: colors.textSecondary, textAlign: "center" },
});
