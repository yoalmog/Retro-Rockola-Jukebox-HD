import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Coins, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { KeyBindings } from '../types/rockola';

interface TouchTunesLowerCabinetProps {
  onPressButton: (action: 'up' | 'down' | 'left' | 'right' | 'select' | 'coin') => void;
  activeButton: string | null;
  keyBindings: KeyBindings;
  credits: number;
  freePlay: boolean;
  currencySymbol: string;
  lowCreditNudgeEnabled?: boolean;
  lowCreditNudgeStyle?: 'pulse' | 'blink' | 'glow';
}

export const TouchTunesLowerCabinet: React.FC<TouchTunesLowerCabinetProps> = ({
  onPressButton,
  activeButton,
  keyBindings,
  credits,
  freePlay,
  currencySymbol,
  lowCreditNudgeEnabled = true,
  lowCreditNudgeStyle = 'pulse'
}) => {
  const [isCoinDropping, setIsCoinDropping] = useState(false);
  const [showButtonsPanel, setShowButtonsPanel] = useState(true);

  // Check if credits are below 3 and not on free play to trigger visual notification nudge
  const isLowCredit = !freePlay && credits < 3 && lowCreditNudgeEnabled;

  const handleCoinInsert = () => {
    setIsCoinDropping(true);
    soundEffects.playCoinDrop();
    onPressButton('coin');
    setTimeout(() => setIsCoinDropping(false), 800);
  };

  const handlePress = (action: 'up' | 'down' | 'left' | 'right' | 'select' | 'coin') => {
    if (action === 'coin') {
      handleCoinInsert();
    } else {
      soundEffects.playButtonClick();
      onPressButton(action);
    }
  };

  return (
    <div className="w-full relative z-30 select-none bg-[#070a14] border-t-2 border-cyan-500 shadow-[0_-15px_35px_rgba(6,182,212,0.3)]">
      
      {/* 1. Glowing Electric-Blue LED Horizon Divider Line (Photo 1 Matching) */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)]" />

      {/* 2. Lower Cabinet Body with Textured Matte Black Finish & Coin Mech */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        
        {/* Left Side: Arcade 5-Button Hardware Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowButtonsPanel(p => !p)}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-400 text-xs font-chakra font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow"
              title="Toggle Arcade Controller Panel"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>5-Button Hardware Controller</span>
              {showButtonsPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showButtonsPanel && (
            <div className="flex items-center gap-2 bg-black/80 p-2 rounded-2xl border border-white/10 shadow-inner">
              
              {/* Directional 4-Way Buttons */}
              <div className="flex items-center gap-1">
                {/* LEFT */}
                <button
                  onMouseDown={() => handlePress('left')}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center font-bold transition-all cursor-pointer ${
                    activeButton === 'left'
                      ? 'bg-cyan-400 text-black scale-95 shadow-[0_0_15px_rgba(6,182,212,0.9)] border-2 border-white'
                      : 'bg-[#121624] text-gray-300 border border-white/10 hover:border-cyan-400 hover:text-cyan-300 active:scale-95'
                  }`}
                  title="Left (ArrowLeft / A)"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[7px] font-mono">LEFT</span>
                </button>

                {/* UP & DOWN STACK */}
                <div className="flex flex-col gap-1">
                  <button
                    onMouseDown={() => handlePress('up')}
                    className={`w-10 h-5 sm:w-11 sm:h-5 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer ${
                      activeButton === 'up'
                        ? 'bg-cyan-400 text-black scale-95 shadow-[0_0_15px_rgba(6,182,212,0.9)]'
                        : 'bg-[#121624] text-gray-300 border border-white/10 hover:border-cyan-400 hover:text-cyan-300 active:scale-95'
                    }`}
                    title="Up (ArrowUp / W)"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    onMouseDown={() => handlePress('down')}
                    className={`w-10 h-5 sm:w-11 sm:h-5 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer ${
                      activeButton === 'down'
                        ? 'bg-cyan-400 text-black scale-95 shadow-[0_0_15px_rgba(6,182,212,0.9)]'
                        : 'bg-[#121624] text-gray-300 border border-white/10 hover:border-cyan-400 hover:text-cyan-300 active:scale-95'
                    }`}
                    title="Down (ArrowDown / S)"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {/* RIGHT */}
                <button
                  onMouseDown={() => handlePress('right')}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center font-bold transition-all cursor-pointer ${
                    activeButton === 'right'
                      ? 'bg-cyan-400 text-black scale-95 shadow-[0_0_15px_rgba(6,182,212,0.9)] border-2 border-white'
                      : 'bg-[#121624] text-gray-300 border border-white/10 hover:border-cyan-400 hover:text-cyan-300 active:scale-95'
                  }`}
                  title="Right (ArrowRight / D)"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-[7px] font-mono">RIGHT</span>
                </button>
              </div>

              {/* BIG 5th BUTTON: OK / SELECT */}
              <button
                onMouseDown={() => handlePress('select')}
                className={`h-11 px-4 rounded-xl flex items-center gap-1.5 font-chakra font-black text-xs transition-all cursor-pointer ${
                  activeButton === 'select'
                    ? 'bg-white text-black scale-95 shadow-[0_0_20px_rgba(255,255,255,1)] border-2 border-cyan-400'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)] active:scale-95'
                }`}
                title="Select / Confirm (ENTER / Space)"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SELECT / OK</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Authentic Illuminated Coin Acceptor Mechanism */}
        <div className="flex items-center gap-4">
          
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-chakra font-black uppercase tracking-widest flex items-center gap-1.5 ${
              isLowCredit
                ? lowCreditNudgeStyle === 'blink'
                  ? 'text-amber-400 animate-bounce'
                  : 'text-amber-400 animate-pulse'
                : 'text-cyan-400'
            }`}>
              <span className={`w-2 h-2 rounded-full inline-block ${
                isLowCredit
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)] animate-ping'
                  : 'bg-cyan-400 animate-ping'
              }`} />
              {isLowCredit ? 'INSERT COINS' : 'COIN DROP'}
            </span>
            <span className="text-[9px] font-mono text-gray-400">
              Key: <kbd className="px-1 py-0.5 rounded bg-black border border-white/20 text-cyan-300">5</kbd> or <kbd className="px-1 py-0.5 rounded bg-black border border-white/20 text-cyan-300">C</kbd>
            </span>
          </div>

          {/* Physical Coin Bezel Fixture with Dynamic Low Credit Nudge Effects */}
          <div
            onClick={handleCoinInsert}
            className={`relative p-2.5 rounded-2xl bg-gradient-to-b from-[#1c2236] to-[#0a0d18] border-2 transition-all group active:scale-95 select-none flex items-center gap-3 cursor-pointer ${
              isCoinDropping
                ? 'ring-4 ring-cyan-400 scale-95 shadow-[0_0_35px_rgba(6,182,212,0.9)] border-cyan-300'
                : isLowCredit
                ? lowCreditNudgeStyle === 'blink'
                  ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.85)] animate-pulse ring-2 ring-amber-400/70 hover:ring-amber-300'
                  : lowCreditNudgeStyle === 'glow'
                  ? 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.9)] ring-2 ring-amber-500/50'
                  : 'border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.75)] animate-pulse ring-1 ring-amber-400/60'
                : 'border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:border-cyan-300'
            }`}
            title={isLowCredit ? `Low Credits (${credits}) - Click or press 5 to insert coins!` : 'Click to insert coin (KEY 5)'}
          >
            {/* Glowing Coin Indicator Icon [ 0 ] */}
            <div className="flex flex-col items-center justify-center">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono font-black text-xs transition-colors shadow-md ${
                isLowCredit
                  ? 'border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.9)] bg-amber-500/10 group-hover:bg-amber-400 group-hover:text-black'
                  : 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.7)] group-hover:bg-cyan-500 group-hover:text-black'
              }`}>
                {currencySymbol}
              </div>
            </div>

            {/* Vertical Metallic Coin Slit Channel */}
            <div className="flex flex-col items-center">
              <div className={`w-2 h-10 rounded-full bg-black border-2 shadow-inner relative overflow-hidden flex items-center justify-center transition-colors ${
                isLowCredit
                  ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                  : 'border-cyan-400/90'
              }`}>
                {/* Animated Gold Coin falling through slit */}
                {isCoinDropping && (
                  <div className="w-2 h-4 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,1)] animate-bounce" />
                )}
                
                {/* Low credit slit light bar effect */}
                {isLowCredit && !isCoinDropping && (
                  <div className="w-1 h-3 bg-amber-400/80 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[7px] font-mono font-bold mt-0.5 tracking-tighter ${
                isLowCredit ? 'text-amber-300' : 'text-cyan-400'
              }`}>
                INSERT
              </span>
            </div>

            {/* Coin Return Reject Lever */}
            <div className="flex flex-col items-center justify-center pl-1 border-l border-white/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playButtonClick();
                  soundEffects.playCoinDrop();
                }}
                className="w-6 h-6 rounded-lg bg-[#141828] hover:bg-red-500/40 text-gray-400 hover:text-white border border-white/20 flex items-center justify-center transition-colors"
                title="Coin Reject"
              >
                <RotateCcw className={`w-3 h-3 ${isLowCredit ? 'text-amber-400' : 'text-cyan-400'}`} />
              </button>
              <span className="text-[6px] font-chakra text-gray-400 font-bold uppercase mt-0.5">
                REJECT
              </span>
            </div>

            {/* Floating tooltip badge: Shows low credit notice or free play */}
            <div className={`absolute -top-3 right-4 px-2 py-0.5 rounded-full font-chakra font-black text-[9px] uppercase transition-all ${
              freePlay
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                : isLowCredit
                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,1)] ring-2 ring-amber-300 animate-pulse font-bold'
                : 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]'
            }`}>
              {freePlay 
                ? 'FREE PLAY' 
                : isLowCredit 
                ? `⚡ ${credits} CREDITS LEFT • INSERT COIN` 
                : `1 COIN = 1 CREDIT`}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
