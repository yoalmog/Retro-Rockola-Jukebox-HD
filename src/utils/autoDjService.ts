import { Song, RockolaConfig } from '../types/rockola';

export interface AutoDjRecommendation {
  song: Song;
  reason: string;
  crossfadeDurationMs: number;
  matchScore: number;
}

/**
 * Intelligent Auto-DJ algorithm that analyzes BPM, genre, release decade,
 * and play count history to select seamless song transitions when the queue is empty.
 */
export function selectAutoDjNextSong(
  catalog: Song[],
  lastSong: Song | null,
  recentHistoryIds: string[] = [],
  config?: RockolaConfig
): AutoDjRecommendation | null {
  if (!catalog || catalog.length === 0) return null;

  // Filter out songs played recently (last 10 tracks)
  const availableSongs = catalog.filter(s => !recentHistoryIds.slice(-10).includes(s.id));
  const pool = availableSongs.length > 0 ? availableSongs : catalog;

  const strategy = config?.autoDjStrategy || 'bpm-match';
  const targetCrossfadeMs = config?.autoDjCrossfadeMs || 4000;

  if (!lastSong) {
    // Pick highest rated / favorite or random top played track
    const randomSong = pool[Math.floor(Math.random() * pool.length)];
    return {
      song: randomSong,
      reason: '🎵 Auto-DJ Initial Track Selection',
      crossfadeDurationMs: targetCrossfadeMs,
      matchScore: 100
    };
  }

  const lastBpm = lastSong.bpm || estimateBpmFromGenre(lastSong.genre);
  const lastGenre = lastSong.genre;
  const lastYear = lastSong.year || 1990;

  let bestSong: Song = pool[0];
  let bestScore = -1;
  let transitionReason = '';

  for (const song of pool) {
    if (song.id === lastSong.id) continue;

    let score = 0;
    const songBpm = song.bpm || estimateBpmFromGenre(song.genre);
    const songYear = song.year || 1990;

    // Strategy 1: BPM Matching (within +- 15 BPM)
    const bpmDiff = Math.abs(lastBpm - songBpm);
    const bpmScore = Math.max(0, 100 - bpmDiff * 4);

    // Strategy 2: Genre Matching
    const genreScore = song.genre === lastGenre ? 100 : 30;

    // Strategy 3: Era / Decade Harmonic Matching
    const decadeDiff = Math.abs(Math.floor(lastYear / 10) - Math.floor(songYear / 10));
    const decadeScore = Math.max(0, 100 - decadeDiff * 25);

    // Play count / Favorite bonus
    const favBonus = song.favorite ? 15 : 0;
    const playCountBonus = Math.min(20, song.playCount * 2);

    if (strategy === 'bpm-match') {
      score = bpmScore * 0.5 + genreScore * 0.3 + decadeScore * 0.2 + favBonus + playCountBonus;
    } else if (strategy === 'genre-match') {
      score = genreScore * 0.6 + bpmScore * 0.25 + decadeScore * 0.15 + favBonus;
    } else if (strategy === 'decade-harmonic') {
      score = decadeScore * 0.5 + bpmScore * 0.3 + genreScore * 0.2 + favBonus;
    } else {
      // Smart Shuffle
      score = Math.random() * 60 + bpmScore * 0.2 + favBonus + playCountBonus;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSong = song;

      const songBpmVal = bestSong.bpm || estimateBpmFromGenre(bestSong.genre);
      if (strategy === 'bpm-match') {
        transitionReason = `🎧 BPM Match (${lastBpm} ➔ ${songBpmVal} BPM)`;
      } else if (strategy === 'genre-match') {
        transitionReason = `🎷 Genre Vibe Flow (${bestSong.genre.toUpperCase()})`;
      } else if (strategy === 'decade-harmonic') {
        transitionReason = `📻 Decade Harmonic Transition (${lastYear}s ➔ ${songYear}s)`;
      } else {
        transitionReason = `✨ Smart Auto-DJ Mix Selection`;
      }
    }
  }

  return {
    song: bestSong,
    reason: transitionReason || '✨ Auto-DJ Selection',
    crossfadeDurationMs: targetCrossfadeMs,
    matchScore: Math.round(bestScore)
  };
}

function estimateBpmFromGenre(genre: string): number {
  switch (genre?.toLowerCase()) {
    case 'rock': case 'heavy-metal': return 128;
    case 'salsa': case 'latin': case 'reggaeton': return 102;
    case 'disco': case 'dance': case 'pop': return 120;
    case 'hiphop': case 'rnb': return 92;
    case 'jazz': case 'blues': return 84;
    case 'country': case 'ballad': return 76;
    default: return 110;
  }
}
