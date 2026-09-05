import { ImageIcon, Settings } from "lucide-react-native";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, iconStroke, spacing, type } from "@/lib/theme";

interface Props {
  /** `ask` shows our rationale before the system dialog; `blocked` links to Settings. */
  variant: "ask" | "blocked";
  onAllow: () => void;
  onClose: () => void;
  busy?: boolean;
}

export function PermissionState({ variant, onAllow, onClose, busy = false }: Props) {
  const blocked = variant === "blocked";

  return (
    <View style={styles.container}>
      <StatusBadge background={blocked ? colors.warningLight : colors.primaryLight}>
        {blocked ? (
          <Settings size={32} color={colors.warning} strokeWidth={iconStroke} />
        ) : (
          <ImageIcon size={32} color={colors.primary} strokeWidth={iconStroke} />
        )}
      </StatusBadge>

      <Text style={styles.title}>
        {blocked ? "Gallery access is turned off" : "One quick thing"}
      </Text>
      <Text style={styles.body}>
        {blocked
          ? "Open Utooload's settings and turn on photos and media, then come back and try again."
          : "Utooload needs access to save files to your gallery."}
      </Text>

      <View style={styles.actions}>
        {blocked ? (
          <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
        ) : (
          <Button label="Continue" onPress={onAllow} busy={busy} />
        )}
        <Button label="Close" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: spacing.xl },
  title: { ...type.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  body: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.xxl },
});
