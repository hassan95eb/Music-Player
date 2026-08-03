<div align="center">

# Music Player

**A local-first music player for the browser — your files never leave your device.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Getting Started](#getting-started) · [Architecture](#architecture) · [Roadmap](ROADMAP.md)

</div>

---

## Overview

Music Player is a browser-based audio player built with the Next.js App Router. You add
your own audio files; they are parsed for ID3 metadata, stored as blobs in IndexedDB, and
played back through a single shared `<audio>` element. Nothing is uploaded to a server —
there is no backend at all.

The project started as a vanilla HTML/CSS/JS exercise (preserved in [`legacy/`](legacy/))
and was rewritten as a typed, component-driven Next.js application.

## Features

| | |
|---|---|
| **Local-first** | Audio files are stored in IndexedDB and survive page reloads. No uploads, no accounts, no network calls. |
| **Metadata extraction** | Title, artist, album and cover art are read directly from ID3v2.3/2.4 tags with a hand-written parser — no third-party dependency. |
| **Zero runtime dependencies** | The only production dependencies are `next`, `react` and `react-dom`. |
| **Type-safe throughout** | Strict TypeScript with a deliberate split between storage and UI models. |
| **Accessible controls** | Native `<input type="range">` for seeking, labelled buttons, full keyboard operation. |

### Planned

Playlist and search · shuffle & repeat modes · volume control · dark mode with
cover-derived accent colours · keyboard shortcuts · Media Session API integration.

See [ROADMAP.md](ROADMAP.md) for the phased delivery plan.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, React Server Components, first-class TypeScript. |
| Language | TypeScript 5 (strict) | Catches the class of bugs that broke the original vanilla build. |
| Styling | Tailwind CSS 4 | Utility-first, no separate stylesheet to keep in sync with markup. |
| Persistence | IndexedDB + `localStorage` | IndexedDB stores binary blobs; `localStorage` holds lightweight settings. |
| Metadata | Custom ID3v2 parser | ~150 lines, avoids pulling in a 200 KB tag-reading library. |

## Getting Started

### Prerequisites

- Node.js 20.9 or later
- npm 10 or later

### Installation

```bash
git clone git@github.com:hassan95eb/Music-Player.git
cd Music-Player
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag audio files onto the drop zone
or use **Choose files** to build your library.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload. |
| `npm run build` | Create an optimised production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

### Supported Formats

Anything the browser's `<audio>` element can decode: MP3, M4A/AAC, OGG, WAV, FLAC, Opus.
Cover art extraction currently requires an ID3v2 tag, which in practice means MP3.

## Architecture

```
src/
├── app/
│   ├── layout.tsx              Root HTML shell, metadata, theme colours
│   ├── page.tsx                Composes PlayerProvider and the player card
│   └── globals.css             Tailwind entry point and range-input styling
├── components/
│   ├── player/                 PlayerCard, Cover, TrackMeta, ProgressBar, Controls
│   ├── playlist/               Track list and search            (phase 1)
│   ├── library/UploadZone.tsx  Drag-and-drop and file picker
│   ├── theme/                  Dark mode provider and toggle    (phase 3)
│   └── ui/                     Shared primitives (IconButton)
├── hooks/                      Keyboard shortcuts, Media Session (phase 4)
├── store/
│   └── PlayerProvider.tsx      Single source of truth: library, playback, settings
├── db/
│   └── tracks.ts               IndexedDB wrapper (open, put, delete, getAll)
└── lib/
    ├── types.ts                StoredTrack, Track, RepeatMode, PersistedSettings
    ├── constants.ts            DB names, storage keys, defaults
    ├── format.ts               formatTime, clamp, formatBytes
    ├── metadata.ts             ID3v2 parser, duration probe, File → StoredTrack
    └── settings.ts             localStorage read/write with safe fallbacks
```

### Data Flow

```
File (user drop)
   └─> fileToStoredTrack()      parse ID3 tags, probe duration
         └─> putTrack()         persist Blob to IndexedDB
               └─> toTrack()    mint object URLs for audio + cover
                     └─> PlayerProvider state ──> components via usePlayer()
                                                        │
                                                        └─> single <audio> element
```

### Design Decisions

**One audio element, owned by the provider.** `PlayerProvider` renders the only
`<audio>` node in the tree and exposes imperative actions (`play`, `seek`, `next`)
through context. No component reaches into the DOM, which keeps playback state and
React state from drifting apart — the main structural failure of the original script.

**`StoredTrack` and `Track` are different types.** The persisted shape carries `Blob`s;
the UI shape carries object URLs. Keeping them separate makes lifetime management
explicit: every object URL created by `toTrack()` has a matching `revokeTrack()`.

**IndexedDB for blobs, `localStorage` for settings.** `localStorage` is synchronous and
capped at a few megabytes — fine for a volume level, useless for a 40 MB FLAC file.

**Vendored ID3 parsing.** Reading four frame types (`TIT2`, `TPE1`, `TALB`, `APIC`) is a
contained problem. Vendoring it keeps the dependency tree at three packages and makes the
byte-level logic reviewable in one file.

## Migration Notes

The rewrite fixed several defects carried over from the vanilla implementation:

| Original | Defect | Resolution |
|---|---|---|
| `formatTime()` | No `return` statement — every timestamp rendered as `undefined : undefined`. | Rewritten in `lib/format.ts` with `NaN`/`Infinity` guards. |
| `formatTime(duration / 60)` | Minutes and seconds computed from the same malformed helper. | Correct hours/minutes/seconds decomposition. |
| `setProgressBar()` | Relied on `event.offsetX`, which is measured against the child element under the cursor. | Replaced with a native range input — also fixes keyboard seeking. |
| `music.play()` | Rejected promise unhandled; autoplay restrictions silently desynced the play button. | Rejections are caught and playback state is reset. |
| `loadMusic(songs)` | Parameter named for the collection but holding a single item. | Typed as `Track`. |
| Hard-coded `songs` array | Required committing audio files to the repository. | User-supplied files persisted client-side. |

## Browser Support

Requires IndexedDB, `crypto.randomUUID()` and `URL.createObjectURL` — Chrome 92+,
Edge 92+, Firefox 95+, Safari 15.4+. In private browsing modes that block IndexedDB, the
library falls back to session-only playback.

## Contributing

Issues and pull requests are welcome. Please keep changes scoped to a single roadmap
phase and make sure `npm run lint` and `npm run build` both pass before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
