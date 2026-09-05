import { ClipboardPaste, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MIN_TAP, colors, iconStroke, radius, spacing, type } from "@/lib/theme";

interface Props {
  onUse: () => void;
  onDismiss: () => void;
}

/** Offered when a YouTube link is already on the clipboard — saves a paste. */
export function ClipboardSuggestionChip({ onUse, onDismiss }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use link from clipboard"
        onPress={onUse}
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      >
        <ClipboardPaste size={16} color={colors.primary} strokeWidth={iconStroke} />
        <Text style={styles.label}>Use link from clipboard</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss clipboard suggestion"
        onPress={onDismiss}
        hitSlop={spacing.md}
        style={styles.dismiss}
      >
        <X size={16} color={colors.textSecondary} strokeWidth={iconStroke} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  chip: {
    minHeight: MIN_TAP - spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  chipPressed: { backgroundColor: colors.primarySoft },
  label: { ...type.caption, color: colors.primary },
  dismiss: {
    width: MIN_TAP - spacing.md,
    height: MIN_TAP - spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
