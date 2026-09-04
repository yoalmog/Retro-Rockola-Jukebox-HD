import { Song } from '../types/rockola';

/**
 * Generates an SVG Data URL representing a retro "COMING SOON" album cover art
 * for newly imported songs missing artwork metadata.
 */
export function generateComingSoonCoverArt(title: string = 'NEW IMPORT', artist: string = 'ARTIST UNKNOWN'): string {
  const safeTitle = title.replace(/[<>&"]/g, '');
  const safeArtist = artist.replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0e17" />
        <stop offset="50%" stop-color="#1f1b2e" />
        <stop offset="100%" stop-color="#050508" />
      </linearGradient>
      
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="50%" stop-color="#fef08a" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>

      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      </pattern>
    </defs>

    <!-- Background Canvas -->
    <rect width="600" height="600" fill="url(#bgGrad)" />
    <rect width="600" height="600" fill="url(#grid)" />

    <!-- Outer Decorative Border -->
    <rect x="20" y="20" width="560" height="560" rx="16" fill="none" stroke="url(#cyanGrad)" stroke-width="2" opacity="0.6" />
    <rect x="30" y="30" width="540" height="540" rx="12" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="8 8" opacity="0.4" />

    <!-- Vinyl Record Center Visual -->
    <g transform="translate(300, 260)">
      <!-- Outer Grooves -->
      <circle r="140" fill="#0d0d12" stroke="#222" stroke-width="4" />
      <circle r="130" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
      <circle r="115" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
      <circle r="95" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
      <circle r="75" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      
      <!-- Record Center Sticker -->
      <circle r="55" fill="url(#cyanGrad)" />
      <circle r="50" fill="#0b0f19" stroke="url(#goldGrad)" stroke-width="2" />
      <circle r="12" fill="#000" stroke="#f59e0b" stroke-width="1.5" />
      
      <!-- Record Shimmer Reflection -->
      <path d="M -130 -40 L -40 -130 L 40 130 L -40 130 Z" fill="rgba(255,255,255,0.03)" />
    </g>

    <!-- Glowing "COMING SOON" Ribbon Banner -->
    <g transform="translate(300, 420)">
      <!-- Shadow -->
      <rect x="-210" y="-28" width="420" height="56" rx="10" fill="#000" opacity="0.6" />
      <!-- Banner BG -->
      <rect x="-200" y="-25" width="400" height="50" rx="8" fill="#111827" stroke="url(#goldGrad)" stroke-width="2" filter="url(#glow)" />
      <!-- Banner Text -->
      <text x="0" y="8" font-family="'Courier New', monospace, sans-serif" font-weight="900" font-size="22" fill="#fef08a" text-anchor="middle" letter-spacing="4">
        ★ COMING SOON ★
      </text>
    </g>

    <!-- Subtitle Badge -->
    <text x="300" y="475" font-family="sans-serif" font-weight="700" font-size="12" fill="#06b6d4" text-anchor="middle" letter-spacing="2" opacity="0.9">
      NEWLY IMPORTED • ARTWORK PENDING
    </text>

    <!-- Track Details at Bottom -->
    <g transform="translate(300, 525)">
      <text x="0" y="0" font-family="sans-serif" font-weight="800" font-size="16" fill="#ffffff" text-anchor="middle">
        ${safeTitle.length > 28 ? safeTitle.substring(0, 26) + '...' : safeTitle}
      </text>
      <text x="0" y="20" font-family="sans-serif" font-weight="600" font-size="13" fill="#9ca3af" text-anchor="middle">
        ${safeArtist.length > 32 ? safeArtist.substring(0, 30) + '...' : safeArtist}
      </text>
    </g>

    <!-- Top Corner Badges -->
    <g transform="translate(50, 60)">
      <rect x="0" y="0" width="110" height="24" rx="6" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="1" />
      <text x="55" y="16" font-family="sans-serif" font-weight="800" font-size="10" fill="#fef08a" text-anchor="middle" letter-spacing="1">
        NEW IMPORT
      </text>
    </g>

    <g transform="translate(450, 60)">
      <rect x="0" y="0" width="100" height="24" rx="6" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" stroke-width="1" />
      <text x="50" y="16" font-family="sans-serif" font-weight="800" font-size="10" fill="#67e8f9" text-anchor="middle" letter-spacing="1">
        JUKEBOX
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_COMING_SOON_COVER = generateComingSoonCoverArt('NEW IMPORT', 'ALBUM ART PENDING');

/**
 * Resolves the appropriate cover art image URL for a song.
 * Automatically checks if a song is 'newly imported' and missing local album art metadata,
 * returning the stylized 'Coming Soon' cover art.
 */
export function getSongCoverArt(song: Song | null | undefined): string {
  if (!song) {
    return DEFAULT_COMING_SOON_COVER;
  }

  // Check if art exists and is non-empty
  const hasCoverArt = Boolean(song.coverArt && song.coverArt.trim().length > 0);
  const hasAlbumArt = Boolean(song.albumArtUrl && song.albumArtUrl.trim().length > 0);

  // If song is marked as newly imported (or imported/custom) and lacks album art metadata
  const isNewlyImported = song.isNewlyImported || song.isImported || (song.isCustom && !hasCoverArt && !hasAlbumArt);

  if (isNewlyImported && !hasCoverArt && !hasAlbumArt) {
    return generateComingSoonCoverArt(song.title, song.artist);
  }

  if (hasCoverArt) {
    return song.coverArt!;
  }

  if (hasAlbumArt) {
    return song.albumArtUrl!;
  }

  // Fallback for custom or missing artwork
  if (song.isCustom || !hasCoverArt) {
    return generateComingSoonCoverArt(song.title, song.artist);
  }

  return DEFAULT_COMING_SOON_COVER;
}
