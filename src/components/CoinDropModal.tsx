import React from 'react';
import { Coins, X, Sparkles, Zap } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { RockolaConfig } from '../types/rockola';
import { getTranslation } from '../utils/i18n';

interface CoinDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCoin: (amount: number) => void;
  onToggleFreePlay: () => void;
  config: RockolaConfig;
}

export const CoinDropModal: React.FC<CoinDropModalProps> = ({
  isOpen,
  onClose,
  onInsertCoin,
  onToggleFreePlay,
  config
}) => {
  if (!isOpen) return null;

  const handleCoinClick = (coins: number) => {
    soundEffects.playCoinDrop();
    onInsertCoin(coins);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.9)] text-center relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10 hover:border-amber-400 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Coins className="w-7 h-7 text-amber-500" />
        </div>

        <h2 className="font-bold text-xl md:text-2xl text-white tracking-wide uppercase">
          {getTranslation('insertCoin', config.language)} / BILL ACCEPTOR
        </h2>
        <p className="text-xs text-gray-400 font-chakra mt-1">
          Click a coin denomination below or press keyboard <kbd className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-amber-400 font-mono font-bold border border-white/10">5</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-amber-400 font-mono font-bold border border-white/10">C</kbd>
        </p>

        {/* Current Balance */}
        <div className="bg-[#0A0A0A] rounded-xl p-4 my-5 border border-white/10 shadow-inner flex items-center justify-around">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{getTranslation('credits', config.language)}</span>
            <div className="font-mono text-3xl font-bold text-amber-400">
              {config.freePlay ? getTranslation('freePlay', config.language) : config.credits}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">SONGS PER CREDIT</span>
            <div className="font-mono text-3xl font-bold text-white">
              {config.songsPerCredit}
            </div>
          </div>
        </div>

        {/* Coin Selection Buttons */}
        <div className="grid grid-cols-2 gap-3 my-4">
          
          <button
            onClick={() => handleCoinClick(1)}
            className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-black" />
            <span>+1 Coin ({config.currencySymbol}1)</span>
          </button>

          <button
            onClick={() => handleCoinClick(2)}
            className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-black" />
            <span>+2 Coins ({config.currencySymbol}2)</span>
          </button>

          <button
            onClick={() => handleCoinClick(5)}
            className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>+5 Coins ({config.currencySymbol}5)</span>
          </button>

          <button
            onClick={onToggleFreePlay}
            className={`p-3.5 rounded-xl font-chakra font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border ${
              config.freePlay
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-[#1C1C1C] hover:bg-[#252525] text-gray-200 border-white/10'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{config.freePlay ? '✓ FREE PLAY ACTIVE' : 'TOGGLE FREE PLAY'}</span>
          </button>

        </div>

        {/* Finish Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#1C1C1C] hover:bg-amber-500 hover:text-black text-white border border-white/10 hover:border-amber-400 font-chakra font-bold text-sm shadow-md transition-all cursor-pointer mt-2"
        >
          Return to Jukebox
        </button>

      </div>
    </div>
  );
};
