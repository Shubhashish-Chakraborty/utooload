import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { radius, spacing } from "@/lib/theme";

interface Props {
  children: ReactNode;
  background: string;
}

/** The tinted circle behind the success / error / permission icons. */
export function StatusBadge({ children, background }: Props) {
  return <View style={[styles.badge, { backgroundColor: background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
