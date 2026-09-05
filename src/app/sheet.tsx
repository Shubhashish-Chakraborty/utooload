import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleDot, Music, Video } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Animated, BackHandler, Easing, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { FormatOptionRow } from "@/components/FormatOptionRow";
import { PermissionState } from "@/components/PermissionState";
import { ProgressState } from "@/components/ProgressState";
import { SuccessState } from "@/components/SuccessState";
import { VideoPreview, VideoPreviewSkeleton } from "@/components/VideoPreview";
import { downloadMedia, resolveVideo, type ResolveResult } from "@/lib/api";
import { CHOICES, SHARE_FALLBACK_LINE, type Choice } from "@/lib/choices";
import { NOT_A_YOUTUBE_LINK, friendlyError } from "@/lib/errorMessages";
import {
  MediaSaveError,
  deleteTempFile,
  getPermissionState,
  requestPermission,
  saveToGallery,
  shareFile,
  type SaveMethod,
} from "@/lib/mediaSave";
import { colors, iconStroke, radius, spacing } from "@/lib/theme";
import { isYouTubeUrl } from "@/lib/youtube";

type Phase =
  | "loading"
  | "ready"
  | "permission"
  | "blocked"
  | "working"
  | "success"
  | "error";

interface SavedFile {
  choice: Choice;
  method: SaveMethod;
  uri: string;
  mimeType: string;
}

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const ICON_FOR: Record<Choice["id"], IconComponent> = {
  audio: Music,
  video: Video,
  status: CircleDot,
};

export default function FormatSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ url?: string; invalid?: string }>();

  const url = typeof params.url === "string" ? params.url : "";
  const urlIsValid = params.invalid !== "1" && isYouTubeUrl(url);

  const [phase, setPhase] = useState<Phase>(urlIsValid ? "loading" : "error");
  const [info, setInfo] = useState<ResolveResult | null>(null);
  const [message, setMessage] = useState(urlIsValid ? "" : NOT_A_YOUTUBE_LINK);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [saved, setSaved] = useState<SavedFile | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [requesting, setRequesting] = useState(false);
  /** Which request "Try Again" should repeat. */
  const [failedStep, setFailedStep] = useState<"resolve" | "download" | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const tempUriRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      deleteTempFile(tempUriRef.current);
    };
  }, []);

  const loadPreview = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("loading");
    try {
      const data = await resolveVideo(url, controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;
      setInfo(data);
      setPhase("ready");
    } catch (err) {
      if (!mountedRef.current || controller.signal.aborted) return;
      setMessage(friendlyError(err));
      setFailedStep("resolve");
      setPhase("error");
    }
  }, [url]);

  useEffect(() => {
    if (urlIsValid) void loadPreview();
  }, [urlIsValid, loadPreview]);

  const runSave = useCallback(
    async (selected: Choice) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      deleteTempFile(tempUriRef.current);
      tempUriRef.current = null;

      setChoice(selected);
      setSaved(null);
      setStartedAt(Date.now());
      setPhase("working");

      try {
        const file = await downloadMedia({
          url,
          mode: selected.mode,
          quality: selected.quality,
          signal: controller.signal,
        });
        tempUriRef.current = file.uri;

        let method: SaveMethod = "gallery";
        try {
          await saveToGallery(file.uri);
        } catch (err) {
          // Some file types (audio, on certain Android versions) can't go into
          // the gallery — hand the user the share sheet instead of failing.
          if (err instanceof MediaSaveError && err.kind === "unsupported") {
            const shared = await shareFile(file.uri, file.mimeType);
            if (!shared) throw err;
            method = "share";
          } else {
            throw err;
          }
        }

        if (!mountedRef.current || controller.signal.aborted) return;
        setSaved({ choice: selected, method, uri: file.uri, mimeType: file.mimeType });
        setPhase("success");
      } catch (err) {
        if (!mountedRef.current || controller.signal.aborted) return;
        setMessage(friendlyError(err));
        setFailedStep("download");
        setPhase("error");
      }
    },
    [url],
  );

  const onChoose = useCallback(
    async (selected: Choice) => {
      setChoice(selected);
      const state = await getPermissionState();
      if (!mountedRef.current) return;
      if (state === "granted") {
        void runSave(selected);
      } else {
        setPhase(state === "ask" ? "permission" : "blocked");
      }
    },
    [runSave],
  );

  const onAllow = useCallback(async () => {
    setRequesting(true);
    const state = await requestPermission();
    if (!mountedRef.current) return;
    setRequesting(false);
    if (state === "granted" && choice) void runSave(choice);
    else setPhase("blocked");
  }, [choice, runSave]);

  const onRetry = useCallback(() => {
    if (failedStep === "download" && choice) void runSave(choice);
    else void loadPreview();
  }, [choice, failedStep, loadPreview, runSave]);

  // ── Sheet animation ────────────────────────────────────────────────────────
  const reveal = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    abortRef.current?.abort();
    Animated.timing(reveal, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    });
  }, [reveal, router]);

  // Don't let a stray back press interrupt a save that's already in flight.
  const busy = phase === "working";
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => busy);
    return () => sub.remove();
  }, [busy]);

  const translateY = reveal.interpolate({ inputRange: [0, 1], outputRange: [480, 0] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: reveal }]}>
        <Pressable
          style={styles.flex}
          onPress={busy ? undefined : close}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }], paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.grabber} />

        {phase === "loading" ? <VideoPreviewSkeleton /> : null}

        {(phase === "ready" || phase === "working") && info ? (
          <VideoPreview
            thumbnail={info.thumbnail}
            title={info.title}
            duration={info.duration}
          />
        ) : null}

        {phase === "ready" ? (
          <View style={styles.options}>
            {CHOICES.map((option) => {
              const Icon = ICON_FOR[option.id];
              return (
                <FormatOptionRow
                  key={option.id}
                  label={option.label}
                  subtext={option.subtext}
                  selected={choice?.id === option.id}
                  onPress={() => void onChoose(option)}
                  icon={<Icon size={22} color={colors.primary} strokeWidth={iconStroke} />}
                />
              );
            })}
          </View>
        ) : null}

        {phase === "working" ? <ProgressState startedAt={startedAt} /> : null}

        {phase === "success" && saved ? (
          <SuccessState
            detail={
              saved.method === "share" ? SHARE_FALLBACK_LINE : saved.choice.successLine
            }
            onDone={close}
            onSaveAnother={() => {
              setSaved(null);
              setChoice(null);
              setPhase("ready");
            }}
            onShare={
              saved.choice.id === "status"
                ? () => void shareFile(saved.uri, saved.mimeType)
                : undefined
            }
          />
        ) : null}

        {phase === "permission" || phase === "blocked" ? (
          <PermissionState
            variant={phase === "permission" ? "ask" : "blocked"}
            busy={requesting}
            onAllow={() => void onAllow()}
            onClose={close}
          />
        ) : null}

        {phase === "error" ? (
          <ErrorState
            message={message}
            onRetry={urlIsValid ? onRetry : undefined}
            onClose={close}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  grabber: {
    alignSelf: "center",
    width: spacing.huge,
    height: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  options: { gap: spacing.md },
});
