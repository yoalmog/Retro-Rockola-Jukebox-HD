import { Song } from '../types/rockola';

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

/**
 * Parses raw LRC string into time-synced lyric line array
 * Format: [mm:ss.xx] Lyric text
 */
export function parseLrcContent(lrcText: string, duration: number = 180): SyncedLyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n').map(l => l.trim()).filter(Boolean);
  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  const parsedLines: SyncedLyricLine[] = [];

  for (const line of lines) {
    const match = line.match(lrcRegex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim();
      if (text) {
        parsedLines.push({ time, text });
      }
    }
  }

  if (parsedLines.length > 0) {
    return parsedLines.sort((a, b) => a.time - b.time);
  }

  // Fallback if no timestamps were matched: distribute lines across duration
  const startOffset = duration * 0.03;
  const usableDuration = duration * 0.92;
  const interval = usableDuration / Math.max(1, lines.length);

  return lines.map((text, idx) => ({
    time: Math.round((startOffset + idx * interval) * 100) / 100,
    text: text.replace(/^\[.*?\]/, '').trim() || text
  })).filter(l => l.text.length > 0);
}

/**
 * Automatically attempts to fetch, parse, or generate time-synced LRC lyrics for a song.
 * Checks local storage cache, '/lyrics/...' directory endpoints, and song model.
 */
export async function fetchAndSyncLrcLyrics(song: Song): Promise<Song> {
  if (!song) return song;

  // 1. If song already has syncedLyrics loaded, return as is
  if (song.syncedLyrics && song.syncedLyrics.length > 0) {
    return song;
  }

  const cacheKey = `lrc_lyrics_cache_${song.id}`;
  const slug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  // 2. Check LocalStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { ...song, syncedLyrics: parsed };
      }
    }
  } catch (err) {
    console.warn('LRC cache read error:', err);
  }

  // 3. Attempt fetching from local 'lyrics' directory endpoints
  const possibleEndpoints = [
    `/lyrics/${song.id}.lrc`,
    `/lyrics/${slug(song.artist)}-${slug(song.title)}.lrc`,
    `/lyrics/${slug(song.title)}.lrc`
  ];

  for (const url of possibleEndpoints) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('[')) {
          const synced = parseLrcContent(text, song.duration || 180);
          if (synced.length > 0) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(synced));
            } catch (e) {}
            return { ...song, syncedLyrics: synced };
          }
        }
      }
    } catch (e) {
      // Endpoint not found or network offline, continue to fallback
    }
  }

  // 4. Fallback: Parse existing plain-text lyrics or generate time-synced LRC
  let rawLyrics: string[] = [];
  if (Array.isArray(song.lyrics)) {
    rawLyrics = song.lyrics;
  } else if (typeof song.lyrics === 'string') {
    rawLyrics = song.lyrics.split('\n').map(l => l.trim()).filter(Boolean);
  }

  // If no lyrics exist, generate a classic lyrical accompaniment structure
  if (rawLyrics.length === 0) {
    rawLyrics = [
      `🎵 [Instrumental Intro - ${song.artist}]`,
      `♪ "${song.title}" ♪`,
      `Rhythm & beats playing...`,
      `Enjoy the vintage Rockola Jukebox sound`,
      `♪ Guitar solo & melody section ♪`,
      `♪ Chorus: ${song.title} ♪`,
      `♪ Outro fading... ♪`
    ];
  }

  const synced = parseLrcContent(rawLyrics.join('\n'), song.duration || 180);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(synced));
  } catch (e) {}

  return { ...song, syncedLyrics: synced };
}
