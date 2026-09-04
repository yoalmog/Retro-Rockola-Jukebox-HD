/**
 * Types and interfaces for Retro Rockola Jukebox
 */

export type MediaType = 'audio' | 'video';
export type MediaSourceType = 'built-in' | 'local-file' | 'local-folder' | 'stream-url' | 'custom';
export type MediaSourceFilter = 'all' | 'audio' | 'video' | 'local' | 'stream' | 'factory';

export interface Song {
  id: string;
  code: string; // e.g., "A01", "B12" (Vintage 2-character select code)
  title: string;
  artist: string;
  album: string;
  genre: string;
  year?: number;
  duration: number; // in seconds
  coverArt?: string;
  albumArtUrl?: string;
  audioUrl: string;
  videoUrl?: string; // Optional direct video stream/file URL (.mp4, .webm, .mov, etc.)
  mediaType?: MediaType; // 'audio' (default) or 'video'
  mediaSource?: MediaSourceType; // 'built-in', 'local-file', 'local-folder', 'stream-url', 'custom'
  fileFormat?: string; // e.g. 'AVI', 'WMV', 'MPG', 'MP3', 'MP4', 'FLAC', etc.
  audioBufferUrl?: string;
  isCustom?: boolean;
  lyrics?: string | string[];
  syncedLyrics?: { time: number; text: string }[];
  bpm?: number;
  playCount: number;
  favorite?: boolean;
  isNewlyImported?: boolean;
  isImported?: boolean;
}

export interface GenreCategory {
  id: string;
  name: string;
  nameHe?: string;
  nameEs: string;
  iconName: string;
  color: string;
  badge: string;
}

export interface QueueItem {
  queueId: string;
  song: Song;
  addedAt: number;
  creditsCost: number;
  isPriority?: boolean;
  isAutoDj?: boolean;
  requestedBy?: string;
  requestedByDevice?: string;
  partyApproved?: boolean;
}

export type SkinType = 
  | 'touchtunes-digital' // Modern Commercial Digital Jukebox (TouchTunes / AMI style with 3D Carousel & Top Equalizer)
  | 'rockolas-peru'      // Elegant Dark Jukebox HD (Classic Modern)
  | 'elegant-dark'       // Alias for Elegant Dark HD
  | 'wild-west'          // Wild West Saloon & Brass
  | 'salsa-latino'       // Tropical Salsa & Havana Club
  | 'heavy-rock'         // Heavy Rock & Metal Amp
  | 'classic-wood'       // Retro Wurlitzer 50s Wood & Bubble Tubes
  | 'neon-arcade'        // 80s Cyber Neon Synthwave
  | 'cyber-2026'         // Modern Kiosk HD
  | 'vintage-vinyl'      // Vintage Vinyl Lounge
  | 'custom';            // Custom User Hex Color Palette Theme

export interface MachineBranding {
  title: string;              // e.g. "ROCKOLA 24" or "COSTCO PRO JUKEBOX"
  subtitle: string;           // e.g. "Legacy Hardware Interface" or "Commercial Pro Edition"
  customLogoUrl?: string;     // uploaded image data URL or custom logo
  logoShape: 'circle' | 'badge' | 'square' | 'wide-banner';
  marqueeCustomText?: string; // custom marquee text line set by owner
  themePreset: SkinType;
  ownerName?: string;
}

export interface Playlist {
  id: string;
  name: string;
  nameHe?: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
  coverArt?: string;
  theme?: string;
  isPreset?: boolean;
}

export type AppLanguage = 'en' | 'es' | 'pt' | 'de' | 'fr' | 'he';

export type FocusArea = 
  | 'genre-nav'       // Left / Right shifts genres
  | 'song-list'       // Up / Down selects song, Enter adds to queue
  | 'playlist-nav'    // Browse playlists
  | 'action-bar'      // Quick jumps: Search, Queue, Vinyl, Numbers
  | 'quick-number'    // 2-digit selector [A][1][2]
  | 'search-keyboard' // 5-button on-screen virtual keyboard
  | 'queue-view'      // Queue list inspector
  | 'service-menu'    // Settings / Technician dialog
  | 'attract-mode';   // Idle screensaver

export interface KeyBindings {
  up: string[];        // Default: ArrowUp, KeyW, Numpad8
  down: string[];      // Default: ArrowDown, KeyS, Numpad2
  left: string[];      // Default: ArrowLeft, KeyA, Numpad4
  right: string[];     // Default: ArrowRight, KeyD, Numpad6
  select: string[];    // Default: Enter, Space, Numpad5
  coin1: string[];     // Default: Digit5, KeyC, Key1 (Coin Slot 1)
  coin2: string[];     // Default: Digit6, KeyV, Key2 (Coin Slot 2)
  service: string[];   // Default: F2, Tab, KeyK (Tech menu)
  freePlayToggle: string[]; // Default: F8, KeyP
  volumeUp: string[];  // Default: Equal, BracketRight
  volumeDown: string[]; // Default: Minus, BracketLeft
}

export interface MacroSequence {
  id: string;
  name: string;
  sequence: string[]; // e.g. ['1', '1', '2'] or ['up', 'up', 'down'] or ['coin1', 'coin1']
  actionType: 'PLAYLIST' | 'COIN' | 'FREEPLAY' | 'ATTRACT' | 'GENRE' | 'CODE';
  targetValue: string; // Playlist ID, Song code (e.g. "A01"), Genre ID, or coin count
  description?: string;
}

export interface HardwareDiagnosticLog {
  id: string;
  timestamp: string;
  isoTime: number;
  type: 
    | 'BUTTON_PRESS'
    | 'SIGNAL_NOISE'
    | 'CONTACT_BOUNCE'
    | 'CONNECTION_FAILURE'
    | 'DEVICE_DISCONNECTED'
    | 'DEVICE_CONNECTED'
    | 'STUCK_SWITCH'
    | 'UNMAPPED_SIGNAL';
  severity: 'info' | 'warning' | 'error' | 'critical';
  buttonCode: string;
  mappedAction: string;
  message: string;
  rawDetails?: {
    key?: string;
    keyCode?: number;
    durationMs?: number;
    jitterIntervalMs?: number;
    deviceSource?: string;
  };
}

export interface RockolaConfig {
  credits: number;
  freePlay: boolean;
  songsPerCredit: number;
  coinsPerCredit: number;
  coinValue: number; // e.g. 1 ₪ or $1
  currencySymbol: string;
  volume: number; // 0.0 to 1.0
  soundEffectsVolume: number;
  skin: SkinType;
  branding: MachineBranding;
  language: AppLanguage;
  attractModeTimeout: number; // seconds of idle before screensaver
  attractModeEnabled: boolean;
  scanlinesEnabled: boolean;
  soundEffectsEnabled: boolean;
  enableBubblerAnimation: boolean;
  kioskModePrompt: boolean;
  keyBindings: KeyBindings;
  totalCoinsLifetime: number;
  sessionCoins: number;
  totalPlaysLifetime: number;
  pinCode: string; // Service menu access PIN (default: "1234" or Up Up Down Down OK)
  activePlaylistId?: string;
  detailedVisualFeedback?: boolean; // Expanded high-contrast font & metadata display for large TV/projectors
  showPromoBanner?: boolean; // Enable or disable header mobile app promo banner ("YOUR NIGHT. YOUR MUSIC.")
  showHeaderBar?: boolean; // Enable or disable top commercial header bar (Now Playing pill, Credits badge, quick tools)
  showCommercialDock?: boolean; // Enable or disable bottom commercial navigation dock (default: false)
  showKioskFrame?: boolean; // Enable or disable outer physical kiosk cabinet shell frame
  lowCreditNudgeEnabled?: boolean; // Subtle blink or pulse effect on coin slot when credits < 3
  lowCreditNudgeStyle?: 'pulse' | 'blink' | 'glow'; // Visual nudge animation style
  stereoBalance?: number; // Stereo channel panning/balance (-100 Left, 0 Center, +100 Right)
  stereoWidth?: number; // Stereo width expansion (0% Mono to 100% Standard to 200% Wide)
  loudnessNormalization?: boolean; // Automatic dynamics compression & loudness leveling across tracks
  crossfadeEnabled?: boolean; // Smooth crossfading between queued tracks
  crossfadeDuration?: number; // Crossfade duration in seconds (1 to 8s, default: 3s)
  shuffleMode?: boolean; // Auto-play random songs from catalog when queue is empty
  macroSequences?: MacroSequence[]; // Custom 5-button macro sequences (e.g., '1-1-2' to play playlist)
  localDirectoryScanPath?: string; // Designated local music folder path (e.g. "./music")
  autoPollLocalDirectory?: boolean; // Background polling for new local MP3 files
  autoPollIntervalSeconds?: number; // Polling interval in seconds (default: 30)
  keypadDebounceMs?: number; // Input sensitivity delay for 5-button keypad (50-500ms, default: 150ms)
  crtScanlinesEnabled?: boolean; // Toggle global CRT scanline overlay
  phosphorGlowEnabled?: boolean; // Toggle retro CRT phosphor glow effect
  visualSyncSpectrumEnabled?: boolean; // Web Audio API real frequency spectrum linking to LED sound wave
  remoteControlEnabled?: boolean; // Mobile companion remote control bridge
  totalPlaySecondsLifetime?: number; // Lifetime play duration in seconds
  autoDjEnabled?: boolean; // Smart transition mixing when queue is empty
  autoDjStrategy?: 'bpm-match' | 'genre-match' | 'decade-harmonic' | 'smart-shuffle';
  autoDjCrossfadeMs?: number; // Auto-DJ crossfade duration in milliseconds (e.g. 4000ms)
  autoDjMinPopularity?: number;
  partyModeEnabled?: boolean; // Multi-device Group Queue Party Mode
  partyRoomCode?: string; // e.g. "ROCK-8821"
  partyHostPin?: string; // e.g. "1234"
  partyRequireApproval?: boolean; // Requires Host approval before song enters queue
  partyMaxRequestsPerGuest?: number; // Limit requests per mobile device session
  partyBlockedArtists?: string[]; // List of prohibited artists
  partyBlockedSongs?: string[]; // List of prohibited song IDs
  customSkinColors?: {
    primaryHex: string;
    secondaryHex: string;
    bgHex: string;
    tickerHex?: string;
    themeName?: string;
  };
  customTheme?: any; // ThemeDefinition generated dynamically
  mediaSourceFilter?: MediaSourceFilter; // Active media source filter (all, audio, video, local, stream, factory)
}

export interface SystemBackupPackage {
  version: string;
  exportedAt: number;
  machineName: string;
  config: RockolaConfig;
  playlists: Playlist[];
  customSongs?: Song[];
}
