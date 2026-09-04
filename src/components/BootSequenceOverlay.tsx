import React, { useState, useEffect } from 'react';
import { RockolaConfig } from '../types/rockola';
import { THEMES, getTheme } from '../utils/themeStyles';
import { Disc, Sparkles, Cpu, Zap, Volume2, Music, CheckCircle2, Play } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface BootSequenceOverlayProps {
  config: RockolaConfig;
  onComplete: () => void;
}

const BOOT_STAGES = [
  { threshold: 15, text: 'BOOTING DIGITAL JUKEBOX KERNEL v4.2...' },
  { threshold: 35, text: 'INITIALIZING AUDIO ENGINE & DSP LEVELING...' },
  { threshold: 55, text: 'CHECKING 5-BUTTON HARDWARE MATRIX & MACRO ENGINE...' },
  { threshold: 75, text: 'MOUNTING CATALOG & LOCAL MUSIC DIRECTORIES...' },
  { threshold: 92, text: 'LOADING THEME GRAPHICS ENGINE...' },
  { threshold: 100, text: 'SYSTEM READY - PRESS ENTER OR TOUCH TO START' }
];

export const BootSequenceOverlay: React.FC<BootSequenceOverlayProps> = ({ config, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('SYSTEM BOOT INITIATED...');
  const [isReady, setIsReady] = useState(false);

  const theme = getTheme(config.skin);
  const title = config.branding?.title || theme.nameEn || 'DIGITAL JUKEBOX 2026';
  const subtitle = config.branding?.subtitle || 'Commercial Pro Audio Interface';

  useEffect(() => {
    // Play startup chime
    soundEffects.playCoinDrop();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 8) + 4;
        const boundedNext = Math.min(next, 100);

        // Find stage text
        const stage = BOOT_STAGES.find((s) => boundedNext <= s.threshold);
        if (stage) {
          setCurrentStageText(stage.text);
        }

        if (boundedNext === 100) {
          setIsReady(true);
          soundEffects.playButtonClick();
        }

        return boundedNext;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Allow keyboard press [Enter / Space / Any key] to launch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReady || progress >= 60) {
        soundEffects.playButtonClick();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, progress, onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-12 select-none overflow-hidden ${theme.bgGradient}`}>
      
      {/* Background Animated Neon Grid & Glow Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Top Bar: Theme Badge & Hardware Diagnostics Code */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full font-chakra font-black text-xs uppercase tracking-wider ${theme.badgeBg}`}>
            {theme.badge}
          </span>
          <span className="text-[10px] font-mono text-gray-400 bg-black/60 px-2 py-1 rounded border border-white/5 hidden sm:inline-block">
            HW: 5-BTN OK | AUDIO 48kHz
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
          <span>BOOT DIAGNOSTICS</span>
        </div>
      </div>

      {/* Center Display: Theme Branding & Logo */}
      <div className="flex flex-col items-center text-center my-auto z-10 space-y-6 max-w-2xl px-4">
        
        {/* Logo / Vinyl Spinner */}
        <div className="relative group">
          <div className={`absolute -inset-4 rounded-full blur-xl opacity-75 ${theme.accentGlow} animate-pulse`} />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-black border-4 border-cyan-400/40 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
            {config.branding?.customLogoUrl ? (
              <img
                src={config.branding.customLogoUrl}
                alt="Jukebox Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-950 via-purple-950 to-black flex items-center justify-center border-2 border-white/20">
                <Disc className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Jukebox Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-chakra font-black tracking-wider text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {title}
          </h1>
          <p className="text-xs sm:text-sm font-chakra font-bold text-gray-300 tracking-widest uppercase">
            {subtitle}
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-md space-y-2 pt-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {currentStageText}
            </span>
            <span className="text-white font-black text-sm">{progress}%</span>
          </div>

          <div className="w-full h-4 bg-black/80 rounded-full p-0.5 border border-cyan-500/40 shadow-inner overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-200 ${theme.primaryAccent} ${theme.accentGlow}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Start / Skip Action Button */}
        <div className="pt-2">
          {isReady ? (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onComplete();
              }}
              className={`px-8 py-3.5 rounded-2xl font-chakra font-black text-base sm:text-lg text-black ${theme.primaryAccent} ${theme.accentGlow} flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xl animate-bounce`}
            >
              <Play className="w-5 h-5 fill-black" />
              <span>START JUKEBOX (PRESS ENTER)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onComplete();
              }}
              className="text-xs font-chakra font-bold text-gray-400 hover:text-white underline cursor-pointer transition-colors"
            >
              SKIP BOOT INTRO [ENTER]
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 z-10 border-t border-white/10 pt-4 text-[11px] font-chakra text-gray-400">
        <div className="truncate">
          <span>THEME: </span>
          <span className="text-cyan-300 font-bold">{theme.nameEn}</span>
        </div>
        <div className="text-center font-chakra font-black text-xs text-amber-300 tracking-widest uppercase bg-black/60 px-3.5 py-1 rounded-full border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0">
          Made by Yossi Almog
        </div>
        <div className="font-mono text-cyan-400 shrink-0">
          TOUCHTUNES HARDWARE SUITE v2026
        </div>
      </div>

    </div>
  );
};
