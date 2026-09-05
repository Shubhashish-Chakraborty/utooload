import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/lib/theme";
import { extractYouTubeUrl, isYouTubeUrl } from "@/lib/youtube";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Inter, with the platform's own typeface as the fallback if loading fails.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ShareIntentProvider options={{ debug: __DEV__ }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ShareIntentRouter />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="sheet"
            options={{
              presentation: "transparentModal",
              // The sheet animates itself, so the navigator shouldn't.
              animation: "none",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}

/**
 * Share-intent handling has to live in the layout — that's the only place the
 * native module gets called via the deeplink. When a share comes in we skip Home
 * and open the format sheet straight away.
 */
function ShareIntentRouter() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!navigationState?.key || !hasShareIntent) return;

    const candidates = [
      shareIntent?.webUrl,
      extractYouTubeUrl(shareIntent?.text),
      shareIntent?.text,
    ];
    const url = candidates.find((value) => isYouTubeUrl(value)) ?? null;

    resetShareIntent();

    // A share arriving while a sheet is already open replaces it.
    if (router.canDismiss()) router.dismissAll();
    router.push({
      pathname: "/sheet",
      params: url ? { url } : { invalid: "1" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent, navigationState?.key]);

  return null;
}
