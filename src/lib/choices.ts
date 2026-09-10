/** The three things a user can do with a video — copy lives here, in one place. */
import type { DownloadMode, VideoQuality } from "./api";

export type ChoiceId = "audio" | "video" | "status";

export interface Choice {
  id: ChoiceId;
  label: string;
  subtext: string;
  mode: DownloadMode;
  /** Only sent for video downloads. 720p matches the backend default. */
  quality?: VideoQuality;
  /** One line of context on the success screen. */
  successLine: string;
}

export const CHOICES: readonly Choice[] = [
  {
    id: "audio",
    label: "Save as MP3",
    mode: "audio",
    subtext: "Audio only",
    successLine: "Your audio is in your gallery, in the Utooload album.",
  },
  {
    id: "video",
    label: "Save video",
    mode: "video",
    quality: "720p",
    subtext: "Saves to your gallery",
    successLine: "Saved to your gallery, in the Utooload album.",
  },
] as const;

/** Used when the gallery couldn't take the file and we fell back to sharing. */
export const SHARE_FALLBACK_LINE = "Choose where you'd like to keep it.";

export function choiceById(id: ChoiceId): Choice {
  return CHOICES.find((c) => c.id === id)!;
}
