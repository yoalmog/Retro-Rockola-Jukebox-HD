import React, { useState, useEffect } from 'react';
import { RockolaConfig, Song } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { getTranslation } from '../utils/i18n';
import { Coins, Settings, Maximize, HelpCircle, Volume2, VolumeX, ChevronLeft, Music, Smartphone, Sparkles } from 'lucide-react';
import { TopAuroraSoundWave } from './TopAuroraSoundWave';

interface HeaderMarqueeProps {
  config: RockolaConfig;
  onOpenCoinModal: () => void;
  onOpenServiceMenu: () => void;
  onOpenHelp: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  currentSongTitle?: string;
  currentSong?: Song | null;
  isPlaying?: boolean;
}

export const HeaderMarquee: React.FC<HeaderMarqueeProps> = ({
  config,
  onOpenCoinModal,
  onOpenServiceMenu,
  onOpenHelp,
  onToggleMute,
  isMuted,
  currentSongTitle,
  currentSong,
  isPlaying = false
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const theme = getTheme(config.skin);

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full flex flex-col relative z-20 select-none shadow-2xl">
      
      {/* 2. Top Commercial Header Bar (Only rendered when enabled in Settings) */}
      {config.showHeaderBar && (
        <div className="w-full bg-[#080b16]/95 border-b border-cyan-500/30 px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Mini Now Playing Preview Pill */}
            <div className="flex items-center gap-2 min-w-0 max-w-[260px] sm:max-w-[320px]">
              {/* Back Chevron Icon */}
              <button
                onClick={onOpenHelp}
                className="w-8 h-8 rounded-lg bg-black/70 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                title="Help & Arcade Controls Guide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Song Cover Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-black border border-cyan-500/40 overflow-hidden shrink-0 shadow-md flex items-center justify-center relative">
                {currentSong?.coverArt ? (
                  <img src={currentSong.coverArt} alt="Album Art" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-5 h-5 text-cyan-400" />
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-cyan-500/15 animate-pulse pointer-events-none" />
                )}
              </div>

              {/* Title & Artist Text */}
              <div className="min-w-0">
                <div className="text-[10px] font-chakra font-black tracking-widest text-cyan-400 uppercase flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                  {getTranslation('nowPlaying', config.language)}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white truncate font-chakra leading-tight mt-0.5">
                  {currentSong ? currentSong.title : 'Ready to Play'}
                </div>
                <div className="text-[10px] text-gray-400 truncate leading-none">
                  {currentSong ? currentSong.artist : 'Select track with 5-Btn Deck or Touch'}
                </div>
              </div>
            </div>

            {/* Center: Magenta / Violet Promo Banner (Only when enabled in settings) */}
            {config.showPromoBanner && (
              <div className="flex-1 max-w-lg mx-2 hidden sm:flex items-center justify-center">
                <button
                  onClick={onOpenCoinModal}
                  className="w-full bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] hover:from-[#a855f7] hover:to-[#f43f5e] text-white px-3 py-1.5 rounded-xl border border-pink-300/40 shadow-[0_0_20px_rgba(217,70,239,0.45)] flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98 group"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-pink-200 group-hover:rotate-12 transition-transform" />
                    <span className="font-chakra font-black text-xs md:text-sm tracking-wider uppercase drop-shadow">
                      {getTranslation('mobileRemote', config.language)}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-chakra font-black uppercase text-pink-100 border border-white/30 shadow">
                    get the app
                  </span>
                </button>
              </div>
            )}

            {/* Right: Circular White Ring Credit Badge + Tools */}
            <div className="flex items-center gap-2.5 shrink-0">
              
              {/* White Circular Ring Credit Badge */}
              <button
                onClick={onOpenCoinModal}
                className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-black/70 border border-white/20 hover:border-cyan-400 transition-all cursor-pointer group shadow-lg"
                title="Insert Coins & Bills (Press 5 or C)"
              >
                {/* Circular Ring with Credit Number */}
                <div className="w-9 h-9 rounded-full border-2 border-white flex flex-col items-center justify-center leading-none group-hover:border-cyan-400 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  <span className="text-sm font-black font-mono text-white">
                    {config.freePlay ? '∞' : config.credits}
                  </span>
                  <span className="text-[7px] font-bold font-chakra text-gray-300 uppercase tracking-tighter">
                    {config.freePlay ? getTranslation('freePlay', config.language) : getTranslation('credits', config.language)}
                  </span>
                </div>

                {/* Sub-pricing tiers */}
                <div className="hidden md:flex flex-col items-start text-left leading-tight font-chakra">
                  <span className="text-[10px] font-bold text-gray-200">2 for {config.currencySymbol}5.00</span>
                  <span className="text-[9px] text-cyan-400 font-medium">12 for {config.currencySymbol}20.00</span>
                </div>
              </button>

              {/* Quick Utility Tools */}
              <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                
                {/* Mute Button */}
                <button
                  onClick={onToggleMute}
                  className="p-1.5 rounded-lg bg-[#141828] border border-white/10 hover:border-cyan-400 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullScreen}
                  className="p-1.5 rounded-lg bg-[#141828] border border-white/10 hover:border-cyan-400 text-gray-400 hover:text-white transition-colors cursor-pointer hidden md:block"
                  title="Toggle Fullscreen (F11)"
                >
                  <Maximize className="w-4 h-4" />
                </button>

                {/* Service / Tech Settings */}
                <button
                  onClick={onOpenServiceMenu}
                  className="px-2 py-1.5 rounded-lg bg-[#141828] border border-white/10 hover:border-amber-400 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                  title="Service & Operator Settings (F2 / Tab)"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-amber-400/80">F2</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </header>
  );
};
