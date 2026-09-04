import React from 'react';
import { Home, Search, LayoutGrid, Flame, Camera, MoreHorizontal, Smartphone, Coins, Layers, Film } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { AppLanguage } from '../types/rockola';
import { getTranslation } from '../utils/i18n';

interface TouchTunesCommercialDockProps {
  activeTab: 'home' | 'search' | 'browse' | 'top-played' | 'photobooth' | 'more';
  onSelectTab: (tab: 'home' | 'search' | 'browse' | 'top-played' | 'photobooth' | 'more') => void;
  onOpenCoinModal: () => void;
  onOpenAppPromoModal?: () => void;
  onOpenMediaSources?: () => void;
  queueCount: number;
  language?: AppLanguage;
  title?: string;
}

export const TouchTunesCommercialDock: React.FC<TouchTunesCommercialDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenCoinModal,
  onOpenAppPromoModal,
  onOpenMediaSources,
  queueCount,
  language = 'en',
  title
}) => {
  return (
    <div className="w-full bg-[#05070e] border-t border-cyan-500/30 px-3 md:px-8 py-2 relative z-20 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        
        {/* Left: Glowing Illuminated Logo */}
        <div className="flex items-center gap-3">
          <div className="font-chakra font-black text-lg sm:text-xl text-white tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] flex items-center gap-1.5">
            <span className="text-white">{title || 'ROCKOLA'}</span>
            <span className="text-cyan-400">24/7</span>
          </div>
        </div>

        {/* Center: Exact TouchTunes Screen Navigation Tabs (Photo 1 Matching) */}
        <div className="flex items-center gap-1 sm:gap-2 bg-black/80 p-1 rounded-xl border border-white/10 shadow-inner">
          
          {/* HOME Tab (Solid cyan active square) */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('home');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'home'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Home"
          >
            <Home className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs uppercase">{getTranslation('classic', language)}</span>
          </button>

          {/* SEARCH Tab */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('search');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'search'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Search"
          >
            <Search className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs uppercase">{getTranslation('search', language)}</span>
          </button>

          {/* BROWSE Tab */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('browse');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'browse'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Browse"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs uppercase">{getTranslation('catalog', language)}</span>
          </button>

          {/* TOP PLAYS Tab */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('top-played');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'top-played'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Top Plays"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs uppercase">{getTranslation('carousel', language)}</span>
          </button>

          {/* PHOTO BOOTH Tab */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('photobooth');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all hidden md:flex ${
              activeTab === 'photobooth'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Photo Booth"
          >
            <Camera className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs">PHOTO BOOTH</span>
          </button>

          {/* MEDIA SOURCES (Music & Video source selector) */}
          {onOpenMediaSources && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onOpenMediaSources();
              }}
              className="px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              title="Media Source & Video Options"
            >
              <Film className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] sm:text-xs uppercase">SOURCES</span>
            </button>
          )}

          {/* MORE Tab */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onSelectTab('more');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-chakra font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'more'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs uppercase">{getTranslation('serviceMenu', language)}</span>
          </button>

        </div>

        {/* Right: Phone Promo Pill */}
        <button
          onClick={onOpenCoinModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-cyan-900/60 hover:from-blue-800 hover:to-cyan-800 border border-cyan-400/40 text-white cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] group"
          title="Play from Mobile Phone or Get Credits"
        >
          <div className="w-6 h-8 rounded border-2 border-cyan-300 flex items-center justify-center bg-black group-hover:scale-105 transition-transform">
            <div className="w-3.5 h-5 rounded-[2px] bg-cyan-400/80" />
          </div>

          <div className="flex flex-col items-start text-left font-chakra leading-none">
            <span className="text-[9px] font-black text-cyan-300 uppercase tracking-tighter">
              {getTranslation('mobileRemote', language)}
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-tight">
              FROM YOUR PHONE
            </span>
            <span className="text-[8px] text-gray-300 font-bold underline mt-0.5">
              GET THE APP
            </span>
          </div>
        </button>

      </div>
    </div>
  );
};
