import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { MIN_TAP, colors, radius, spacing, type } from "@/lib/theme";

type Variant = "primary" | "secondary";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
  icon,
}: Props) {
  const inactive = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "primary" && pressed && styles.primaryPressed,
        variant === "primary" && inactive && styles.primaryDisabled,
        variant === "secondary" && styles.secondary,
        variant === "secondary" && pressed && styles.secondaryPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.textOnPrimary : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "primary" ? styles.labelPrimary : styles.labelSecondary,
              variant === "primary" && inactive && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TAP + spacing.xs,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryDisabled: { backgroundColor: colors.disabled },
  secondary: { backgroundColor: "transparent" },
  secondaryPressed: { backgroundColor: colors.primaryLight },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { ...type.bodyMedium, textAlign: "center" },
  labelPrimary: { color: colors.textOnPrimary },
  labelSecondary: { color: colors.primary },
  labelDisabled: { color: colors.disabledText },
});
