import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types/rockola';
import { soundEffects } from '../services/soundEffects';
import { getSongCoverArt, generateComingSoonCoverArt } from '../utils/coverArtUtils';
import { ChevronLeft, ChevronRight, Plus, Search, Check, Heart, Flame, Hash, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryTab {
  id: string;
  name: string;
  icon: string;
  badge: string;
  accentColor: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'populares', name: 'POPULARES', icon: '🔥', badge: 'TOP 40', accentColor: '#06b6d4' },
  { id: 'videos', name: 'VIDEOS', icon: '🎬', badge: 'HD VIDEO', accentColor: '#a855f7' },
  { id: 'artistas', name: 'ARTISTAS', icon: '🎤', badge: 'FEATURED', accentColor: '#e2e8f0' },
  { id: 'generos', name: 'GÉNEROS', icon: '🎸', badge: 'ROCK & POP', accentColor: '#ef4444' },
  { id: 'nuevas', name: 'NUEVAS', icon: '✨', badge: 'NEW 2026', accentColor: '#10b981' },
  { id: 'recientes', name: 'RECIENTES', icon: '🎧', badge: 'RECENT', accentColor: '#f59e0b' },
  { id: 'favoritas', name: 'FAVORITAS', icon: '♥', badge: 'LIKED', accentColor: '#f43f5e' }
];

interface TouchTunesCarouselProps {
  songs: Song[];
  onQueueSong: (song: Song) => void;
  onOpenQuickNumber: () => void;
  onOpenSearch: () => void;
  credits: number;
  freePlay: boolean;
  onToggleShuffle?: () => void;
  isShuffleActive?: boolean;
  onToggleFavorite?: (songId: string) => void;
  activeCategoryIndex?: number;
  onCategoryChange?: (idx: number) => void;
  onSongSelected?: (song: Song) => void;
}

export const TouchTunesCarousel: React.FC<TouchTunesCarouselProps> = ({
  songs,
  onQueueSong,
  onOpenQuickNumber,
  onOpenSearch,
  credits,
  freePlay,
  onToggleFavorite
}) => {
  const [activeTabId, setActiveTabId] = useState<string>('populares');
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [recentlyQueuedId, setRecentlyQueuedId] = useState<string | null>(null);

  // Idle state oscillation state & animation
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [idleTime, setIdleTime] = useState<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter songs according to active category tab
  const activeSongs = React.useMemo(() => {
    if (!songs || songs.length === 0) return [];

    switch (activeTabId) {
      case 'videos': {
        const vids = songs.filter(s => s.mediaType === 'video' || Boolean(s.videoUrl));
        return vids.length > 0 ? vids : songs;
      }
      case 'favoritas': {
        const favs = songs.filter(s => s.favorite);
        return favs.length > 0 ? favs : songs;
      }
      case 'populares': {
        return [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      }
      case 'artistas': {
        return [...songs].sort((a, b) => a.artist.localeCompare(b.artist));
      }
      case 'generos': {
        return songs.filter(s => s.genre === 'rock' || s.genre === 'pop' || s.genre === 'latin');
      }
      case 'nuevas': {
        return songs.filter(s => s.isNewlyImported || s.isImported || s.isCustom || (s.year && s.year >= 2020));
      }
      case 'recientes': {
        return songs;
      }
      default:
        return songs;
    }
  }, [songs, activeTabId]);

  // Ensure index remains in bounds when active category changes
  useEffect(() => {
    if (selectedSongIndex >= activeSongs.length) {
      setSelectedSongIndex(0);
    }
  }, [activeSongs.length, selectedSongIndex]);

  // Reset Idle Timer on any user interaction
  const resetIdle = useCallback(() => {
    setIsIdle(false);
    setIdleTime(0);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 3200); // Trigger subtle oscillation after 3.2s of inactivity
  }, []);

  // Continuous animation frame for smooth oscillation when idle
  useEffect(() => {
    let animationFrameId: number;
    if (isIdle) {
      const startTime = Date.now();
      const updateOscillation = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        setIdleTime(elapsed);
        animationFrameId = requestAnimationFrame(updateOscillation);
      };
      animationFrameId = requestAnimationFrame(updateOscillation);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isIdle]);

  // Global activity listener to cancel idle oscillation instantly upon input
  useEffect(() => {
    resetIdle();
    const handleUserActivity = () => resetIdle();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdle]);

  const handlePrev = useCallback(() => {
    if (activeSongs.length === 0) return;
    resetIdle();
    soundEffects.playButtonClick();
    setSelectedSongIndex(prev => (prev > 0 ? prev - 1 : activeSongs.length - 1));
    setDragOffset(0);
  }, [activeSongs.length, resetIdle]);

  const handleNext = useCallback(() => {
    if (activeSongs.length === 0) return;
    resetIdle();
    soundEffects.playButtonClick();
    setSelectedSongIndex(prev => (prev < activeSongs.length - 1 ? prev + 1 : 0));
    setDragOffset(0);
  }, [activeSongs.length, resetIdle]);

  // Handle Song Selection (ENTER or Click)
  const handleSelectSong = useCallback((song: Song) => {
    if (!song) return;
    resetIdle();
    onQueueSong(song);
    setRecentlyQueuedId(song.id);
    setTimeout(() => {
      setRecentlyQueuedId(prev => (prev === song.id ? null : prev));
    }, 2200);
  }, [onQueueSong, resetIdle]);

  // Keyboard navigation specifically for 3D Carousel (A/D/Y/F/Enter with e.repeat protection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent navigation if focus is inside text input or text area
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      // Guard against auto-repeat rapid scrolling
      if (e.repeat) return;

      const key = e.key.toUpperCase();
      const code = e.code;

      // A or Left Arrow -> rotate left
      if (key === 'A' || code === 'KeyA' || key === 'ARROWLEFT') {
        e.preventDefault();
        handlePrev();
      }
      // D or Right Arrow -> rotate right
      else if (key === 'D' || code === 'KeyD' || key === 'ARROWRIGHT') {
        e.preventDefault();
        handleNext();
      }
      // Y or Up Arrow -> switch category tab up
      else if (key === 'Y' || code === 'KeyY' || key === 'ARROWUP') {
        e.preventDefault();
        resetIdle();
        soundEffects.playButtonClick();
        setActiveTabId(prev => {
          const curIdx = CATEGORY_TABS.findIndex(t => t.id === prev);
          const nextIdx = curIdx > 0 ? curIdx - 1 : CATEGORY_TABS.length - 1;
          return CATEGORY_TABS[nextIdx].id;
        });
        setSelectedSongIndex(0);
      }
      // F or Down Arrow -> switch category tab down
      else if (key === 'F' || code === 'KeyF' || key === 'ARROWDOWN') {
        e.preventDefault();
        resetIdle();
        soundEffects.playButtonClick();
        setActiveTabId(prev => {
          const curIdx = CATEGORY_TABS.findIndex(t => t.id === prev);
          const nextIdx = curIdx < CATEGORY_TABS.length - 1 ? curIdx + 1 : 0;
          return CATEGORY_TABS[nextIdx].id;
        });
        setSelectedSongIndex(0);
      }
      // ENTER or Space -> select/queue current front song
      else if (key === 'ENTER' || key === ' ' || code === 'Enter' || code === 'Space') {
        e.preventDefault();
        const selectedSong = activeSongs[selectedSongIndex];
        if (selectedSong) {
          handleSelectSong(selectedSong);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, activeSongs, selectedSongIndex, handleSelectSong, resetIdle]);

  // Touch and Drag handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    resetIdle();
    const pageX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(pageX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX === null) return;
    resetIdle();
    const pageX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = pageX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (dragStartX !== null) {
      if (dragOffset < -45) {
        handleNext();
      } else if (dragOffset > 45) {
        handlePrev();
      }
      setDragStartX(null);
      setDragOffset(0);
    }
  };

  // Interactive 3D Cursor Pitch & Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    resetIdle();
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    handleTouchEnd();
  };

  const currentTab = CATEGORY_TABS.find(t => t.id === activeTabId) || CATEGORY_TABS[0];
  const selectedSong = activeSongs[selectedSongIndex] || songs[0];

  return (
    <div className="w-full flex flex-col items-center select-none relative overflow-x-hidden">
      
      {/* Dynamic Ambient Color Backlight Aura */}
      <motion.div
        animate={{
          backgroundColor: currentTab.accentColor,
          scale: [0.95, 1.08, 0.95],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          backgroundColor: { duration: 0.8 },
          scale: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
          opacity: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[580px] sm:h-[580px] rounded-full blur-[130px] pointer-events-none -z-10"
      />

      {/* Floating Particles Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 200, x: (i - 2.5) * 150, opacity: 0, scale: 0.5 }}
            animate={{
              y: [-10, -210],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.2, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 5 + i * 0.8,
              repeat: Infinity,
              delay: i * 0.9,
              ease: 'easeOut',
            }}
            className="absolute bottom-12 left-1/2 text-cyan-400/20 text-xl sm:text-2xl"
          >
            {i % 2 === 0 ? '🎵' : i % 3 === 0 ? '✨' : '🎶'}
          </motion.div>
        ))}
      </div>

      {/* 1. Category Bar Navigation Tabs */}
      <div className="w-full max-w-5xl px-3 my-1 sm:my-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 sm:gap-2 mx-auto flex-wrap justify-center">
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playButtonClick();
                  setActiveTabId(tab.id);
                  setSelectedSongIndex(0);
                  resetIdle();
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-chakra font-black flex items-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-105'
                    : 'bg-black/60 hover:bg-black/80 text-gray-300 border-white/10 hover:border-cyan-500/40'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                  isActive ? 'bg-black/30 text-black' : 'bg-white/10 text-cyan-300'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main 3D Elliptical Ring Carousel Area */}
      <div className="w-full relative py-4 sm:py-8 md:py-10 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[340px] md:min-h-[400px]">
        
        {/* Navigation Arrow: Left [ A / < ] */}
        <motion.button
          whileHover={{ scale: 1.15, x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 md:left-10 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/90 hover:bg-cyan-500 hover:text-black text-white border border-cyan-500/40 hover:border-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer transition-colors group"
          title="Rotate Left (A / Left Arrow)"
        >
          <ChevronLeft className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* 3D Ring Stage Container */}
        <div 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleTouchMove(e);
          }}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleMouseLeave}
          className="flex items-center justify-center relative w-full max-w-6xl px-8 sm:px-14 touch-pan-x cursor-grab active:cursor-grabbing perspective-1000 min-h-[240px] sm:min-h-[300px]"
        >
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            if (activeSongs.length === 0) return null;

            const index = (selectedSongIndex + offset + activeSongs.length * 100) % activeSongs.length;
            const song = activeSongs[index];
            if (!song) return null;

            const isCenter = offset === 0;

            // Idle State Oscillation values
            const idleXOffset = isIdle ? Math.sin(idleTime * 1.5 + offset * 0.8) * 14 : 0;
            const idleRotateY = isIdle ? Math.sin(idleTime * 1.8) * 6.5 : 0;

            // Mathematical 3D elliptical transform calculations
            const extraRotate = (dragOffset / 7);
            const rotateY = (offset * -22) + (isCenter ? mousePos.x * 20 + extraRotate : 0) + idleRotateY;
            const rotateX = isCenter ? mousePos.y * -14 : 0;
            const translateZ = isCenter ? 110 : -50 - Math.abs(offset) * 45;
            const translateX = offset * 165 + dragOffset * 0.45 + idleXOffset;
            const scale = isCenter ? 1.25 : Math.abs(offset) === 1 ? 0.88 : Math.abs(offset) === 2 ? 0.70 : 0.55;
            
            // Feature 2: Depth-of-Field Blur & Opacity Reduction on Receding Cards
            const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.78 : Math.abs(offset) === 2 ? 0.42 : 0.20;
            const blurPx = isCenter ? 0 : Math.abs(offset) === 1 ? 0.8 : Math.abs(offset) === 2 ? 2.5 : 4.5;
            const zIndex = 30 - Math.abs(offset) * 5;

            const isSelectedFlash = isCenter && recentlyQueuedId === song.id;

            return (
              <motion.div
                key={song.id + '-' + offset}
                layout
                animate={{
                  x: translateX,
                  z: translateZ,
                  rotateY,
                  rotateX,
                  scale,
                  opacity,
                  filter: `blur(${blurPx}px)`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 24,
                  mass: 0.8,
                }}
                onClick={() => {
                  if (!isCenter && Math.abs(dragOffset) < 10) {
                    soundEffects.playButtonClick();
                    setSelectedSongIndex(index);
                  } else if (isCenter) {
                    handleSelectSong(song);
                  }
                }}
                className={`absolute cursor-pointer flex flex-col items-center will-change-transform ${
                  isCenter ? 'z-30' : Math.abs(offset) === 1 ? 'z-20 hidden sm:flex' : Math.abs(offset) === 2 ? 'z-10 hidden md:flex' : 'z-0 hidden lg:flex'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex
                }}
              >
                {/* Feature 1: High-Contrast Glow Pulse Burst Ring on Selection */}
                <AnimatePresence>
                  {isSelectedFlash && (
                    <>
                      <motion.div
                        initial={{ scale: 0.85, opacity: 1, borderWidth: '6px' }}
                        animate={{ scale: [0.9, 1.35, 1.15], opacity: [1, 0.95, 0], borderWidth: ['8px', '14px', '0px'] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute -inset-6 rounded-3xl border-cyan-300 shadow-[0_0_100px_rgba(6,182,212,1),_0_0_40px_rgba(255,255,255,1)] pointer-events-none z-50"
                      />
                      <motion.div
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: [0.8, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 rounded-2xl pointer-events-none z-40 blur-sm"
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Outer Card Wrapper */}
                <div className="relative flex items-center justify-center">

                  {/* Interactive Spinning Vinyl Record sliding out from behind center sleeve */}
                  {isCenter && (
                    <motion.div
                      initial={{ x: 0, opacity: 0, rotate: 0 }}
                      animate={{ x: 50, opacity: 0.95, rotate: 360 }}
                      transition={{
                        x: { type: 'spring', stiffness: 220, damping: 20, delay: 0.1 },
                        opacity: { duration: 0.3 },
                        rotate: { repeat: Infinity, duration: 8, ease: 'linear' }
                      }}
                      className="absolute -right-12 sm:-right-16 top-1/2 -translate-y-1/2 w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-[0_0_35px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden pointer-events-none z-0"
                    >
                      {/* Vinyl Grooves */}
                      <div className="absolute inset-2 rounded-full border border-white/10" />
                      <div className="absolute inset-4 rounded-full border border-white/10" />
                      <div className="absolute inset-7 rounded-full border border-white/10" />
                      <div className="absolute inset-10 rounded-full border border-white/10" />
                      <div className="absolute inset-14 rounded-full border border-white/10" />
                      
                      {/* Vinyl Center Label */}
                      <div 
                        className="w-11 h-11 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-1 text-center shadow-inner relative z-10"
                        style={{ backgroundColor: currentTab.accentColor || '#06b6d4' }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/60" />
                      </div>
                    </motion.div>
                  )}

                  {/* Album Cover Card Structure */}
                  <motion.div
                    whileHover={isCenter ? { scale: 1.03 } : { scale: 1.05 }}
                    className={`w-40 h-52 sm:w-52 sm:h-64 md:w-60 md:h-72 rounded-2xl overflow-hidden border-2 relative flex flex-col justify-between shadow-2xl transition-all ${
                      isSelectedFlash
                        ? 'border-white ring-8 ring-cyan-300 shadow-[0_0_120px_rgba(6,182,212,1.0),_0_0_60px_rgba(255,255,255,1.0)] z-20 bg-cyan-950 animate-pulse'
                        : isCenter 
                          ? 'border-cyan-400 ring-4 ring-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.8)] z-10 bg-zinc-950' 
                          : 'border-white/20 hover:border-white/50 shadow-black/90 bg-zinc-900'
                    }`}
                  >
                    {/* Top: Album Art Image */}
                    <div className="relative flex-1 w-full overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={getSongCoverArt(song)}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = generateComingSoonCoverArt(song.title, song.artist);
                        }}
                      />

                      {/* Track Code Badge */}
                      <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-cyan-400/50 text-cyan-300 font-mono font-black text-xs shadow-lg flex items-center gap-1">
                        <span>{song.code}</span>
                        {(song.mediaType === 'video' || Boolean(song.videoUrl)) && (
                          <span className="text-[10px] text-purple-400 font-chakra font-black">🎬</span>
                        )}
                      </div>

                      {/* Video / Local File Indicator */}
                      {(song.mediaType === 'video' || Boolean(song.videoUrl)) ? (
                        <div className="absolute bottom-2 left-2 bg-purple-900/90 backdrop-blur-md px-1.5 py-0.5 rounded text-white font-chakra font-black text-[9px] flex items-center gap-1 shadow border border-purple-400/50">
                          <span>{song.fileFormat ? `${song.fileFormat} VIDEO` : 'HD VIDEO'}</span>
                        </div>
                      ) : song.fileFormat ? (
                        <div className="absolute bottom-2 left-2 bg-blue-900/90 backdrop-blur-md px-1.5 py-0.5 rounded text-blue-200 font-mono font-bold text-[9px] flex items-center gap-1 shadow border border-blue-400/50">
                          <span>{song.fileFormat}</span>
                        </div>
                      ) : null}

                      {/* Favorite Heart Toggle */}
                      {isCenter && onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(song.id);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                            song.favorite
                              ? 'bg-rose-500/80 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                              : 'bg-black/60 border-white/20 text-gray-300 hover:text-white'
                          }`}
                          title={song.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${song.favorite ? 'fill-white' : ''}`} />
                        </button>
                      )}

                      {/* Queue Confirmation Overlay Badge */}
                      {recentlyQueuedId === song.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-cyan-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center z-30"
                        >
                          <Check className="w-10 h-10 text-cyan-300 animate-bounce mb-1" />
                          <span className="font-chakra font-black text-sm text-cyan-200 uppercase tracking-wide">
                            ✓ ADDED TO QUEUE!
                          </span>
                        </motion.div>
                      )}

                      {/* Animated Sweeping Light Sheen across active jacket */}
                      {isCenter && (
                        <motion.div
                          initial={{ x: '-130%', opacity: 0 }}
                          animate={{ x: ['130%', '-130%'], opacity: [0, 0.45, 0] }}
                          transition={{ repeat: Infinity, repeatDelay: 3.2, duration: 2.2, ease: 'easeInOut' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none z-20"
                        />
                      )}
                    </div>

                    {/* Bottom Panel: Song Title & Artist */}
                    <div className="p-2.5 sm:p-3 bg-gradient-to-t from-black via-zinc-950 to-zinc-900 border-t border-white/10 flex flex-col justify-between">
                      <div className="font-chakra font-black text-sm sm:text-base text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {song.title}
                      </div>
                      <div className="text-xs text-cyan-400 font-medium truncate">
                        {song.artist}
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 4: Mirrored 'Floor' Reflection below album card */}
                  <div 
                    className="absolute top-full left-0 right-0 h-28 sm:h-36 mt-1 pointer-events-none overflow-hidden rounded-b-2xl opacity-30 scale-y-[-1] origin-top blur-[1px] z-0"
                    style={{
                      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 80%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 80%)',
                    }}
                  >
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex flex-col justify-between">
                      <img
                        src={getSongCoverArt(song)}
                        alt=""
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                  </div>

                </div>

                {/* Subtitle Badge under front card */}
                {isCenter && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-3 z-30 flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs sm:text-sm font-chakra font-bold text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] bg-black/90 px-3.5 py-1 rounded-full border border-cyan-400/50 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{selectedSongIndex + 1} / {activeSongs.length} TRACKS</span>
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feature 4: Polished Glossy Stage Reflection Floor Grid Line */}
        <div className="w-full max-w-5xl h-12 -mt-4 bg-gradient-to-b from-cyan-500/10 via-black/40 to-transparent border-t border-cyan-500/20 rounded-full blur-sm pointer-events-none -z-10" />

        {/* Navigation Arrow: Right [ D / > ] */}
        <motion.button
          whileHover={{ scale: 1.15, x: 3 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNext}
          className="absolute right-2 sm:right-4 md:right-10 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/90 hover:bg-cyan-500 hover:text-black text-white border border-cyan-500/40 hover:border-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer transition-colors group"
          title="Rotate Right (D / Right Arrow)"
        >
          <ChevronRight className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </motion.button>

      </div>

      {/* 3. NOW SELECTED Banner Below 3D Carousel */}
      {selectedSong && (
        <motion.div
          key={selectedSong.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl px-4 my-2"
        >
          <div className="bg-[#0b0f1e]/95 backdrop-blur-md rounded-2xl border-2 border-cyan-500/40 p-3.5 sm:p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left Metadata details */}
            <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left min-w-0">
              <div className="hidden sm:flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-black border border-cyan-400/40 shrink-0">
                <span className="text-[9px] text-cyan-400 font-mono font-bold">CODE</span>
                <span className="text-base font-mono font-black text-white">{selectedSong.code}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="px-2 py-0.5 rounded bg-cyan-500 text-black font-chakra font-black text-[9px]">
                    NOW SELECTED
                  </span>
                  {(selectedSong.mediaType === 'video' || Boolean(selectedSong.videoUrl)) && (
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-chakra font-black text-[9px] flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                      <Film className="w-2.5 h-2.5" />
                      <span>{selectedSong.fileFormat ? `${selectedSong.fileFormat} CLIP` : 'HD VIDEO CLIP'}</span>
                    </span>
                  )}
                  <span className="text-xs text-amber-400 font-mono uppercase font-bold">
                    {selectedSong.genre} {selectedSong.year ? `• ${selectedSong.year}` : ''}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-black font-chakra text-white tracking-wide truncate mt-0.5">
                  {selectedSong.title}
                </h2>
                
                <p className="text-sm font-bold text-gray-300 truncate">
                  {selectedSong.artist} {selectedSong.album ? `• ${selectedSong.album}` : ''}
                </p>
              </div>
            </div>

            {/* Right Action & Cost details */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-gray-400 font-mono block">SELECTION COST</span>
                <span className="text-xs font-mono font-black text-amber-400">
                  {freePlay ? 'FREE PLAY' : '1 CREDIT'}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectSong(selectedSong)}
                className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-chakra font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer transition-all ${
                  selectedSong.mediaType === 'video' || Boolean(selectedSong.videoUrl)
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.8)]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.7)]'
                }`}
              >
                {selectedSong.mediaType === 'video' || Boolean(selectedSong.videoUrl) ? (
                  <>
                    <Film className="w-5 h-5 animate-pulse" />
                    <span>PLAY VIDEO CLIP [ENTER]</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>SELECT & PLAY [ENTER]</span>
                  </>
                )}
              </motion.button>
            </div>

          </div>
        </motion.div>
      )}

      {/* 4. Quick Action Bar */}
      <div className="w-full max-w-4xl px-4 mt-1 flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => {
            resetIdle();
            soundEffects.playButtonClick();
            onOpenSearch();
          }}
          className="px-4 py-2 rounded-xl bg-[#121626] hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/30 text-xs font-chakra font-bold flex items-center gap-2 cursor-pointer transition-all"
        >
          <Search className="w-4 h-4" />
          <span>SEARCH MUSIC</span>
        </button>

        <button
          onClick={() => {
            resetIdle();
            soundEffects.playButtonClick();
            onOpenQuickNumber();
          }}
          className="px-4 py-2 rounded-xl bg-[#121626] hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/30 text-xs font-chakra font-bold flex items-center gap-2 cursor-pointer transition-all"
        >
          <Hash className="w-4 h-4" />
          <span>DIAL TRACK CODE [A01]</span>
        </button>

        <div className="text-xs font-mono text-gray-400 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
          CREDITS AVAILABLE: <span className="text-amber-400 font-bold">{freePlay ? 'FREE PLAY' : credits}</span>
        </div>
      </div>

    </div>
  );
};
