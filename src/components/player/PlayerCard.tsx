'use client';

import { Controls } from './Controls';
import { Cover } from './Cover';
import { ProgressBar } from './ProgressBar';
import { TrackMeta } from './TrackMeta';
import { UploadZone } from '@/components/library/UploadZone';
import { usePlayer } from '@/store/PlayerProvider';

export function PlayerCard() {
  const { currentTrack, tracks, isLibraryLoading } = usePlayer();

  return (
    <section className="w-full max-w-sm rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur dark:bg-neutral-900/80">
      <Cover track={currentTrack} />

      <div className="mt-5 space-y-5">
        <TrackMeta track={currentTrack} />
        <ProgressBar />
        <Controls />

        {!isLibraryLoading && tracks.length === 0 && <UploadZone />}
      </div>
    </section>
  );
}
