import type { StoredTrack } from './types';

/**
 * Dependency-free ID3v2 (2.3 / 2.4) tag reader.
 * Pulls TIT2 (title), TPE1 (artist), TALB (album) and APIC (cover art).
 * Falls back to the file name when there is no usable tag.
 */

interface Id3Tags {
  title?: string;
  artist?: string;
  album?: string;
  cover?: Blob;
}

function decodeText(bytes: Uint8Array, encoding: number): string {
  try {
    switch (encoding) {
      case 0:
        return new TextDecoder('iso-8859-1').decode(bytes);
      case 1:
        return new TextDecoder('utf-16').decode(bytes);
      case 2:
        return new TextDecoder('utf-16be').decode(bytes);
      default:
        return new TextDecoder('utf-8').decode(bytes);
    }
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function trimNull(value: string): string {
  return value.replace(/\0+$/g, '').trim();
}

/** Synchsafe integer used by the ID3v2 header. */
function readSynchsafe(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

export async function readId3Tags(file: Blob): Promise<Id3Tags> {
  // The tag lives at the very start of the file; 1 MB is plenty for cover art.
  const head = await file.slice(0, 1024 * 1024).arrayBuffer();
  const view = new DataView(head);
  const bytes = new Uint8Array(head);

  if (bytes.length < 10) return {};
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return {}; // "ID3"

  const majorVersion = bytes[3];
  const tagSize = readSynchsafe(view, 6);
  const end = Math.min(10 + tagSize, bytes.length);

  const tags: Id3Tags = {};
  let offset = 10;

  while (offset + 10 <= end) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break; // padding reached

    const frameSize =
      majorVersion >= 4 ? readSynchsafe(view, offset + 4) : view.getUint32(offset + 4);
    if (frameSize <= 0 || offset + 10 + frameSize > end) break;

    const body = bytes.subarray(offset + 10, offset + 10 + frameSize);

    if (frameId === 'TIT2' || frameId === 'TPE1' || frameId === 'TALB') {
      const value = trimNull(decodeText(body.subarray(1), body[0]));
      if (value) {
        if (frameId === 'TIT2') tags.title = value;
        else if (frameId === 'TPE1') tags.artist = value;
        else tags.album = value;
      }
    } else if (frameId === 'APIC' && !tags.cover) {
      tags.cover = parseApic(body);
    }

    offset += 10 + frameSize;
  }

  return tags;
}

function parseApic(body: Uint8Array): Blob | undefined {
  let cursor = 1; // skip text-encoding byte

  // MIME type: null-terminated latin1
  const mimeStart = cursor;
  while (cursor < body.length && body[cursor] !== 0) cursor += 1;
  const mimeType = new TextDecoder('iso-8859-1').decode(body.subarray(mimeStart, cursor)) || 'image/jpeg';
  cursor += 1;

  cursor += 1; // picture type byte

  // Description: null-terminated, encoding-dependent terminator
  const encoding = body[0];
  if (encoding === 1 || encoding === 2) {
    while (cursor + 1 < body.length && !(body[cursor] === 0 && body[cursor + 1] === 0)) cursor += 2;
    cursor += 2;
  } else {
    while (cursor < body.length && body[cursor] !== 0) cursor += 1;
    cursor += 1;
  }

  if (cursor >= body.length) return undefined;
  // Copy into a fresh buffer so the Blob does not retain the whole 1 MB slice.
  const picture = body.slice(cursor);
  return new Blob([picture], { type: mimeType });
}

/** Read duration by loading the file into a throwaway <audio> element. */
export function readDuration(src: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const done = (value: number | undefined) => {
      audio.removeAttribute('src');
      audio.load();
      resolve(value);
    };
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () =>
      done(Number.isFinite(audio.duration) ? audio.duration : undefined),
    );
    audio.addEventListener('error', () => done(undefined));
    audio.src = src;
  });
}

/** Turn a user-selected file into a StoredTrack ready for IndexedDB. */
export async function fileToStoredTrack(file: File): Promise<StoredTrack> {
  const tags = await readId3Tags(file).catch(() => ({} as Id3Tags));
  const fallbackTitle = file.name.replace(/\.[^.]+$/, '');

  const objectUrl = URL.createObjectURL(file);
  const durationSec = await readDuration(objectUrl);
  URL.revokeObjectURL(objectUrl);

  return {
    id: crypto.randomUUID(),
    title: tags.title || fallbackTitle,
    artist: tags.artist || 'Unknown artist',
    album: tags.album,
    durationSec,
    fileName: file.name,
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    addedAt: Date.now(),
    audio: file,
    cover: tags.cover,
  };
}
