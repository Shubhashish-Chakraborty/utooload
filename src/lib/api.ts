
import Constants from "expo-constants";
import { Directory, File, Paths } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";

const DEFAULT_DEV_PORT = "3001";
const EXPO_PUBLIC_API_BASE_URL = "https://utooloadapi.onrender.com/";
// const EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.12:3001/";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function devServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split("/")[0]!.split(":")[0];
  return host || null;
}


function resolveBaseUrl(): string {
  const configured = EXPO_PUBLIC_API_BASE_URL?.trim();
  const lanHost = devServerHost();

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (!LOOPBACK.has(parsed.hostname)) return stripTrailingSlash(configured);
      if (lanHost && !LOOPBACK.has(lanHost)) {
        return `${parsed.protocol}//${lanHost}:${parsed.port || DEFAULT_DEV_PORT}`;
      }
    } catch {
      // Not a parseable URL — hand it back untouched and let the request fail
      // loudly rather than silently rewriting something we don't understand.
    }
    return stripTrailingSlash(configured);
  }

  return lanHost ? `http://${lanHost}:${DEFAULT_DEV_PORT}` : `http://localhost:${DEFAULT_DEV_PORT}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log(`[utooload] API_BASE_URL = ${API_BASE_URL}`);
}

const RESOLVE_TIMEOUT_MS = 30_000;
/** Matches the backend's own ceiling on Vercel. */
const DOWNLOAD_TIMEOUT_MS = 300_000;

export type DownloadMode = "audio" | "video";
export type VideoQuality = "360p" | "480p" | "720p" | "best";

export interface FormatOption {
  format_id: string;
  ext: string | null;
  resolution: string | null;
  abr: number | null;
  filesize_approx: number | null;
  note: string | null;
}

export interface ResolveResult {
  title: string | null;
  thumbnail: string | null;
  duration: number | null;
  formats: FormatOption[];
}

export type ApiErrorKind = "http" | "network" | "timeout";

/**
 * Carries only what the UI needs to pick a friendly message. `detail` is kept
 * for dev logging and must never be shown to the user.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(kind: ApiErrorKind, status: number | null, detail: string | null) {
    super(`[${kind}${status ? ` ${status}` : ""}] ${detail ?? "request failed"}`);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

/** Combines a timeout with an optional caller-supplied cancel signal. */
function timeoutSignal(ms: number, external?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onExternalAbort = () => controller.abort();
  external?.addEventListener("abort", onExternalAbort);
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function readDetail(res: Response) {
  try {
    const text = await res.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as { detail?: unknown };
      return typeof parsed.detail === "string" ? parsed.detail : text;
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

export async function resolveVideo(url: string, signal?: AbortSignal): Promise<ResolveResult> {
  const t = timeoutSignal(RESOLVE_TIMEOUT_MS, signal);
  try {
    const res = await fetch(`${API_BASE_URL}/api/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url }),
      signal: t.signal,
    });
    if (!res.ok) throw new ApiError("http", res.status, await readDetail(res));
    return (await res.json()) as ResolveResult;
  } catch (err) {
    throw normalize(err, t.didTimeOut());
  } finally {
    t.cleanup();
  }
}

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number | null;
}

export interface DownloadedFile {
  /** Local file:// URI in the cache directory, ready for expo-media-library. */
  uri: string;
  filename: string;
  mimeType: string;
  bytes: number;
}

/**
 * POSTs to /api/download and streams the response body straight to disk, so a
 * 200MB video never has to sit in JS memory as one buffer.
 */
export async function downloadMedia(opts: {
  url: string;
  mode: DownloadMode;
  quality?: VideoQuality;
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
}): Promise<DownloadedFile> {
  const { url, mode, quality = "720p", onProgress, signal } = opts;
  const t = timeoutSignal(DOWNLOAD_TIMEOUT_MS, signal);

  try {
    const res = await expoFetch(`${API_BASE_URL}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      body: JSON.stringify(mode === "audio" ? { url, mode } : { url, mode, quality }),
      signal: t.signal,
    });

    if (!res.ok) throw new ApiError("http", res.status, await readDetail(res));

    const mimeType =
      res.headers.get("content-type")?.split(";")[0]?.trim() ||
      (mode === "audio" ? "audio/mpeg" : "video/mp4");
    const totalHeader = res.headers.get("content-length");
    const totalBytes = totalHeader ? Number(totalHeader) || null : null;
    const filename = safeFilename(
      parseContentDisposition(res.headers.get("content-disposition")),
      mode,
    );

    const dir = new Directory(Paths.cache, "downloads");
    dir.create({ intermediates: true, idempotent: true });

    const file = new File(dir, filename);
    if (file.exists) file.delete();
    file.create({ intermediates: true, overwrite: true });

    let received = 0;
    const handle = file.open();
    try {
      const reader = res.body?.getReader();
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value?.length) {
            handle.writeBytes(value);
            received += value.length;
            onProgress?.({ receivedBytes: received, totalBytes });
          }
        }
      } else {
        // Fallback for runtimes without a streamable body.
        const bytes = new Uint8Array(await res.arrayBuffer());
        handle.writeBytes(bytes);
        received = bytes.length;
        onProgress?.({ receivedBytes: received, totalBytes });
      }
    } finally {
      handle.close();
    }

    if (received === 0) {
      file.delete();
      throw new ApiError("http", 500, "empty response body");
    }

    return { uri: file.uri, filename, mimeType, bytes: received };
  } catch (err) {
    throw normalize(err, t.didTimeOut());
  } finally {
    t.cleanup();
  }
}

/** Not user-facing — handy for a startup connectivity check or debugging. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { method: "GET" });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body.status === "ok";
  } catch {
    return false;
  }
}

function normalize(err: unknown, didTimeOut: boolean): ApiError {
  if (err instanceof ApiError) return err;
  if (didTimeOut) return new ApiError("timeout", null, "request timed out");
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof Error && err.name === "AbortError") {
    return new ApiError("network", null, "cancelled");
  }
  return new ApiError("network", null, message);
}

function parseContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;\n]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].replace(/^"|"$/g, "").trim());
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*"?([^";\n]+)"?/i.exec(header);
  return plain?.[1]?.trim() ?? null;
}

/** Strips path separators and guarantees an extension expo-media-library accepts. */
function safeFilename(raw: string | null, mode: DownloadMode): string {
  const fallbackExt = mode === "audio" ? "mp3" : "mp4";
  const base = (raw ?? "")
    .split(/[\\/]/)
    .pop()!
    .replace(/[^\w\s.\-()]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100)
    .trim();
  const name = base || `utooload_${mode}`;
  return /\.[a-z0-9]{2,4}$/i.test(name) ? name : `${name}.${fallbackExt}`;
}
