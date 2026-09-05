/** YouTube URL detection — mirrors the backend's ALLOWED_HOSTS list. */

const ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
];

export function isYouTubeUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return false;
  }
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * Shares from YouTube arrive as text like:
 *   "Some video title\nhttps://youtu.be/abc123?si=xyz"
 * Pull the first YouTube link out of whatever we were handed.
 */
export function extractYouTubeUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const candidates = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const raw of candidates) {
    const cleaned = raw.replace(/[).,]+$/, "");
    if (isYouTubeUrl(cleaned)) return cleaned;
  }
  return null;
}
