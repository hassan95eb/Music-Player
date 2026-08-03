'use client';

/* eslint-disable @next/next/no-img-element */
import type { Track } from '@/lib/types';

export function Cover({ track }: { track: Track | null }) {
  if (!track?.coverUrl) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 grid place-items-center">
        <span className="text-5xl opacity-40" aria-hidden>
          ♪
        </span>
      </div>
    );
  }

  return (
    <img
      src={track.coverUrl}
      alt={`${track.title} cover`}
      className="aspect-square w-full rounded-2xl object-cover shadow-lg"
    />
  );
}
