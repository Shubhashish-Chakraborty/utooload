# Utooload

*You too can download.*

Share a YouTube video or Short to Utooload and it saves the audio (MP3) or the
video (MP4) straight to your gallery. No links to paste, no ads, no accounts.

The backend (FastAPI) lives in `../utooload-backend`.

## Requirements

This app uses native share-intent handling, so **Expo Go will not work** — you
need a development build.

## Setup

```bash
npm install
```

```bash
npx expo install expo-dev-client expo-share-intent expo-media-library expo-file-system expo-clipboard expo-sharing react-native-svg lucide-react-native @expo-google-fonts/inter
```

Then generate the native project and run it on a device or emulator:

```bash
npx expo prebuild --clean && npx expo run:android
```

After that, `npx expo start --dev-client` is enough for day-to-day work.

## Backend URL

The backend runs locally. Bind it to all interfaces, not just loopback, or your
phone can't reach it:

```bash
uvicorn api.index:app --reload --host 0.0.0.0 --port 3001
```

`.env` stays as-is:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

`localhost` on a phone means the phone, so the app rewrites that host at runtime
to whatever address Metro served the bundle from — your Mac's LAN IP. No
`ipconfig getifaddr en0`, no IP to update when you switch networks. The port from
`.env` is kept. It logs the address it picked on startup:

```
[utooload] API_BASE_URL = http://192.168.1.3:3001
```

Anything that isn't loopback is used exactly as written, so a hardcoded LAN IP or
a deployed URL still works:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.3:3001
```

One exception: over **USB with adb reverse**, Metro itself is on `localhost`, so
there's no LAN IP to borrow. Forward the backend port too:

```bash
adb reverse tcp:3001 tcp:3001
```

## How it flows

| Entry point | What happens |
|---|---|
| Share sheet | `src/app/_layout.tsx` catches the intent and pushes `/sheet` with the URL |
| App icon | `src/app/index.tsx` (Home) — paste a link, or use one from the clipboard |

`src/app/sheet.tsx` is the screen that matters. It walks through loading the
preview → picking a format → downloading → saved, plus the permission and error
branches.

## Layout

```
src/
├── app/
│   ├── _layout.tsx      fonts, ShareIntentProvider, share-intent routing
│   ├── index.tsx        Home
│   └── sheet.tsx        format sheet — every state
├── components/          presentational pieces, one state each
└── lib/
    ├── api.ts           typed client for /api/resolve, /api/download, /api/health
    ├── theme.ts         colors, type, spacing — the only place hex values live
    ├── mediaSave.ts     expo-media-library helpers, "Utooload" album
    ├── choices.ts       the three save options and their copy
    ├── errorMessages.ts backend failures → plain-language copy
    ├── youtube.ts       URL detection, mirrors the backend's allowed hosts
    └── format.ts        duration / elapsed formatting
```

## Notes

- **WhatsApp Status** saves to the gallery like any other video, then points the
  user at WhatsApp. Writing into WhatsApp's private folder needs
  `MANAGE_EXTERNAL_STORAGE`, which is restricted and breaks across versions.
- **MP3 in the gallery** varies by Android version. If MediaStore refuses the
  file, the app falls back to the system share sheet so the save still lands.
- Video downloads use 720p to match the backend default. There's no quality
  picker on purpose.
- iOS share extension is off (`disableIOS: true` in `app.json`). Flip it when
  iOS becomes a target.
