/**
 * Backend/runtime failures -> plain-language copy.
 * Nothing technical ever reaches the screen: no status codes, no JSON, no
 * stack traces.
 */
import { ApiError } from "./api";
import { MediaSaveError } from "./mediaSave";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.kind === "http") {
      switch (err.status) {
        case 400:
          return "This doesn't look like a YouTube link.";
        case 422:
          return "Couldn't process this video, Something went wrong.";
        default:
          return GENERIC_ERROR;
      }
    }
    // Network drops and timeouts read the same to the user.
    return GENERIC_ERROR;
  }

  if (err instanceof MediaSaveError) {
    if (err.kind === "permission") {
      return "Utooload needs permission to save to your gallery.";
    }
    return "Couldn't save this file to your gallery. Please try again.";
  }

  return GENERIC_ERROR;
}

/** Shown when the URL never made it past our own check. */
export const NOT_A_YOUTUBE_LINK = "This doesn't look like a YouTube link.";
