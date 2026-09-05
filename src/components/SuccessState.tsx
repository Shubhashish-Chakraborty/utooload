import { Check, Share2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, iconStroke, spacing, type } from "@/lib/theme";

interface Props {
  /** One line of context about where the file went. */
  detail: string;
  onDone: () => void;
  onSaveAnother: () => void;
  /** Nice-to-have quick action — offered for the WhatsApp Status choice. */
  onShare?: () => void;
  shareLabel?: string;
}

export function SuccessState({
  detail,
  onDone,
  onSaveAnother,
  onShare,
  shareLabel = "Open in WhatsApp",
}: Props) {
  return (
    <View style={styles.container}>
      <StatusBadge background={colors.successLight}>
        <Check size={36} color={colors.success} strokeWidth={iconStroke + 0.5} />
      </StatusBadge>

      <Text style={styles.title}>Saved!</Text>
      <Text style={styles.detail}>{detail}</Text>

      <View style={styles.actions}>
        {onShare ? (
          <Button
            label={shareLabel}
            variant="secondary"
            onPress={onShare}
            icon={<Share2 size={18} color={colors.primary} strokeWidth={iconStroke} />}
          />
        ) : null}
        <Button label="Done" onPress={onDone} />
        <Button label="Save another format" variant="secondary" onPress={onSaveAnother} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: spacing.xl },
  title: { ...type.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  detail: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
});
