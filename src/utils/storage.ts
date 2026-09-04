import { RockolaConfig, Song, KeyBindings, Playlist, MachineBranding, MacroSequence } from '../types/rockola';

export const DEFAULT_MACRO_SEQUENCES: MacroSequence[] = [
  {
    id: 'macro-112-party',
    name: 'Quick Party Playlist (1-1-2)',
    sequence: ['1', '1', '2'],
    actionType: 'PLAYLIST',
    targetValue: 'pl-wildwest',
    description: 'Hardware macro sequence 1-1-2 triggers the Wild West Party playlist'
  },
  {
    id: 'macro-updown-attract',
    name: 'Instant Screensaver (UP-UP-DOWN)',
    sequence: ['UP', 'UP', 'DOWN'],
    actionType: 'ATTRACT',
    targetValue: 'attract',
    description: 'Triggers Attract Mode screensaver'
  },
  {
    id: 'macro-coin-bonus',
    name: 'Operator Bonus Credit (COIN-COIN)',
    sequence: ['COIN1', 'COIN1'],
    actionType: 'COIN',
    targetValue: '1',
    description: 'Adds 1 bonus credit on rapid double coin insert'
  }
];

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  up: ['ArrowUp', 'KeyW', 'Numpad8'],
  down: ['ArrowDown', 'KeyS', 'Numpad2'],
  left: ['ArrowLeft', 'KeyA', 'Numpad4'],
  right: ['ArrowRight', 'KeyD', 'Numpad6'],
  select: ['Enter', 'Space', 'Numpad5', 'KeyE'],
  coin1: ['Digit5', 'KeyC', 'Digit1'],
  coin2: ['Digit6', 'KeyV', 'Digit2'],
  service: ['F2', 'Tab', 'KeyK'],
  freePlayToggle: ['F8', 'KeyP'],
  volumeUp: ['Equal', 'BracketRight'],
  volumeDown: ['Minus', 'BracketLeft']
};

export const DEFAULT_BRANDING: MachineBranding = {
  title: 'ROCKOLA PRO',
  subtitle: 'Commercial High Definition Audio Jukebox',
  logoShape: 'circle',
  marqueeCustomText: '★ COMMERCIAL ROCKOLA HD • 5-BUTTON VINTAGE HARDWARE & TOUCH • COIN & BILL ACCEPTOR ★',
  themePreset: 'rockolas-peru',
  ownerName: 'OPERATOR'
};

export const DEFAULT_CONFIG: RockolaConfig = {
  credits: 4,
  freePlay: false,
  songsPerCredit: 1,
  coinsPerCredit: 1,
  coinValue: 0.25,
  currencySymbol: '$',
  volume: 0.85,
  soundEffectsVolume: 0.8,
  skin: 'rockolas-peru',
  branding: DEFAULT_BRANDING,
  language: 'en',
  attractModeTimeout: 90,
  attractModeEnabled: true,
  scanlinesEnabled: false,
  soundEffectsEnabled: true,
  enableBubblerAnimation: true,
  kioskModePrompt: false,
  showCommercialDock: false,
  keyBindings: DEFAULT_KEY_BINDINGS,
  totalCoinsLifetime: 128,
  sessionCoins: 4,
  totalPlaysLifetime: 350,
  pinCode: '1234',
  detailedVisualFeedback: false,
  showPromoBanner: false,
  showHeaderBar: false,
  showKioskFrame: false,
  lowCreditNudgeEnabled: true,
  lowCreditNudgeStyle: 'pulse',
  loudnessNormalization: true,
  crossfadeEnabled: true,
  crossfadeDuration: 3,
  shuffleMode: false,
  macroSequences: DEFAULT_MACRO_SEQUENCES,
  localDirectoryScanPath: './music',
  autoPollLocalDirectory: true,
  autoPollIntervalSeconds: 30
};

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-wildwest',
    name: 'Wild West Saloon Hits',
    description: 'Outlaw country, gritty roots rock, and authentic saloon anthems',
    songIds: ['rock-1', 'rock-2', 'cou-1', 'cou-2'],
    createdAt: 1715000000000,
    updatedAt: 1715000000000,
    coverArt: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    theme: 'wild-west',
    isPreset: true
  },
  {
    id: 'pl-salsa',
    name: 'Havana Salsa & Latin Fiesta',
    description: 'High-energy salsa, cumbia beats, and tropical rhythms for the dance floor',
    songIds: ['lat-1', 'lat-2', 'dis-2', 'charts-4'],
    createdAt: 1715001000000,
    updatedAt: 1715001000000,
    coverArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    theme: 'salsa-latino',
    isPreset: true
  },
  {
    id: 'pl-rock',
    name: 'Heavy Rock & Guitar Legends',
    description: 'Electrifying stadium solos, monster distortion, and iconic guitar riffs',
    songIds: ['rock-1', 'rock-2', 'rock-3', 'brit-1'],
    createdAt: 1715002000000,
    updatedAt: 1715002000000,
    coverArt: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=400&q=80',
    theme: 'heavy-rock',
    isPreset: true
  },
  {
    id: 'pl-retro',
    name: '80s Synthwave & Retro Pop',
    description: 'Neon synthwave vibes, 80s arcade favorites, and classic disco dance grooves',
    songIds: ['ret-1', 'ret-2', 'dis-1', 'dis-2'],
    createdAt: 1715003000000,
    updatedAt: 1715003000000,
    coverArt: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    theme: 'neon-arcade',
    isPreset: true
  },
  {
    id: 'pl-grunge',
    name: '90s Alternative & Grunge Essentials',
    description: 'Pioneering alternative cuts from the golden era of 90s rock',
    songIds: ['alt-1', 'alt-2', 'alt-3', 'alt-4'],
    createdAt: 1715004000000,
    updatedAt: 1715004000000,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    theme: 'rockolas-peru',
    isPreset: true
  }
];

const STORAGE_KEY_CONFIG = 'rockola_config_v3';
const STORAGE_KEY_CUSTOM_SONGS = 'rockola_custom_songs_v3';
const STORAGE_KEY_PLAYLISTS = 'rockola_playlists_v3';
const STORAGE_KEY_FAVORITES = 'rockola_favorite_song_ids_v1';

export function loadConfig(): RockolaConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy Hebrew/ILS settings for Costco Pro
      if (parsed.currencySymbol === '₪') parsed.currencySymbol = '$';
      if (parsed.language === 'he') parsed.language = 'en';
      if (parsed.branding?.marqueeCustomText && /[\u0590-\u05FF]/.test(parsed.branding.marqueeCustomText)) {
        parsed.branding.marqueeCustomText = DEFAULT_BRANDING.marqueeCustomText;
      }
      if (parsed.branding?.title && parsed.branding.title.toUpperCase().includes('TOUCHTUNES')) {
        parsed.branding.title = 'ROCKOLA PRO';
        parsed.branding.subtitle = 'Commercial High Definition Audio Jukebox';
      }
      if (parsed.skin === 'touchtunes-digital') {
        parsed.skin = 'rockolas-peru';
      }
      if (parsed.showCommercialDock === undefined) {
        parsed.showCommercialDock = false;
      }
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        currencySymbol: parsed.currencySymbol === '₪' ? '$' : (parsed.currencySymbol || '$'),
        language: parsed.language === 'he' ? 'en' : (parsed.language || 'en'),
        branding: {
          ...DEFAULT_BRANDING,
          ...(parsed.branding || {})
        },
        keyBindings: {
          ...DEFAULT_KEY_BINDINGS,
          ...(parsed.keyBindings || {})
        }
      };
    }
  } catch (e) {
    console.warn('Failed to load rockola config from localStorage:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: RockolaConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save rockola config to localStorage:', e);
  }
}

export function loadCustomSongs(): Song[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SONGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load custom songs:', e);
  }
  return [];
}

export function saveCustomSongs(songs: Song[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SONGS, JSON.stringify(songs));
  } catch (e) {
    console.warn('Failed to save custom songs:', e);
  }
}

export function loadFavoriteSongIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load favorite song IDs:', e);
  }
  return [];
}

export function saveFavoriteSongIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save favorite song IDs:', e);
  }
}

export function loadPlaylists(): Playlist[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
    if (saved) {
      const parsed: Playlist[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load playlists:', e);
  }
  return DEFAULT_PLAYLISTS;
}

export function savePlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
  } catch (e) {
    console.warn('Failed to save playlists:', e);
  }
}

/**
 * Generate vintage 3-character song code (e.g. A01, A02 ... G99)
 */
export function generateTrackCode(index: number): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const letterIndex = Math.floor(index / 20) % letters.length;
  const numIndex = (index % 20) + 1;
  return `${letters[letterIndex]}${numIndex < 10 ? '0' + numIndex : numIndex}`;
}

/**
 * Creates an exportable JSON package containing full system configuration,
 * machine branding, playlists, custom songs, and key mappings for cloning across jukeboxes.
 */
export function createSystemBackupPackage(config: RockolaConfig, playlists: Playlist[], customSongs: Song[] = []): string {
  const payload = {
    version: '2.4.0',
    exportedAt: Date.now(),
    machineName: config.branding?.title || 'ROCKOLA 24',
    config,
    playlists,
    customSongs
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Validates and extracts data from an imported system backup package JSON.
 */
export function validateAndParseBackupPackage(jsonString: string): {
  success: boolean;
  config?: RockolaConfig;
  playlists?: Playlist[];
  customSongs?: Song[];
  message: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid or corrupt backup package JSON structure' };
    }

    // Check if it's a full package or a legacy playlists file
    if (Array.isArray(data)) {
      // Legacy playlists array
      return {
        success: true,
        playlists: data,
        message: `Loaded ${data.length} playlists successfully!`
      };
    }

    if (data.config || data.playlists) {
      return {
        success: true,
        config: data.config ? { ...DEFAULT_CONFIG, ...data.config } : undefined,
        playlists: Array.isArray(data.playlists) ? data.playlists : undefined,
        customSongs: Array.isArray(data.customSongs) ? data.customSongs : undefined,
        message: `System configuration package for ${data.machineName || 'Jukebox'} restored successfully!`
      };
    }

    return { success: false, message: 'File does not contain valid jukebox configuration parameters' };
  } catch (err) {
    return { success: false, message: 'Error parsing JSON package: ' + (err instanceof Error ? err.message : String(err)) };
  }
}
