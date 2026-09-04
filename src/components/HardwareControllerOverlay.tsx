import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Coins, ChevronUp, ChevronDown } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { KeyBindings } from '../types/rockola';

interface HardwareControllerOverlayProps {
  onPressButton: (action: 'up' | 'down' | 'left' | 'right' | 'select' | 'coin') => void;
  activeButton: string | null;
  keyBindings: KeyBindings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const HardwareControllerOverlay: React.FC<HardwareControllerOverlayProps> = ({
  onPressButton,
  activeButton,
  keyBindings,
  isCollapsed,
  onToggleCollapse
}) => {
  const handlePress = (action: 'up' | 'down' | 'left' | 'right' | 'select' | 'coin') => {
    if (action === 'coin') {
      soundEffects.playCoinDrop();
    } else {
      soundEffects.playButtonClick();
    }
    onPressButton(action);
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2.5 shadow-[0_0_35px_rgba(0,0,0,0.95)] backdrop-blur-md max-w-xl w-[96vw] sm:w-auto">
        
        {/* Top bar with collapse toggle & info */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              5-Button Hardware Controller
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
              [← ↑ ↓ →] + [ENTER/OK] + [5: COIN]
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded bg-[#161616] text-amber-400 hover:text-white border border-white/10 text-xs cursor-pointer transition-colors"
              title={isCollapsed ? "Show Arcade Controller Pad" : "Collapse Controller Pad"}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Arcade Pushbuttons Panel */}
        {!isCollapsed && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 py-1">
            
            {/* Directional 4-Way Buttons */}
            <div className="flex items-center gap-1.5 bg-[#141414] p-2 rounded-xl border border-white/5 shadow-inner">
              
              {/* LEFT */}
              <button
                onMouseDown={() => handlePress('left')}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-75 cursor-pointer shadow-md ${
                  activeButton === 'left'
                    ? 'bg-amber-500 text-black scale-95 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-amber-300'
                    : 'bg-[#1C1C1C] text-gray-300 border border-white/10 hover:border-amber-400 hover:text-amber-400 active:scale-95'
                }`}
                title="Left (Previous Genre / Category - Key: ← / A)"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[7px] font-mono opacity-70">LEFT</span>
              </button>

              {/* UP & DOWN STACK */}
              <div className="flex flex-col gap-1.5">
                <button
                  onMouseDown={() => handlePress('up')}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-75 cursor-pointer shadow-md ${
                    activeButton === 'up'
                      ? 'bg-amber-500 text-black scale-95 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-amber-300'
                      : 'bg-[#1C1C1C] text-gray-300 border border-white/10 hover:border-amber-400 hover:text-amber-400 active:scale-95'
                  }`}
                  title="Up (Select Song Up - Key: ↑ / W)"
                >
                  <ArrowUp className="w-5 h-5" />
                  <span className="text-[7px] font-mono opacity-70">UP</span>
                </button>

                <button
                  onMouseDown={() => handlePress('down')}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-75 cursor-pointer shadow-md ${
                    activeButton === 'down'
                      ? 'bg-amber-500 text-black scale-95 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-amber-300'
                      : 'bg-[#1C1C1C] text-gray-300 border border-white/10 hover:border-amber-400 hover:text-amber-400 active:scale-95'
                  }`}
                  title="Down (Select Song Down - Key: ↓ / S)"
                >
                  <ArrowDown className="w-5 h-5" />
                  <span className="text-[7px] font-mono opacity-70">DOWN</span>
                </button>
              </div>

              {/* RIGHT */}
              <button
                onMouseDown={() => handlePress('right')}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-75 cursor-pointer shadow-md ${
                  activeButton === 'right'
                    ? 'bg-amber-500 text-black scale-95 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-amber-300'
                    : 'bg-[#1C1C1C] text-gray-300 border border-white/10 hover:border-amber-400 hover:text-amber-400 active:scale-95'
                }`}
                title="Right (Next Genre / Category - Key: → / D)"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-[7px] font-mono opacity-70">RIGHT</span>
              </button>
            </div>

            {/* BIG OK / CONFIRM BUTTON (The 5th button) */}
            <div className="bg-[#141414] p-2 rounded-xl border border-white/5 shadow-inner flex items-center">
              <button
                onMouseDown={() => handlePress('select')}
                className={`h-24 px-5 sm:px-6 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all duration-75 cursor-pointer shadow-lg ${
                  activeButton === 'select'
                    ? 'bg-amber-400 text-black scale-95 shadow-[0_0_25px_rgba(245,158,11,0.9)] border-2 border-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] active:scale-95'
                }`}
                title="Confirm Selection / Queue Song (Key: ENTER / SPACE)"
              >
                <Check className="w-7 h-7 stroke-[3]" />
                <span className="font-chakra text-sm sm:text-base tracking-wider font-black text-black">
                  OK / SELECT
                </span>
                <span className="text-[8px] font-mono font-bold tracking-tight text-black/80">
                  5th BUTTON (ENTER)
                </span>
              </button>
            </div>

            {/* COIN ACCEPTOR SLOT */}
            <div className="bg-[#141414] p-2 rounded-xl border border-white/5 shadow-inner flex items-center">
              <button
                onMouseDown={() => handlePress('coin')}
                className={`h-24 px-4 sm:px-5 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all duration-75 cursor-pointer shadow-lg ${
                  activeButton === 'coin'
                    ? 'bg-amber-400 text-black scale-95 shadow-[0_0_20px_rgba(245,158,11,0.9)] border-2 border-white'
                    : 'bg-[#1C1C1C] text-amber-400 border border-white/10 hover:border-amber-400/80 active:scale-95'
                }`}
                title="Insert Coin / Add Credits (Key: 5 / C)"
              >
                <div className="w-6 h-1 bg-black rounded-full border border-white/20 my-0.5"></div>
                <Coins className="w-6 h-6 text-amber-400" />
                <span className="font-chakra text-xs sm:text-sm tracking-wider font-bold text-white">
                  INSERT COIN
                </span>
                <span className="text-[8px] font-mono font-bold text-gray-400">
                  KEY: 5 / C
                </span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
