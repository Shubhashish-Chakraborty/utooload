import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Share2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ClipboardSuggestionChip } from "@/components/ClipboardSuggestionChip";
import { colors, iconStroke, radius, shadow, spacing, type } from "@/lib/theme";
import { extractYouTubeUrl, isYouTubeUrl } from "@/lib/youtube";

/** The fallback path — most of the time the share sheet opens /sheet directly. */
export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!(await Clipboard.hasStringAsync())) return;
        const link = extractYouTubeUrl(await Clipboard.getStringAsync());
        if (active && link) setSuggestion(link);
      } catch {
        // Clipboard access can be refused — the manual input still works.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const link = extractYouTubeUrl(input) ?? input.trim();
  const canContinue = isYouTubeUrl(link);

  const onContinue = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    router.push({ pathname: "/sheet", params: { url: link } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.wordmark}>Utooload</Text>
            <Text style={styles.tagline}>You too can download.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Share2 size={24} color={colors.primary} strokeWidth={iconStroke} />
            </View>
            <Text style={styles.cardText}>
              Open YouTube, tap Share on any video, and choose Utooload.
            </Text>
          </View>

          <View style={styles.manual}>
            <Text style={styles.manualLabel}>Or paste a link</Text>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Paste a YouTube link"
              placeholderTextColor={colors.disabledText}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={onContinue}
              accessibilityLabel="YouTube link"
            />

            {suggestion && !input ? (
              <ClipboardSuggestionChip
                onUse={() => {
                  setInput(suggestion);
                  setSuggestion(null);
                }}
                onDismiss={() => setSuggestion(null)}
              />
            ) : null}

            <Button label="Continue" onPress={onContinue} disabled={!canContinue} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
    gap: spacing.xxxl,
  },
  header: { gap: spacing.xs },
  wordmark: { ...type.display, color: colors.primary },
  tagline: { ...type.bodySmall, color: colors.textSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
  },
  cardIcon: {
    width: spacing.huge,
    height: spacing.huge,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  cardText: { ...type.body, color: colors.textPrimary, flex: 1 },
  manual: { gap: spacing.md },
  manualLabel: { ...type.caption, color: colors.textSecondary },
  input: {
    ...type.body,
    color: colors.textPrimary,
    minHeight: spacing.huge + spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
