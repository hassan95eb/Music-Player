import type { PersistedSettings } from './types';

export const DB_NAME = 'music-player';
export const DB_VERSION = 1;
export const TRACKS_STORE = 'tracks';

export const SETTINGS_KEY = 'music-player:settings';

export const SEEK_STEP_SEC = 5;
export const VOLUME_STEP = 0.05;

export const ACCEPTED_AUDIO = 'audio/*,.mp3,.m4a,.ogg,.wav,.flac,.aac,.opus';

export const DEFAULT_SETTINGS: PersistedSettings = {
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: 'off',
  lastTrackId: null,
  theme: 'system',
};
