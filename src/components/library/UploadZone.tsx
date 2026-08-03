'use client';

import { useRef, useState } from 'react';
import { ACCEPTED_AUDIO } from '@/lib/constants';
import { usePlayer } from '@/store/PlayerProvider';

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const { addFiles } = usePlayer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setOver] = useState(false);
  const [isBusy, setBusy] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      await addFiles(files);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={[
        'rounded-xl border-2 border-dashed text-center transition',
        compact ? 'p-4 text-sm' : 'p-8',
        isOver
          ? 'border-neutral-900 bg-black/5 dark:border-white dark:bg-white/10'
          : 'border-black/15 dark:border-white/20',
      ].join(' ')}
    >
      <p className="text-neutral-600 dark:text-neutral-400">
        {isBusy ? 'Reading files…' : 'Drop audio files here'}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        className="mt-2 rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AUDIO}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
