'use client';

import { IconButton } from '@/components/ui/IconButton';
import { usePlayer } from '@/store/PlayerProvider';

export function Controls() {
  const { isPlaying, toggle, next, previous, currentTrack } = usePlayer();

  return (
    <div className="flex items-center justify-center gap-4">
      <IconButton label="Previous" onClick={previous} disabled={!currentTrack}>
        ⏮
      </IconButton>

      <IconButton
        label={isPlaying ? 'Pause' : 'Play'}
        size="lg"
        onClick={toggle}
        disabled={!currentTrack}
        className="bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:hover:text-neutral-900"
      >
        {isPlaying ? '⏸' : '▶'}
      </IconButton>

      <IconButton label="Next" onClick={next} disabled={!currentTrack}>
        ⏭
      </IconButton>
    </div>
  );
}
