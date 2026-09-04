import { SkinType } from '../types/rockola';

export interface ThemeDefinition {
  id: SkinType;
  nameHe: string;
  nameEn: string;
  subtitleHe: string;
  subtitleEn: string;
  badge: string;
  iconType: string;
  bgGradient: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  primaryAccent: string;
  primaryAccentHover: string;
  primaryAccentText: string;
  accentGlow: string;
  highlightBorder: string;
  badgeBg: string;
  badgeText: string;
  vinylCenterColor: string;
  tickerTextColor: string;
  decorBanner: string;
  fontFamilyClass: string;
  fontFamilyName: string;
  customColors?: {
    primaryHex: string;
    secondaryHex: string;
    bgHex: string;
    tickerHex?: string;
  };
}

export const THEMES: Record<SkinType, ThemeDefinition> = {
  'touchtunes-digital': {
    id: 'touchtunes-digital',
    nameHe: 'Digital Kiosk HD',
    nameEn: 'Digital Kiosk HD',
    subtitleHe: 'Electric blue dot-matrix EQ, 3D Cover Flow carousel & commercial bar dock',
    subtitleEn: 'Electric blue dot-matrix EQ, 3D Cover Flow carousel & commercial bar dock',
    badge: '🎵 DIGITAL KIOSK',
    iconType: 'Kiosk',
    bgGradient: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#581c87]/50 via-[#0a071b] to-[#031525]',
    headerBg: 'bg-[#090b14]/95 border-b border-cyan-500/30',
    headerBorder: 'border-cyan-500/30',
    cardBg: 'bg-[#0c0f1d]/90 backdrop-blur-md',
    cardBorder: 'border-cyan-500/30',
    primaryAccent: 'bg-cyan-500 hover:bg-cyan-400',
    primaryAccentHover: 'hover:bg-cyan-400',
    primaryAccentText: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.45)]',
    highlightBorder: 'border-cyan-400',
    badgeBg: 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/50',
    badgeText: 'text-cyan-300',
    vinylCenterColor: 'bg-gradient-to-tr from-cyan-600 to-pink-500',
    tickerTextColor: 'text-cyan-300',
    decorBanner: '⚡ DIGITAL JUKEBOX 2026 • 5-BUTTON & TOUCH COMPATIBLE • LIVE EQUALIZER',
    fontFamilyClass: 'font-chakra',
    fontFamilyName: 'Chakra Petch (Tech Digital)'
  },
  'wild-west': {
    id: 'wild-west',
    nameHe: 'Wild West Saloon',
    nameEn: 'Wild West Saloon',
    subtitleHe: 'Saloon wood, warm brass, whiskey hues & frontier vibe',
    subtitleEn: 'Saloon wood, warm brass, whiskey hues & frontier vibe',
    badge: '🤠 SALOON',
    iconType: 'Saloon',
    bgGradient: 'bg-gradient-to-br from-[#1b1007] via-[#100904] to-[#080402]',
    headerBg: 'bg-[#1a0f07] border-b-2 border-[#8b5a2b]',
    headerBorder: 'border-[#a67c52]/40',
    cardBg: 'bg-[#150d06]/95',
    cardBorder: 'border-[#784d28]/60',
    primaryAccent: 'bg-[#d97706] hover:bg-[#b45309]',
    primaryAccentHover: 'hover:bg-[#b45309]',
    primaryAccentText: 'text-[#f59e0b]',
    accentGlow: 'shadow-[0_0_25px_rgba(217,119,6,0.35)]',
    highlightBorder: 'border-[#f59e0b]',
    badgeBg: 'bg-[#78350f] text-[#fde68a] border border-[#d97706]',
    badgeText: 'text-[#fef3c7]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#92400e] to-[#b45309]',
    tickerTextColor: 'text-[#fbbf24]',
    decorBanner: '🤠 WILD WEST SALOON JUKEBOX • FRONTIER VINTAGE 45 RPM',
    fontFamilyClass: 'font-rye',
    fontFamilyName: 'Rye (Wild West Saloon Serif)'
  },
  'salsa-latino': {
    id: 'salsa-latino',
    nameHe: 'Havana Salsa Fiesta',
    nameEn: 'Havana Salsa Fiesta',
    subtitleHe: 'Fiery tropical flame, Havana club brass & Latin groove',
    subtitleEn: 'Fiery tropical flame, Havana club brass & Latin groove',
    badge: '💃 SALSA',
    iconType: 'Salsa',
    bgGradient: 'bg-gradient-to-br from-[#1a0707] via-[#0d0408] to-[#041212]',
    headerBg: 'bg-[#180509] border-b-2 border-[#e11d48]',
    headerBorder: 'border-[#f43f5e]/40',
    cardBg: 'bg-[#13060a]/95',
    cardBorder: 'border-[#be123c]/50',
    primaryAccent: 'bg-[#f97316] hover:bg-[#ea580c]',
    primaryAccentHover: 'hover:bg-[#ea580c]',
    primaryAccentText: 'text-[#fb923c]',
    accentGlow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    highlightBorder: 'border-[#f97316]',
    badgeBg: 'bg-[#881337] text-[#ffe4e6] border border-[#f43f5e]',
    badgeText: 'text-[#ffedd5]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#e11d48] to-[#f97316]',
    tickerTextColor: 'text-[#fdba74]',
    decorBanner: '💃 HAVANA SALSA CLUB • ROCKOLA TROPICAL PERU & LATINO HITS',
    fontFamilyClass: 'font-outfit',
    fontFamilyName: 'Outfit (Tropical Latin Groove)'
  },
  'heavy-rock': {
    id: 'heavy-rock',
    nameHe: 'Heavy Metal & Rock Amp',
    nameEn: 'Heavy Metal & Rock Amp',
    subtitleHe: 'Amplifier steel grill, electric crimson fire & rock spirit',
    subtitleEn: 'Amplifier steel grill, electric crimson fire & rock spirit',
    badge: '🎸 METAL',
    iconType: 'Rock',
    bgGradient: 'bg-gradient-to-br from-[#120305] via-[#0a0a0a] to-[#140003]',
    headerBg: 'bg-[#0f0406] border-b-2 border-[#dc2626]',
    headerBorder: 'border-[#ef4444]/40',
    cardBg: 'bg-[#110507]/95',
    cardBorder: 'border-[#991b1b]/60',
    primaryAccent: 'bg-[#dc2626] hover:bg-[#b91c1c]',
    primaryAccentHover: 'hover:bg-[#b91c1c]',
    primaryAccentText: 'text-[#ef4444]',
    accentGlow: 'shadow-[0_0_25px_rgba(220,38,38,0.45)]',
    highlightBorder: 'border-[#ef4444]',
    badgeBg: 'bg-[#7f1d1d] text-[#fee2e2] border border-[#ef4444]',
    badgeText: 'text-[#fee2e2]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#7f1d1d] to-[#dc2626]',
    tickerTextColor: 'text-[#f87171]',
    decorBanner: '⚡ HEAVY METAL & ROCK VAULT • CRANK IT TO 11 • 5-BUTTON DECK',
    fontFamilyClass: 'font-metal',
    fontFamilyName: 'Permanent Marker (Heavy Metal Thrash)'
  },
  'classic-wood': {
    id: 'classic-wood',
    nameHe: 'Wurlitzer 50s Vinyl',
    nameEn: 'Wurlitzer 50s Vinyl',
    subtitleHe: 'Vintage 1950s chrome arches, bubble tubes & golden warmth',
    subtitleEn: 'Vintage 1950s chrome arches, bubble tubes & golden warmth',
    badge: '📻 RETRO 50s',
    iconType: 'Vintage',
    bgGradient: 'bg-gradient-to-br from-[#160d05] via-[#0d0702] to-[#120803]',
    headerBg: 'bg-[#1c0f05] border-b-2 border-[#d97706]',
    headerBorder: 'border-[#b45309]/50',
    cardBg: 'bg-[#140b04]/95',
    cardBorder: 'border-[#92400e]/50',
    primaryAccent: 'bg-[#f59e0b] hover:bg-[#d97706]',
    primaryAccentHover: 'hover:bg-[#d97706]',
    primaryAccentText: 'text-[#fbbf24]',
    accentGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
    highlightBorder: 'border-[#fbbf24]',
    badgeBg: 'bg-[#78350f] text-[#fef3c7] border border-[#d97706]',
    badgeText: 'text-[#fef3c7]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#b45309] to-[#f59e0b]',
    tickerTextColor: 'text-[#fde68a]',
    decorBanner: '♫ WURLITZER CLASSIC 1950s JUKEBOX • AUTHENTIC BUBBLE LIGHTS',
    fontFamilyClass: 'font-righteous',
    fontFamilyName: 'Righteous (50s Retro Wurlitzer)'
  },
  'neon-arcade': {
    id: 'neon-arcade',
    nameHe: 'Cyber Synthwave 80s',
    nameEn: 'Cyber Synthwave 80s',
    subtitleHe: 'Vibrant magenta, laser cyan & retro arcade neon glow',
    subtitleEn: 'Vibrant magenta, laser cyan & retro arcade neon glow',
    badge: '🕹️ 80s NEON',
    iconType: 'Neon',
    bgGradient: 'bg-gradient-to-br from-[#140224] via-[#060112] to-[#011424]',
    headerBg: 'bg-[#0f021c] border-b-2 border-[#d946ef]',
    headerBorder: 'border-[#ec4899]/40',
    cardBg: 'bg-[#0d0218]/95',
    cardBorder: 'border-[#a21caf]/60',
    primaryAccent: 'bg-[#d946ef] hover:bg-[#c026d3]',
    primaryAccentHover: 'hover:bg-[#c026d3]',
    primaryAccentText: 'text-[#f0abfc]',
    accentGlow: 'shadow-[0_0_30px_rgba(217,70,239,0.5)]',
    highlightBorder: 'border-[#06b6d4]',
    badgeBg: 'bg-[#701a75] text-[#fae8ff] border border-[#d946ef]',
    badgeText: 'text-[#fae8ff]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#c026d3] to-[#06b6d4]',
    tickerTextColor: 'text-[#67e8f9]',
    decorBanner: '★ CYBER ARCADE 1984 • SYNTHWAVE LASER JUKEBOX MATRIX ★',
    fontFamilyClass: 'font-arcade',
    fontFamilyName: 'VT323 (80s Cyber Synthwave Matrix)'
  },
  'rockolas-peru': {
    id: 'rockolas-peru',
    nameHe: 'Rockolas Peru HD',
    nameEn: 'Rockolas Peru HD',
    subtitleHe: 'Refined obsidian luxury with polished golden accents',
    subtitleEn: 'Refined obsidian luxury with polished golden accents',
    badge: '💎 ROCKOLA',
    iconType: 'Classic',
    bgGradient: 'bg-[#0A0A0A]',
    headerBg: 'bg-[#141414] border-b border-white/10',
    headerBorder: 'border-white/10',
    cardBg: 'bg-[#141414]',
    cardBorder: 'border-white/10',
    primaryAccent: 'bg-amber-500 hover:bg-amber-400',
    primaryAccentHover: 'hover:bg-amber-400',
    primaryAccentText: 'text-amber-400',
    accentGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    highlightBorder: 'border-amber-500',
    badgeBg: 'bg-[#1C1C1C] text-amber-400 border border-white/10',
    badgeText: 'text-amber-400',
    vinylCenterColor: 'bg-amber-500',
    tickerTextColor: 'text-amber-300',
    decorBanner: '★ ROCKOLA DIGITAL JUKEBOX HD • 5-BUTTON LEGACY HARDWARE',
    fontFamilyClass: 'font-playfair',
    fontFamilyName: 'Playfair Display (Refined Obsidian)'
  },
  'elegant-dark': {
    id: 'elegant-dark',
    nameHe: 'Elegant Dark HD',
    nameEn: 'Elegant Dark HD',
    subtitleHe: 'Refined obsidian luxury with polished golden accents',
    subtitleEn: 'Refined obsidian luxury with polished golden accents',
    badge: '💎 ELEGANT',
    iconType: 'Classic',
    bgGradient: 'bg-[#0A0A0A]',
    headerBg: 'bg-[#141414] border-b border-white/10',
    headerBorder: 'border-white/10',
    cardBg: 'bg-[#141414]',
    cardBorder: 'border-white/10',
    primaryAccent: 'bg-amber-500 hover:bg-amber-400',
    primaryAccentHover: 'hover:bg-amber-400',
    primaryAccentText: 'text-amber-400',
    accentGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    highlightBorder: 'border-amber-500',
    badgeBg: 'bg-[#1C1C1C] text-amber-400 border border-white/10',
    badgeText: 'text-amber-400',
    vinylCenterColor: 'bg-amber-500',
    tickerTextColor: 'text-amber-300',
    decorBanner: '★ ROCKOLA DIGITAL JUKEBOX HD • 5-BUTTON LEGACY HARDWARE',
    fontFamilyClass: 'font-jakarta',
    fontFamilyName: 'Plus Jakarta Sans (Modern Luxury)'
  },
  'cyber-2026': {
    id: 'cyber-2026',
    nameHe: 'Modern Kiosk 2026',
    nameEn: 'Modern Kiosk 2026',
    subtitleHe: 'High-tech clean kiosk interface for touch & modern displays',
    subtitleEn: 'High-tech clean kiosk interface for touch & modern displays',
    badge: '🚀 KIOSK',
    iconType: 'Kiosk',
    bgGradient: 'bg-gradient-to-br from-[#05111f] via-[#050912] to-[#040e1a]',
    headerBg: 'bg-[#081526] border-b-2 border-[#0284c7]',
    headerBorder: 'border-[#38bdf8]/40',
    cardBg: 'bg-[#071322]/95',
    cardBorder: 'border-[#0369a1]/50',
    primaryAccent: 'bg-[#0ea5e9] hover:bg-[#0284c7]',
    primaryAccentHover: 'hover:bg-[#0284c7]',
    primaryAccentText: 'text-[#38bdf8]',
    accentGlow: 'shadow-[0_0_25px_rgba(14,165,233,0.4)]',
    highlightBorder: 'border-[#38bdf8]',
    badgeBg: 'bg-[#0c4a6e] text-[#e0f2fe] border border-[#0ea5e9]',
    badgeText: 'text-[#e0f2fe]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#0369a1] to-[#38bdf8]',
    tickerTextColor: 'text-[#7dd3fc]',
    decorBanner: '🚀 DIGITAL ROCKOLA 2026 HD • UBUNTU 24.04 & WINDOWS KIOSK',
    fontFamilyClass: 'font-orbitron',
    fontFamilyName: 'Orbitron (Futuristic Kiosk)'
  },
  'vintage-vinyl': {
    id: 'vintage-vinyl',
    nameHe: 'Vintage Vinyl Lounge',
    nameEn: 'Vintage Vinyl Lounge',
    subtitleHe: 'Warm jazz & blues lounge, analog warmth and vinyl crackle',
    subtitleEn: 'Warm jazz & blues lounge, analog warmth and vinyl crackle',
    badge: '🎷 VINYL',
    iconType: 'Vinyl',
    bgGradient: 'bg-gradient-to-br from-[#17130f] via-[#0c0a08] to-[#120f0c]',
    headerBg: 'bg-[#1d1712] border-b-2 border-[#a8824f]',
    headerBorder: 'border-[#c5a059]/40',
    cardBg: 'bg-[#15110d]/95',
    cardBorder: 'border-[#8c6b3e]/50',
    primaryAccent: 'bg-[#c5a059] hover:bg-[#a8824f]',
    primaryAccentHover: 'hover:bg-[#a8824f]',
    primaryAccentText: 'text-[#dfc282]',
    accentGlow: 'shadow-[0_0_20px_rgba(197,160,89,0.35)]',
    highlightBorder: 'border-[#c5a059]',
    badgeBg: 'bg-[#42341e] text-[#faedd4] border border-[#a8824f]',
    badgeText: 'text-[#faedd4]',
    vinylCenterColor: 'bg-gradient-to-tr from-[#8c6b3e] to-[#c5a059]',
    tickerTextColor: 'text-[#faedd4]',
    decorBanner: '🎷 ANALOG VINYL LOUNGE • 45 RPM STEREO MASTER • ROCKOLA',
    fontFamilyClass: 'font-cinzel',
    fontFamilyName: 'Cinzel (Analog Jazz Lounge)'
  },
  'custom': {
    id: 'custom',
    nameHe: 'Personalized Custom Theme',
    nameEn: 'Personalized Custom Theme',
    subtitleHe: 'Custom venue color palette generated from hex codes',
    subtitleEn: 'Custom venue color palette generated from hex codes',
    badge: '🎨 CUSTOM HEX',
    iconType: 'Kiosk',
    bgGradient: 'bg-[#080b18]',
    headerBg: 'bg-[#090b14]/95 border-b border-cyan-500/30',
    headerBorder: 'border-cyan-500/30',
    cardBg: 'bg-[#0c0f1d]/90 backdrop-blur-md',
    cardBorder: 'border-cyan-500/30',
    primaryAccent: 'bg-cyan-500 hover:bg-cyan-400',
    primaryAccentHover: 'hover:bg-cyan-400',
    primaryAccentText: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.45)]',
    highlightBorder: 'border-cyan-400',
    badgeBg: 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/50',
    badgeText: 'text-cyan-300',
    vinylCenterColor: 'bg-gradient-to-tr from-cyan-600 to-pink-500',
    tickerTextColor: 'text-cyan-300',
    decorBanner: '🎨 CUSTOM HEX COLOR PALETTE • 5-BUTTON LEGACY HARDWARE',
    fontFamilyClass: 'font-chakra',
    fontFamilyName: 'Chakra Petch (Tech Digital)',
    customColors: {
      primaryHex: '#06b6d4',
      secondaryHex: '#a855f7',
      bgHex: '#080b18',
      tickerHex: '#22d3ee'
    }
  }
};

export function generateCustomTheme(
  primaryHex: string = '#06b6d4',
  secondaryHex: string = '#a855f7',
  bgHex: string = '#080b18',
  tickerHex: string = '#22d3ee',
  themeName: string = 'Custom Hex Theme'
): ThemeDefinition {
  return {
    id: 'custom',
    nameHe: themeName,
    nameEn: themeName,
    subtitleHe: 'Custom venue color scheme automatically generated from hex codes',
    subtitleEn: 'Custom venue color scheme automatically generated from hex codes',
    badge: '🎨 CUSTOM HEX',
    iconType: 'Kiosk',
    bgGradient: 'bg-[#080b18]',
    headerBg: 'bg-[#090b14]/95 border-b border-white/10',
    headerBorder: 'border-white/15',
    cardBg: 'bg-[#0d091a]/90 backdrop-blur-md',
    cardBorder: 'border-white/15',
    primaryAccent: 'bg-cyan-500 hover:bg-cyan-400',
    primaryAccentHover: 'hover:bg-cyan-400',
    primaryAccentText: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.45)]',
    highlightBorder: 'border-cyan-400',
    badgeBg: 'bg-black/60 text-cyan-300 border border-white/20',
    badgeText: 'text-cyan-300',
    vinylCenterColor: 'bg-gradient-to-tr from-cyan-600 to-purple-600',
    tickerTextColor: 'text-cyan-300',
    decorBanner: `★ ${themeName.toUpperCase()} • CUSTOM HEX PALETTE JUKEBOX`,
    fontFamilyClass: 'font-chakra',
    fontFamilyName: 'Chakra Petch (Tech Digital)',
    customColors: {
      primaryHex,
      secondaryHex,
      bgHex,
      tickerHex
    }
  };
}

export function getTheme(skin?: SkinType | string, customTheme?: ThemeDefinition | null): ThemeDefinition {
  if (skin === 'custom' && customTheme) {
    return customTheme;
  }
  if (skin && skin in THEMES) {
    return THEMES[skin as SkinType];
  }
  return THEMES['rockolas-peru'];
}
