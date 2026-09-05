import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { MIN_TAP, colors, iconStroke, radius, spacing, type } from "@/lib/theme";

interface Props {
  icon: ReactNode;
  label: string;
  subtext: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function FormatOptionRow({
  icon,
  label,
  subtext,
  onPress,
  selected = false,
  disabled = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${subtext}`}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        (selected || pressed) && styles.rowActive,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtext}>{subtext}</Text>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={iconStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TAP + spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  rowDisabled: { opacity: 0.5 },
  iconWrap: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  iconWrapActive: { backgroundColor: colors.background },
  text: { flex: 1, gap: 2 },
  label: { ...type.bodyMedium, color: colors.textPrimary },
  subtext: { ...type.bodySmall, color: colors.textSecondary },
});
