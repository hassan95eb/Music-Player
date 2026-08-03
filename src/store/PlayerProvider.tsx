'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  deleteTrack as dbDeleteTrack,
  getAllStoredTracks,
  putTrack,
  revokeTrack,
  toTrack,
} from '@/db/tracks';
import { fileToStoredTrack } from '@/lib/metadata';
import { loadSettings, saveSettings } from '@/lib/settings';
import { clamp } from '@/lib/format';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { PersistedSettings, RepeatMode, Track, TrackId } from '@/lib/types';

interface PlayerContextValue {
  /* library */
  tracks: Track[];
  isLibraryLoading: boolean;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeTrack: (id: TrackId) => Promise<void>;

  /* playback */
  currentTrack: Track | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  playTrack: (id: TrackId) => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;

  /* settings */
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLibraryLoading, setLibraryLoading] = useState(true);
  const [currentId, setCurrentId] = useState<TrackId | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);

  const currentIndex = tracks.findIndex((t) => t.id === currentId);
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  /* ---------- boot: settings + library ---------- */

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);

    let cancelled = false;
    getAllStoredTracks()
      .then((records) => {
        if (cancelled) return;
        const list = records.sort((a, b) => a.addedAt - b.addedAt).map(toTrack);
        setTracks(list);
        const last = list.find((t) => t.id === stored.lastTrackId) ?? list[0];
        if (last) setCurrentId(last.id);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLibraryLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  /* Persist settings (including the last played track). */
  useEffect(() => {
    saveSettings({ ...settings, lastTrackId: currentId });
  }, [settings, currentId]);

  /* Release object URLs when the provider unmounts. */
  const tracksRef = useRef<Track[]>([]);
  tracksRef.current = tracks;
  useEffect(() => () => tracksRef.current.forEach(revokeTrack), []);

  /* ---------- audio element wiring ---------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = settings.muted ? 0 : settings.volume;
  }, [settings.volume, settings.muted]);

  const play = useCallback(() => {
    audioRef.current?.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const playTrack = useCallback((id: TrackId) => {
    setCurrentId(id);
    setPlaying(true);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (tracks.length === 0) return;
      if (settings.shuffle && tracks.length > 1) {
        let nextIndex = currentIndex;
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * tracks.length);
        }
        setCurrentId(tracks[nextIndex].id);
      } else {
        const base = currentIndex < 0 ? 0 : currentIndex;
        const nextIndex = (base + direction + tracks.length) % tracks.length;
        setCurrentId(tracks[nextIndex].id);
      }
      setPlaying(true);
    },
    [currentIndex, settings.shuffle, tracks],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => {
    const audio = audioRef.current;
    // Standard behaviour: restart the track if we are past the 3 second mark.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    step(-1);
  }, [step]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = clamp(seconds, 0, audio.duration);
    setCurrentTime(audio.currentTime);
  }, []);

  const seekBy = useCallback(
    (delta: number) => seek((audioRef.current?.currentTime ?? 0) + delta),
    [seek],
  );

  const handleEnded = useCallback(() => {
    if (settings.repeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
      }
      return;
    }
    const isLast = currentIndex === tracks.length - 1;
    if (settings.repeat === 'off' && isLast && !settings.shuffle) {
      setPlaying(false);
      return;
    }
    next();
  }, [currentIndex, next, settings.repeat, settings.shuffle, tracks.length]);

  /* Load the new source and autoplay when the track changes. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== currentTrack.src) {
      audio.src = currentTrack.src;
      audio.load();
      setCurrentTime(0);
    }
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  /* ---------- library mutations ---------- */

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav|flac|aac|opus)$/i.test(f.name),
    );
    if (list.length === 0) return;

    const added: Track[] = [];
    for (const file of list) {
      const stored = await fileToStoredTrack(file);
      await putTrack(stored).catch(() => undefined);
      added.push(toTrack(stored));
    }

    setTracks((prev) => [...prev, ...added]);
    setCurrentId((prev) => prev ?? added[0]?.id ?? null);
  }, []);

  const removeTrack = useCallback(
    async (id: TrackId) => {
      await dbDeleteTrack(id).catch(() => undefined);
      setTracks((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target) revokeTrack(target);
        return prev.filter((t) => t.id !== id);
      });
      if (id === currentId) {
        setPlaying(false);
        setCurrentId((prev) => {
          const remaining = tracksRef.current.filter((t) => t.id !== prev);
          return remaining[0]?.id ?? null;
        });
      }
    },
    [currentId],
  );

  /* ---------- settings mutations ---------- */

  const patch = useCallback(
    (changes: Partial<PersistedSettings>) => setSettings((prev) => ({ ...prev, ...changes })),
    [],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      tracks,
      isLibraryLoading,
      addFiles,
      removeTrack,

      currentTrack,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      play,
      pause,
      toggle,
      playTrack,
      next,
      previous,
      seek,
      seekBy,

      volume: settings.volume,
      muted: settings.muted,
      shuffle: settings.shuffle,
      repeat: settings.repeat,
      setVolume: (v: number) => patch({ volume: clamp(v, 0, 1), muted: false }),
      toggleMute: () => patch({ muted: !settings.muted }),
      toggleShuffle: () => patch({ shuffle: !settings.shuffle }),
      cycleRepeat: () =>
        patch({
          repeat: settings.repeat === 'off' ? 'all' : settings.repeat === 'all' ? 'one' : 'off',
        }),

      audioRef,
    }),
    [
      tracks,
      isLibraryLoading,
      addFiles,
      removeTrack,
      currentTrack,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      play,
      pause,
      toggle,
      playTrack,
      next,
      previous,
      seek,
      seekBy,
      settings,
      patch,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) =>
          setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}
