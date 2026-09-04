import React, { useEffect } from 'react';
import { Sparkles, Coins, Disc3, Play } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface AttractModeProps {
  onDismiss: () => void;
  onInsertCoin: () => void;
  credits: number;
  freePlay: boolean;
}

export const AttractMode: React.FC<AttractModeProps> = ({
  onDismiss,
  credits,
  freePlay
}) => {
  useEffect(() => {
    const handleAnyKey = () => {
      soundEffects.playButtonClick();
      onDismiss();
    };

    window.addEventListener('keydown', handleAnyKey);
    window.addEventListener('pointerdown', handleAnyKey);
    return () => {
      window.removeEventListener('keydown', handleAnyKey);
      window.removeEventListener('pointerdown', handleAnyKey);
    };
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 bg-[#05070f] z-[100] flex flex-col items-center justify-between p-4 sm:p-8 select-none cursor-pointer overflow-hidden touch-manipulation"
      style={{ opacity: 1 }}
    >
      {/* Background Animated Amber & Cyan Glow Spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Top Banner */}
      <div className="text-center mt-2 sm:mt-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-2 shadow-md">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>ROCKOLA DIGITAL JUKEBOX ARCADE</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>
        <h1 className="font-chakra font-black text-3xl sm:text-5xl md:text-7xl text-amber-400 tracking-wider drop-shadow-[0_0_25px_rgba(245,158,11,0.55)]">
          COSTCO PRO JUKEBOX
        </h1>
        <p className="text-gray-300 font-chakra text-xs sm:text-sm mt-1 max-w-md mx-auto">
          5-Button Hardware Compatible • Touchscreen & Keyboard • Coin & Bill Acceptor
        </p>
      </div>

      {/* Centerpiece / Vinyl Rotating Record Animation */}
      <div className="flex flex-col items-center justify-center my-auto py-2 z-10">
        <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-black via-[#161616] to-[#0A0A0A] border-4 border-amber-500/50 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
          
          <div className="absolute inset-3 sm:inset-4 rounded-full border border-white/10"></div>
          <div className="absolute inset-6 sm:inset-8 rounded-full border border-white/10"></div>
          <div className="absolute inset-9 sm:inset-12 rounded-full border border-white/10"></div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-amber-500 border-4 border-black flex flex-col items-center justify-center text-center p-1.5 shadow-inner">
            <span className="font-bold text-[10px] sm:text-xs text-black uppercase tracking-wider font-chakra">PRO JUKEBOX</span>
            <span className="text-[7px] sm:text-[8px] font-mono text-black/80 font-bold">45 RPM</span>
            <div className="w-2.5 h-2.5 rounded-full bg-black mt-0.5"></div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-2xl bg-[#0e1220] border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.35)] animate-bounce text-center max-w-sm sm:max-w-md">
          <span className="font-chakra font-black text-base sm:text-xl md:text-2xl text-amber-400 tracking-wider block">
            {freePlay ? 'TOUCH SCREEN TO SELECT TRACK' : 'INSERT COIN OR BILL TO PLAY (PRESS 5)'}
          </span>
          <div className="text-xs sm:text-sm font-chakra font-medium text-gray-200 mt-0.5">
            {freePlay ? 'Touch screen or press directional button to choose song' : 'Insert coin / press C or touch screen to start'}
          </div>
        </div>
      </div>

      {/* Bottom Status bar */}
      <div className="w-full max-w-xl flex items-center justify-between text-xs font-chakra text-gray-300 border-t border-white/15 pt-3 pb-1 z-10">
        <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Credits: {freePlay ? 'FREE PLAY' : credits}</span>
        </div>

        <div className="text-gray-400 font-chakra text-[11px] sm:text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Touch anywhere to exit</span>
        </div>
      </div>

    </div>
  );
};
