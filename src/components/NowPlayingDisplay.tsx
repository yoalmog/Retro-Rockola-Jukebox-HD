import React, { useState, useRef, useEffect } from 'react';
import { Song, SkinType, AppLanguage } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { getSongCoverArt, generateComingSoonCoverArt } from '../utils/coverArtUtils';
import { getTranslation } from '../utils/i18n';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Play, Pause, SkipForward, Disc, Sparkles, Activity, Layers, Heart, Mic, Film, Tv, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { audioEngineService } from '../services/audioEngine';

interface NowPlayingDisplayProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  skin: SkinType;
  queueCount: number;
  detailedVisualFeedback?: boolean;
  loudnessNormalization?: boolean;
  crossfadeEnabled?: boolean;
  language?: AppLanguage;
  onToggleFavorite?: (songId: string) => void;
  onOpenLyrics?: () => void;
  onOpenVideoStage?: () => void;
}

export const NowPlayingDisplay: React.FC<NowPlayingDisplayProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSkipNext,
  skin,
  queueCount,
  detailedVisualFeedback = false,
  loudnessNormalization = true,
  crossfadeEnabled = true,
  language = 'en',
  onToggleFavorite,
  onOpenLyrics,
  onOpenVideoStage
}) => {
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'vu-meters' | 'bubbles'>('bars');
  const [showInlineVideo, setShowInlineVideo] = useState(true);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const theme = getTheme(skin);

  const isVideo = currentSong?.mediaType === 'video' || Boolean(currentSong?.videoUrl);

  // Sync inline video element with audio engine if active
  useEffect(() => {
    if (isVideo && inlineVideoRef.current) {
      audioEngineService.attachVideoElement(inlineVideoRef.current);
      const vUrl = currentSong?.videoUrl || currentSong?.audioUrl;
      if (vUrl && inlineVideoRef.current.src !== vUrl) {
        inlineVideoRef.current.src = vUrl;
        if (isPlaying) {
          inlineVideoRef.current.play().catch(() => {});
        }
      }
    }
  }, [isVideo, currentSong]);

  useEffect(() => {
    if (isVideo && inlineVideoRef.current) {
      if (isPlaying) {
        inlineVideoRef.current.play().catch(() => {});
      } else {
        inlineVideoRef.current.pause();
      }
    }
  }, [isPlaying, isVideo]);

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${theme.cardBg} rounded-2xl p-4 sm:p-6 border ${theme.cardBorder} shadow-2xl flex flex-col justify-between h-full select-none relative overflow-hidden transition-colors duration-300`}>
      
      {/* Background Subtle Radial Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          <h2 className={`text-xs uppercase tracking-[0.25em] ${theme.primaryAccentText} font-black font-chakra`}>
            {getTranslation('nowPlaying', language)} &amp; LIVE SPECTRUM
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {loudnessNormalization && (
            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NORM ON
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-black/60 text-gray-400 border border-white/10">
            Queue: {queueCount}
          </span>
        </div>
      </div>

      {currentSong ? (
        <div className="flex flex-col gap-3 flex-1 justify-between">
          
          {/* Main Track Display Section */}
          <div className="flex items-center gap-4">
            
            {/* Spinning Framer Motion Vinyl Record */}
            <div className={`relative ${
              detailedVisualFeedback ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'
            } flex-shrink-0 flex items-center justify-center`}>
              
              {/* Outer Glow Ring matching skin accent */}
              <div className={`absolute -inset-1 rounded-full blur-md opacity-70 ${theme.accentGlow}`} />

              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{
                  repeat: isPlaying ? Infinity : 0,
                  duration: 3,
                  ease: 'linear'
                }}
                className="w-full h-full rounded-full bg-gradient-to-tr from-stone-950 via-neutral-900 to-black p-1.5 border-2 border-amber-400/30 shadow-2xl relative flex items-center justify-center overflow-hidden"
              >
                {/* Vinyl Grooves & Sheen Effect */}
                <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-5 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                {/* Center Album Art Label */}
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-amber-400 shadow-inner flex items-center justify-center bg-black">
                  <img
                    src={getSongCoverArt(currentSong)}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = generateComingSoonCoverArt(currentSong.title, currentSong.artist);
                    }}
                  />
                  {/* Spindle hole */}
                  <div className="absolute w-2 h-2 rounded-full bg-black border border-white/40 shadow-inner" />
                </div>
              </motion.div>
            </div>

            {/* Song Meta Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-black ${theme.primaryAccentText} uppercase tracking-wider ${
                    detailedVisualFeedback ? 'text-xs sm:text-sm' : 'text-[11px]'
                  }`}>
                    [{currentSong.code}]
                  </span>
                  <span className="text-[10px] font-chakra px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 uppercase border border-cyan-500/30">
                    {currentSong.genre}
                  </span>
                  {isVideo && (
                    <span className="text-[10px] font-chakra px-1.5 py-0.5 rounded bg-purple-600 text-white font-black flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                      <Film className="w-3 h-3" />
                      <span>HD VIDEO</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isVideo && onOpenVideoStage && (
                    <button
                      onClick={onOpenVideoStage}
                      className="p-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-chakra font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
                      title="Open Cinema Video Stage"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">STAGE</span>
                    </button>
                  )}

                  {/* Favorite Heart Toggle */}
                  <button
                    onClick={() => onToggleFavorite && onToggleFavorite(currentSong.id)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                      currentSong.favorite
                        ? 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-black/40 hover:bg-rose-500/20 border-white/10'
                    }`}
                    title={currentSong.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart className={`w-4 h-4 ${currentSong.favorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-rose-400'}`} />
                  </button>
                </div>
              </div>

              <h4 className={`font-black font-chakra text-white truncate leading-tight mt-0.5 ${
                detailedVisualFeedback ? 'text-lg sm:text-2xl md:text-3xl' : 'text-base sm:text-lg'
              }`}>
                {currentSong.title}
              </h4>
              <p className={`truncate font-chakra mt-0.5 ${
                detailedVisualFeedback ? 'text-sm sm:text-base text-gray-200 font-bold' : 'text-xs sm:text-sm text-gray-400'
              }`}>
                {currentSong.artist} • {currentSong.album || 'Rockola Edition'} {currentSong.year ? `(${currentSong.year})` : ''}
              </p>
            </div>
          </div>

          {/* Real-time Web Audio API Spectrum Visualizer or Inline Video Screen */}
          {isVideo && showInlineVideo ? (
            <div className="relative h-28 sm:h-36 w-full bg-black rounded-xl border border-purple-500/40 shadow-inner overflow-hidden flex items-center justify-center">
              <video
                ref={inlineVideoRef}
                playsInline
                className="w-full h-full object-contain bg-black"
                onEnded={onSkipNext}
              />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                {onOpenVideoStage && (
                  <button
                    onClick={onOpenVideoStage}
                    className="px-2 py-0.5 rounded bg-black/80 hover:bg-purple-600 text-white border border-white/20 text-[10px] font-chakra flex items-center gap-1 cursor-pointer transition-all shadow"
                    title="Fullscreen Cinema Stage"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>CINEMA STAGE</span>
                  </button>
                )}
                <button
                  onClick={() => setShowInlineVideo(false)}
                  className="px-1.5 py-0.5 rounded bg-black/80 hover:bg-white/20 text-gray-300 text-[10px] font-chakra cursor-pointer"
                  title="Switch to Audio Spectrum"
                >
                  SPECTRUM
                </button>
              </div>
            </div>
          ) : (
            <div className="relative h-16 w-full bg-[#060810] rounded-xl p-1 border border-cyan-500/20 shadow-inner overflow-hidden">
              <VisualizerCanvas skin={skin} isPlaying={isPlaying} mode={visualizerMode} />
              
              {/* Visualizer Mode Switcher Pill */}
              <div className="absolute bottom-1 right-1.5 flex items-center gap-1 bg-black/80 px-1.5 py-0.5 rounded-md border border-white/10 text-[9px] font-mono text-gray-300">
                {isVideo && (
                  <button
                    onClick={() => setShowInlineVideo(true)}
                    className="px-1 rounded uppercase cursor-pointer text-purple-400 font-bold hover:text-purple-300 mr-1 flex items-center gap-0.5"
                    title="Switch to Video Screen"
                  >
                    <Film className="w-2.5 h-2.5" />
                    <span>VIDEO</span>
                  </button>
                )}
                {(['bars', 'wave', 'vu-meters', 'bubbles'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setVisualizerMode(m)}
                    className={`px-1 rounded uppercase cursor-pointer transition-colors ${
                      visualizerMode === m ? 'bg-cyan-500 text-black font-bold' : 'hover:text-white text-gray-400'
                    }`}
                  >
                    {m === 'vu-meters' ? 'VU' : m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar & Timing */}
          <div>
            <div className="w-full h-2 bg-[#1A1E2E] rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full ${theme.primaryAccent} transition-all duration-200 shadow-[0_0_10px_rgba(6,182,212,0.6)]`}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-mono mt-1.5 text-gray-400">
              <span className="font-bold text-cyan-400">{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="text-gray-300 font-bold">{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
            </div>

            <div className="flex items-center gap-2">
              {isVideo && onOpenVideoStage && (
                <button
                  onClick={onOpenVideoStage}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition-all text-xs font-chakra font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow"
                  title="Open Cinema Video Stage"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span className="hidden sm:inline">Cinema Stage</span>
                </button>
              )}
              <button
                onClick={onOpenLyrics}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition-all text-xs font-chakra font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow"
                title="Open Live Synchronized Lyrics Overlay"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Lyrics</span>
              </button>
              <button
                onClick={onTogglePlay}
                className={`px-3.5 py-1.5 rounded-xl ${theme.primaryAccent} text-black font-chakra font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer`}
                title={isPlaying ? 'Pause Track' : 'Resume Track'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                <span>{isPlaying ? getTranslation('pause', language) : getTranslation('play', language)}</span>
              </button>
              <button
                onClick={onSkipNext}
                className="px-3.5 py-1.5 rounded-xl bg-[#1A1E2E] hover:bg-[#252B42] text-gray-200 hover:text-white border border-white/15 hover:border-cyan-400 transition-all text-xs font-chakra font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow"
                title="Skip to Next Track"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{getTranslation('playNext', language)}</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Empty / Standby State */
        <div className="flex flex-col items-center justify-center flex-1 py-6 text-center text-gray-400 gap-3 font-chakra">
          <div className="w-14 h-14 rounded-full bg-[#141828] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Disc className="w-7 h-7 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{getTranslation('queueEmpty', language)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{getTranslation('lowCreditWarning', language)}</p>
          </div>
          <div className="h-12 w-full mt-2 rounded-xl bg-[#060810] p-1 border border-white/5 overflow-hidden">
            <VisualizerCanvas skin={skin} isPlaying={false} mode="wave" />
          </div>
        </div>
      )}
    </div>
  );
};
