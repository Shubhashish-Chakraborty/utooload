import { AlertTriangle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, iconStroke, spacing, type } from "@/lib/theme";

interface Props {
  /** Already mapped to friendly copy — never a raw backend string. */
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}

export function ErrorState({ message, onRetry, onClose }: Props) {
  return (
    <View style={styles.container}>
      <StatusBadge background={colors.errorLight}>
        <AlertTriangle size={34} color={colors.error} strokeWidth={iconStroke} />
      </StatusBadge>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.actions}>
        {onRetry ? <Button label="Try Again" onPress={onRetry} /> : null}
        <Button label="Close" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: spacing.xl },
  message: {
    ...type.body,
    color: colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.xxl },
});
