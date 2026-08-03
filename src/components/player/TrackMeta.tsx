'use client';

import type { Track } from '@/lib/types';

export function TrackMeta({ track }: { track: Track | null }) {
  return (
    <div className="text-center">
      <h2 className="truncate text-xl font-semibold">{track?.title ?? 'No track loaded'}</h2>
      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
        {track?.artist ?? 'Add music to get started'}
      </p>
    </div>
  );
}
