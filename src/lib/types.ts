export type TrackId = string;

/** A track as stored in IndexedDB. The audio/cover live as Blobs. */
export interface StoredTrack {
  id: TrackId;
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  fileName: string;
  mimeType: string;
  size: number;
  addedAt: number;
  audio: Blob;
  cover?: Blob;
}

/** A track as used in the UI. Blobs are exposed as object URLs. */
export interface Track {
  id: TrackId;
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  fileName: string;
  addedAt: number;
  /** object URL for the audio blob */
  src: string;
  /** object URL for the cover blob, if any */
  coverUrl?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PersistedSettings {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  lastTrackId: TrackId | null;
  theme: 'light' | 'dark' | 'system';
}
