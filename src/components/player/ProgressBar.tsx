'use client';

import { formatTime } from '@/lib/format';
import { usePlayer } from '@/store/PlayerProvider';

export function ProgressBar() {
  const { currentTime, duration, seek, currentTrack } = usePlayer();
  const max = duration || currentTrack?.durationSec || 0;
  const percent = max > 0 ? (currentTime / max) * 100 : 0;

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={max || 1}
        step={0.1}
        value={Math.min(currentTime, max || 1)}
        onChange={(e) => seek(Number(e.target.value))}
        disabled={!currentTrack}
        aria-label="Seek"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 dark:bg-white/15 accent-neutral-900 dark:accent-white disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, currentColor ${percent}%, transparent ${percent}%)`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(max)}</span>
      </div>
    </div>
  );
}
