import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { Skeleton } from "@/components/Skeleton";
import { formatDuration } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  thumbnail: string | null;
  title: string | null;
  duration: number | null;
}

export function VideoPreview({ thumbnail, title, duration }: Props) {
  const length = formatDuration(duration);

  return (
    <View style={styles.container}>
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]} />
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title ?? "Your video"}
      </Text>

      {length ? (
        <View style={styles.chip}>
          <Text style={styles.chipText}>{length}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** State 1 — shown while /api/resolve is in flight. */
export function VideoPreviewSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton aspectRatio={16 / 9} borderRadius={radius.card} />
      <Skeleton height={20} width="85%" />
      <Skeleton height={20} width="55%" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    backgroundColor: colors.border,
  },
  thumbnailFallback: { backgroundColor: colors.primaryLight },
  title: { ...type.h2, color: colors.textPrimary },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  chipText: { ...type.caption, color: colors.primary },
});
