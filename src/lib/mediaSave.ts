/**
 * Gallery saving. Everything lands in a dedicated "Utooload" album so the user
 * can find their files in one place.
 *
 * We deliberately do NOT write into WhatsApp's private Status folder — that
 * needs MANAGE_EXTERNAL_STORAGE, which is fragile and heavily restricted on
 * modern Android. Saving to the gallery and telling the user where to look is
 * the reliable path.
 */
import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

export const ALBUM_NAME = "Utooload";

export type PermissionState = "granted" | "ask" | "blocked";

/** How the file ultimately reached the user. */
export type SaveMethod = "gallery" | "share";

export type MediaSaveErrorKind = "permission" | "unsupported" | "unknown";

export class MediaSaveError extends Error {
  readonly kind: MediaSaveErrorKind;

  constructor(kind: MediaSaveErrorKind, message: string) {
    super(message);
    this.name = "MediaSaveError";
    this.kind = kind;
  }
}

function toState(response: MediaLibrary.PermissionResponse): PermissionState {
  if (response.granted || response.accessPrivileges === "limited") return "granted";
  return response.canAskAgain ? "ask" : "blocked";
}

/** Read-only check — never triggers the system dialog. */
export async function getPermissionState(): Promise<PermissionState> {
  try {
    return toState(await MediaLibrary.getPermissionsAsync());
  } catch {
    return "ask";
  }
}

/** Triggers the system dialog. Show our own rationale before calling this. */
export async function requestPermission(): Promise<PermissionState> {
  try {
    return toState(await MediaLibrary.requestPermissionsAsync());
  } catch {
    return "blocked";
  }
}

/**
 * Saves a local file into the gallery's "Utooload" album.
 *
 * Android's MediaStore doesn't accept every file type through this path (audio
 * in particular varies by OS version), so an unsupported type surfaces as a
 * `MediaSaveError` with kind `unsupported` and the caller falls back to the
 * system share sheet.
 */
export async function saveToGallery(localUri: string): Promise<void> {
  let asset: MediaLibrary.Asset;
  try {
    asset = await MediaLibrary.createAssetAsync(localUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/permission/i.test(message)) throw new MediaSaveError("permission", message);
    throw new MediaSaveError("unsupported", message);
  }

  // The file is already safe in the gallery at this point — album grouping is
  // a nicety, so a failure here shouldn't fail the save.
  try {
    const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
    }
  } catch {
    // Saved, just not grouped into the album.
  }
}

/** Hands the file to the system share sheet (WhatsApp, Files, Drive, …). */
export async function shareFile(localUri: string, mimeType: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(localUri, { mimeType, UTI: mimeType });
  return true;
}

/** Best-effort cleanup of the temp file we streamed the download into. */
export function deleteTempFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cache directory — the OS will reclaim it anyway.
  }
}
