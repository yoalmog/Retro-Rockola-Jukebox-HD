/**
 * TouchTunes Commercial Digital Jukebox & Retro Rockola HD
 * Modernized digital Rockola for modern Ubuntu and Windows with vintage 5-button hardware compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Song, QueueItem, RockolaConfig, FocusArea, SkinType, Playlist } from './types/rockola';
import { GENRE_CATEGORIES, DEFAULT_SONGS } from './data/defaultCatalog';
import { loadConfig, saveConfig, loadCustomSongs, saveCustomSongs, loadPlaylists, savePlaylists, DEFAULT_MACRO_SEQUENCES, loadFavoriteSongIds, saveFavoriteSongIds } from './utils/storage';
import { soundEffects } from './services/soundEffects';
import { audioEngine } from './services/audioEngine';
import { hardwareDiagnosticService } from './services/hardwareDiagnosticService';
import { localMusicScannerService } from './services/localMusicScanner';
import { partyModeService } from './services/partyModeService';
import { fetchAndSyncLrcLyrics } from './utils/lrcLyricsService';
import { selectAutoDjNextSong } from './utils/autoDjService';
import { getTheme } from './utils/themeStyles';

// Components
import { HeaderMarquee } from './components/HeaderMarquee';
import { SongBrowser } from './components/SongBrowser';
import { NowPlayingDisplay } from './components/NowPlayingDisplay';
import { QueueList } from './components/QueueList';
import { NumberPadSelector } from './components/NumberPadSelector';
import { VirtualKeyboard5Btn } from './components/VirtualKeyboard5Btn';
import { CoinDropModal } from './components/CoinDropModal';
import { ServiceMenuModal } from './components/ServiceMenuModal';
import { AttractMode } from './components/AttractMode';
import { HelpModal } from './components/HelpModal';
import { PlaylistManagerModal } from './components/PlaylistManagerModal';
import { OwnerCustomizationModal } from './components/OwnerCustomizationModal';
import { TouchTunesCarousel } from './components/TouchTunesCarousel';
import { TouchTunesLowerCabinet } from './components/TouchTunesLowerCabinet';
import { TouchTunesBrowseDeck } from './components/TouchTunesBrowseDeck';
import { TouchTunesCommercialDock } from './components/TouchTunesCommercialDock';
import { PhotoBoothModal } from './components/PhotoBoothModal';
import { TouchTunesKioskFrame } from './components/TouchTunesKioskFrame';
import { BootSequenceOverlay } from './components/BootSequenceOverlay';
import { CrtScanlineOverlay } from './components/CrtScanlineOverlay';
import { MobileRemoteOverlay } from './components/MobileRemoteOverlay';
import { LyricsOverlay } from './components/LyricsOverlay';
import { MediaSourceSelectorModal } from './components/MediaSourceSelectorModal';
import { VideoJukeboxStage } from './components/VideoJukeboxStage';
import { MediaSourceFilter } from './types/rockola';

// Icons
import { Hash, Search, Disc, Sparkles, AlertCircle, Radio, ListMusic, Palette, Crown, Settings, LayoutGrid, Layers, Tv, Shuffle, Camera, Smartphone, Home, Film } from 'lucide-react';

export default function App() {
  // App Configuration
  const [config, setConfig] = useState<RockolaConfig>(loadConfig);
  const [customSongs, setCustomSongs] = useState<Song[]>(loadCustomSongs);
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>(loadFavoriteSongIds);
  const [activePlaylistId, setActivePlaylistId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'classic' | 'carousel' | 'browse'>('carousel');
  const [isKioskFrameEnabled, setIsKioskFrameEnabled] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const allSongs = React.useMemo(() => {
    return [...DEFAULT_SONGS, ...customSongs].map(song => ({
      ...song,
      favorite: favoriteSongIds.includes(song.id)
    }));
  }, [customSongs, favoriteSongIds]);

  // Navigation & Focus
  const [activeGenreIndex, setActiveGenreIndex] = useState(0);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [focusArea, setFocusArea] = useState<FocusArea>('song-list');
  const [activeHardwareButton, setActiveHardwareButton] = useState<string | null>(null);

  // Playback & Queue State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Screensavers
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isNumberPadOpen, setIsNumberPadOpen] = useState(false);
  const [isSearchKeyboardOpen, setIsSearchKeyboardOpen] = useState(false);
  const [isAttractModeActive, setIsAttractModeActive] = useState(false);
  const [isPlaylistManagerOpen, setIsPlaylistManagerOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isPhotoBoothOpen, setIsPhotoBoothOpen] = useState(false);
  const [isMobileRemoteOpen, setIsMobileRemoteOpen] = useState(false);
  const [isMediaSourceModalOpen, setIsMediaSourceModalOpen] = useState(false);

  // Dedicated Video Player for Clips State (floating PiP or fullscreen cinema theater)
  const [videoPlayerMode, setVideoPlayerMode] = useState<'closed' | 'floating' | 'cinema'>('closed');
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [autoShowVideoForClips, setAutoShowVideoForClips] = useState(true);

  // Check if active track is a video clip
  const isCurrentSongClip = Boolean(currentSong && (currentSong.mediaType === 'video' || currentSong.videoUrl));

  // Automatically show Video Player whenever a video clip begins playing
  useEffect(() => {
    if (currentSong) {
      const isClip = currentSong.mediaType === 'video' || Boolean(currentSong.videoUrl);
      if (isClip && autoShowVideoForClips) {
        setVideoPlayerMode(prev => (prev === 'closed' ? 'floating' : prev));
        setIsVideoMinimized(false);
        showToast(`🎬 Playing Clip: [${currentSong.code}] ${currentSong.title}`);
      }
    }
  }, [currentSong?.id, autoShowVideoForClips]);

  // Active Media Source Filter (all, audio, video, local, stream, factory)
  const activeMediaFilter: MediaSourceFilter = config.mediaSourceFilter || 'all';

  const filteredBySourceSongs = React.useMemo(() => {
    switch (activeMediaFilter) {
      case 'audio':
        return allSongs.filter(s => s.mediaType !== 'video' && !s.videoUrl);
      case 'video':
        return allSongs.filter(s => s.mediaType === 'video' || Boolean(s.videoUrl));
      case 'local':
        return allSongs.filter(s => s.mediaSource === 'local-file' || s.mediaSource === 'local-folder' || s.isCustom);
      case 'stream':
        return allSongs.filter(s => s.mediaSource === 'stream-url');
      case 'factory':
        return allSongs.filter(s => !s.isCustom && s.mediaSource !== 'local-file' && s.mediaSource !== 'local-folder');
      case 'all':
      default:
        return allSongs;
    }
  }, [allSongs, activeMediaFilter]);

  const handleSelectMediaFilter = (newFilter: MediaSourceFilter) => {
    setConfig(prev => ({ ...prev, mediaSourceFilter: newFilter }));
    showToast(`Media filter: ${newFilter.toUpperCase()}`);
  };

  const handleImportMediaSongs = (imported: Song[]) => {
    const updated = [...customSongs, ...imported];
    setCustomSongs(updated);
    saveCustomSongs(updated);
    showToast(`Added ${imported.length} track(s) to jukebox!`);
  };

  const handleClearCustomSongs = () => {
    setCustomSongs([]);
    saveCustomSongs([]);
    showToast('Custom imported media cleared');
  };

  // Alert Banner toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Idle timer for attract mode
  const idleTimerRef = useRef<number | null>(null);

  // Save config on changes & sync audio engine features
  useEffect(() => {
    saveConfig(config);
    audioEngine.setVolume(isMuted ? 0 : config.volume);
    audioEngine.setLoudnessNormalization(config.loudnessNormalization ?? true);
    audioEngine.setCrossfadeEnabled(config.crossfadeEnabled ?? true);
    audioEngine.setCrossfadeDuration(config.crossfadeDuration ?? 3);
    audioEngine.setBalance(config.stereoBalance ?? 0);
    audioEngine.setStereoWidth(config.stereoWidth ?? 100);
    soundEffects.setEnabled(config.soundEffectsEnabled);
    soundEffects.setVolume(config.soundEffectsVolume);
  }, [config, isMuted]);

  // Audio Engine Lifecycle
  useEffect(() => {
    audioEngine.init({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        setDuration(dur);
      },
      onEnded: () => {
        handlePlayNextInQueue();
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      }
    });
  }, [queue]);

  // Auto-fetch LRC time-synced lyrics when track starts playing
  useEffect(() => {
    if (currentSong && !currentSong.syncedLyrics) {
      fetchAndSyncLrcLyrics(currentSong).then(updatedSong => {
        if (updatedSong.syncedLyrics && updatedSong.syncedLyrics.length > 0) {
          setCurrentSong(prev => prev && prev.id === updatedSong.id ? { ...prev, syncedLyrics: updatedSong.syncedLyrics } : prev);
        }
      });
    }
  }, [currentSong?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleFavorite = useCallback((songId: string) => {
    soundEffects.playButtonClick();
    setFavoriteSongIds(prev => {
      const isFav = prev.includes(songId);
      const next = isFav ? prev.filter(id => id !== songId) : [...prev, songId];
      saveFavoriteSongIds(next);
      showToast(isFav ? '♥ Removed from Favorites' : '♥ Added to Favorites!');
      return next;
    });
    setCurrentSong(prev => {
      if (prev && prev.id === songId) {
        return { ...prev, favorite: !prev.favorite };
      }
      return prev;
    });
  }, []);

  // Reset Attract Mode Idle Timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!config.attractModeEnabled || isBooting) return;

    idleTimerRef.current = window.setTimeout(() => {
      if (!isPlaying && queue.length === 0 && !isServiceMenuOpen && !isPlaylistManagerOpen && !isBrandingModalOpen && !isPhotoBoothOpen && !isBooting) {
        setIsAttractModeActive(true);
      }
    }, config.attractModeTimeout * 1000);
  }, [config.attractModeEnabled, config.attractModeTimeout, isPlaying, queue.length, isServiceMenuOpen, isPlaylistManagerOpen, isBrandingModalOpen, isPhotoBoothOpen, isBooting]);

  // Queue next song handler with automatic Auto-DJ / Shuffle fallback
  const handlePlayNextInQueue = useCallback(() => {
    setQueue(prevQueue => {
      if (prevQueue.length > 0) {
        const nextItem = prevQueue[0];
        const remainingQueue = prevQueue.slice(1);
        setCurrentSong(nextItem.song);
        audioEngine.playSong(nextItem.song);
        soundEffects.playRecordScratch();
        return remainingQueue;
      } else if (config.autoDjEnabled && allSongs.length > 0) {
        // Intelligent Auto-DJ Transition Mixing
        const autoDjRec = selectAutoDjNextSong(allSongs, currentSong, [], config);
        if (autoDjRec) {
          setCurrentSong(autoDjRec.song);
          audioEngine.playSong(autoDjRec.song);
          soundEffects.playRecordScratch();
          showToast(`${autoDjRec.reason}: [${autoDjRec.song.code}] ${autoDjRec.song.title}`);
        } else {
          setCurrentSong(null);
          setIsPlaying(false);
        }
        return [];
      } else if (config.shuffleMode && allSongs.length > 0) {
        // Automatic Shuffle mode: pick a random song from catalog
        const availableSongs = allSongs.filter(s => !currentSong || s.id !== currentSong.id);
        const pool = availableSongs.length > 0 ? availableSongs : allSongs;
        const randomSong = pool[Math.floor(Math.random() * pool.length)];
        setCurrentSong(randomSong);
        audioEngine.playSong(randomSong);
        soundEffects.playRecordScratch();
        showToast(`🔀 Auto-Shuffle: [${randomSong.code}] ${randomSong.title}`);
        return [];
      } else {
        setCurrentSong(null);
        setIsPlaying(false);
        return [];
      }
    });
  }, [config.autoDjEnabled, config.shuffleMode, config.autoDjStrategy, config.autoDjCrossfadeMs, allSongs, currentSong]);

  // Toggle Shuffle Mode Handler
  const handleToggleShuffle = useCallback(() => {
    soundEffects.playButtonClick();
    const nextState = !config.shuffleMode;
    setConfig(prev => ({
      ...prev,
      shuffleMode: nextState
    }));

    if (nextState) {
      showToast('🔀 Continuous Shuffle Mode enabled');
      // If currently idle with empty queue, immediately trigger random song
      if (!isPlaying && queue.length === 0 && allSongs.length > 0) {
        const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        setCurrentSong(randomSong);
        audioEngine.playSong(randomSong);
        soundEffects.playRecordScratch();
      }
    } else {
      showToast('Shuffle Mode disabled');
    }
  }, [config.shuffleMode, isPlaying, queue.length, allSongs]);

  // Insert Coin Handler
  const handleInsertCoin = useCallback((coinsCount = 1) => {
    soundEffects.playCoinDrop();
    setConfig(prev => {
      const addedCredits = coinsCount * prev.songsPerCredit;
      const newTotalCredits = prev.credits + addedCredits;
      return {
        ...prev,
        credits: newTotalCredits,
        totalCoinsLifetime: prev.totalCoinsLifetime + coinsCount,
        sessionCoins: prev.sessionCoins + coinsCount
      };
    });
    showToast(`✓ Coin accepted! Credits added: ${coinsCount * config.songsPerCredit}`);
  }, [config.songsPerCredit]);

  // Queue Song
  const handleQueueSong = useCallback((song: Song) => {
    if (!config.freePlay && config.credits < 1) {
      soundEffects.playErrorBuzzer();
      setIsCoinModalOpen(true);
      showToast('⚠️ Out of credits! Insert coin or press 5');
      return;
    }

    if (!config.freePlay) {
      setConfig(prev => ({
        ...prev,
        credits: Math.max(0, prev.credits - 1),
        totalPlaysLifetime: prev.totalPlaysLifetime + 1
      }));
    }

    const newQueueItem: QueueItem = {
      queueId: `${song.id}-${Date.now()}`,
      song,
      addedAt: Date.now(),
      creditsCost: 1
    };

    setQueue(prev => {
      if (!currentSong && prev.length === 0) {
        setCurrentSong(song);
        audioEngine.playSong(song);
        soundEffects.playRecordScratch();
        return [];
      } else {
        soundEffects.playButtonClick();
        showToast(`✓ Added to queue: [${song.code}] ${song.title}`);
        return [...prev, newQueueItem];
      }
    });
  }, [config.freePlay, config.credits, currentSong]);

  // Queue Playlist
  const handleQueuePlaylist = useCallback((playlist: Playlist) => {
    const playlistSongs = allSongs.filter(s => playlist.songIds.includes(s.id));
    if (playlistSongs.length === 0) {
      showToast('⚠️ Playlist has no songs');
      return;
    }

    const neededCredits = playlistSongs.length;
    if (!config.freePlay && config.credits < neededCredits) {
      soundEffects.playErrorBuzzer();
      setIsCoinModalOpen(true);
      showToast(`⚠️ ${neededCredits} credits required to play full playlist`);
      return;
    }

    if (!config.freePlay) {
      setConfig(prev => ({
        ...prev,
        credits: Math.max(0, prev.credits - neededCredits),
        totalPlaysLifetime: prev.totalPlaysLifetime + neededCredits
      }));
    }

    const newItems: QueueItem[] = playlistSongs.map(s => ({
      queueId: `${s.id}-${Date.now()}-${Math.random()}`,
      song: s,
      addedAt: Date.now(),
      creditsCost: 1
    }));

    setQueue(prev => {
      if (!currentSong && prev.length === 0) {
        const first = newItems[0];
        const rest = newItems.slice(1);
        setCurrentSong(first.song);
        audioEngine.playSong(first.song);
        soundEffects.playRecordScratch();
        return rest;
      } else {
        return [...prev, ...newItems];
      }
    });

    showToast(`✓ Queued playlist "${playlist.name}" (${playlistSongs.length} tracks)!`);
  }, [allSongs, config.freePlay, config.credits, currentSong]);

  // Play Song By Code (e.g. A01)
  const handlePlayByCode = useCallback((trackCode: string) => {
    const match = allSongs.find(s => s.code.toUpperCase() === trackCode.toUpperCase() || s.id === trackCode);
    if (match) {
      handleQueueSong(match);
    } else {
      showToast(`⚠️ Song code ${trackCode} not found`);
    }
  }, [allSongs, handleQueueSong]);

  // Hardware Actions Handler (5-button keypad)
  const handleHardwareAction = useCallback((action: 'up' | 'down' | 'left' | 'right' | 'select' | 'coin') => {
    resetIdleTimer();
    setActiveHardwareButton(action);
    setTimeout(() => setActiveHardwareButton(null), 150);

    if (action === 'coin') {
      handleInsertCoin(1);
      return;
    }

    if (action === 'left') {
      if (viewMode === 'carousel') {
        const leftBtn = document.querySelector('button[title*="Previous Album"]') as HTMLButtonElement;
        if (leftBtn) leftBtn.click();
      } else {
        setActiveGenreIndex(prev => (prev === 0 ? GENRE_CATEGORIES.length - 1 : prev - 1));
        setSelectedSongIndex(0);
      }
    } else if (action === 'right') {
      if (viewMode === 'carousel') {
        const rightBtn = document.querySelector('button[title*="Next Album"]') as HTMLButtonElement;
        if (rightBtn) rightBtn.click();
      } else {
        setActiveGenreIndex(prev => (prev === GENRE_CATEGORIES.length - 1 ? 0 : prev + 1));
        setSelectedSongIndex(0);
      }
    } else if (action === 'up') {
      setSelectedSongIndex(prev => Math.max(0, prev - 1));
    } else if (action === 'down') {
      const activeCat = GENRE_CATEGORIES[activeGenreIndex];
      const categorySongs = allSongs.filter(s => s.genre === activeCat.id);
      setSelectedSongIndex(prev => Math.min(categorySongs.length - 1, prev + 1));
    } else if (action === 'select') {
      const activeCat = GENRE_CATEGORIES[activeGenreIndex];
      const categorySongs = allSongs.filter(s => s.genre === activeCat.id);
      if (categorySongs[selectedSongIndex]) {
        handleQueueSong(categorySongs[selectedSongIndex]);
      }
    }
  }, [resetIdleTimer, handleInsertCoin, viewMode, activeGenreIndex, selectedSongIndex, allSongs, handleQueueSong]);

  // Physical Keyboard Listener
  useEffect(() => {
    hardwareDiagnosticService.init();

    const handleKeyDown = (e: KeyboardEvent) => {
      resetIdleTimer();
      const code = e.code;
      const key = e.key;

      // Ignore global jukebox hotkeys if user is currently typing in an input element or modal overlay
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        isSearchKeyboardOpen ||
        isServiceMenuOpen ||
        isCoinModalOpen ||
        isNumberPadOpen
      ) {
        return;
      }

      // Prevent key auto-repeat from rapidly skipping through many songs
      if (e.repeat) {
        return;
      }

      // Feed event to hardware diagnostic & noise detection engine
      const { isNoise } = hardwareDiagnosticService.handleKeyEvent(e, config.keyBindings);
      if (isNoise) {
        // Suppress debounce noise / jitter chatter
        return;
      }

      // Check macro sequence triggers (e.g. 1-1-2, UP-UP-DOWN)
      let buttonToken = '';
      if (key === '1' || config.keyBindings.left.includes(code) || key === 'ArrowLeft') buttonToken = '1';
      else if (key === '2' || config.keyBindings.up.includes(code) || key === 'ArrowUp') buttonToken = '2';
      else if (key === '3' || config.keyBindings.down.includes(code) || key === 'ArrowDown') buttonToken = '3';
      else if (key === '4' || config.keyBindings.right.includes(code) || key === 'ArrowRight') buttonToken = '4';
      else if (key === '5' || config.keyBindings.select.includes(code) || key === 'Enter') buttonToken = '5';

      if (buttonToken) {
        const matchedMacro = hardwareDiagnosticService.recordAndCheckMacro(
          buttonToken,
          config.macroSequences || DEFAULT_MACRO_SEQUENCES
        );
        if (matchedMacro) {
          showToast(`⚡ MACRO TRIGGERED: [${matchedMacro.name}]`);
          if (matchedMacro.actionType === 'PLAYLIST') {
            const targetPl = playlists.find(p => p.id === matchedMacro.targetValue || p.name.toLowerCase().includes(matchedMacro.targetValue.toLowerCase()));
            if (targetPl) {
              handleQueuePlaylist(targetPl);
            } else if (playlists.length > 0) {
              handleQueuePlaylist(playlists[0]);
            }
          } else if (matchedMacro.actionType === 'COIN') {
            handleInsertCoin(1);
          } else if (matchedMacro.actionType === 'FREEPLAY') {
            setConfig(prev => ({ ...prev, freePlay: !prev.freePlay }));
          } else if (matchedMacro.actionType === 'ATTRACT') {
            setIsAttractModeActive(true);
          } else if (matchedMacro.actionType === 'CODE') {
            handlePlayByCode(matchedMacro.targetValue);
          }
        }
      }

      // H Key or Coin Binding -> Insert Coin
      if (key.toUpperCase() === 'H' || code === 'KeyH' || config.keyBindings.coin1.includes(code) || config.keyBindings.coin1.includes(key) || key === '5') {
        e.preventDefault();
        handleInsertCoin(1);
        return;
      }

      // R Key -> Skip Current Song
      if (key.toUpperCase() === 'R' || code === 'KeyR') {
        e.preventDefault();
        soundEffects.playButtonClick();
        handlePlayNextInQueue();
        showToast('⏭ Skipped track');
        return;
      }

      // T Key -> Toggle Free Play
      if (key.toUpperCase() === 'T' || code === 'KeyT') {
        e.preventDefault();
        soundEffects.playButtonClick();
        setConfig(prev => {
          const nextFP = !prev.freePlay;
          showToast(nextFP ? '🎟 Free Play Activated' : '🪙 Credits Mode Active');
          return { ...prev, freePlay: nextFP };
        });
        return;
      }

      // Service Menu (F2 or Tab)
      if (config.keyBindings.service.includes(code) || key === 'F2' || key === 'Tab') {
        e.preventDefault();
        setIsServiceMenuOpen(prev => !prev);
        return;
      }

      // A / Left Arrow -> Rotate Left
      if (key.toUpperCase() === 'A' || code === 'KeyA' || config.keyBindings.left.includes(code) || key === 'ArrowLeft') {
        e.preventDefault();
        handleHardwareAction('left');
      } 
      // D / Right Arrow -> Rotate Right
      else if (key.toUpperCase() === 'D' || code === 'KeyD' || config.keyBindings.right.includes(code) || key === 'ArrowRight') {
        e.preventDefault();
        handleHardwareAction('right');
      } 
      // Y / Up Arrow -> Navigation Up
      else if (key.toUpperCase() === 'Y' || code === 'KeyY' || config.keyBindings.up.includes(code) || key === 'ArrowUp') {
        e.preventDefault();
        handleHardwareAction('up');
      } 
      // F / Down Arrow -> Navigation Down
      else if (key.toUpperCase() === 'F' || code === 'KeyF' || config.keyBindings.down.includes(code) || key === 'ArrowDown') {
        e.preventDefault();
        handleHardwareAction('down');
      } 
      // ENTER / Space / Select -> Select/Queue
      else if (config.keyBindings.select.includes(code) || key === 'Enter' || key === ' ') {
        e.preventDefault();
        handleHardwareAction('select');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      hardwareDiagnosticService.handleKeyUpEvent(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config.keyBindings, handleHardwareAction, handleInsertCoin, resetIdleTimer, playlists, config.macroSequences, handleQueuePlaylist, handlePlayByCode]);

  // Background directory watcher for local music folder
  useEffect(() => {
    if (config.autoPollLocalDirectory ?? true) {
      localMusicScannerService.startBackgroundPolling(
        config.autoPollIntervalSeconds || 30,
        () => allSongs,
        (imported) => {
          if (imported.length > 0) {
            setCustomSongs(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const fresh = imported.filter(t => !existingIds.has(t.id));
              if (fresh.length > 0) {
                showToast(`🎵 Auto-imported ${fresh.length} new tracks from local music directory!`);
                return [...prev, ...fresh];
              }
              return prev;
            });
          }
        }
      );

      return () => {
        localMusicScannerService.stopBackgroundPolling();
      };
    } else {
      localMusicScannerService.stopBackgroundPolling();
    }
  }, [config.autoPollLocalDirectory, config.autoPollIntervalSeconds, allSongs]);

  const activeTheme = getTheme(config.skin, config.customTheme);

  return (
    <TouchTunesKioskFrame enabled={isKioskFrameEnabled || !!config.showKioskFrame}>
      <div className={`min-h-screen ${activeTheme.bgGradient} ${activeTheme.fontFamilyClass} text-gray-200 flex flex-col justify-between relative overflow-x-hidden select-none transition-all duration-300`}>
        
        {/* 1. Scrolling LED Header & Top Aurora Sound Wave Equalizer */}
        <HeaderMarquee
          config={config}
          onOpenCoinModal={() => setIsCoinModalOpen(true)}
          onOpenServiceMenu={() => setIsServiceMenuOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onToggleMute={() => setIsMuted(m => !m)}
          isMuted={isMuted}
          currentSongTitle={currentSong ? `[${currentSong.code}] ${currentSong.title} - ${currentSong.artist}` : undefined}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-cyan-500 text-black font-chakra font-black text-sm px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.9)] flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. Main Center Display Deck */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-5 flex flex-col gap-3 md:gap-4">
          
          {/* Quick-Access Top Action Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-[#0c101d]/90 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-cyan-500/20 shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              
              {/* View Mode Switcher: Classic Deck vs 3D Carousel vs Browse Catalog */}
              <div className="flex items-center bg-black/60 p-0.5 sm:p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setViewMode('classic');
                  }}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md text-[11px] sm:text-xs font-chakra font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'classic'
                      ? 'bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Classic Dual-Column Jukebox View"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>CLASSIC</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setViewMode('carousel');
                  }}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md text-[11px] sm:text-xs font-chakra font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'carousel'
                      ? 'bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Cover Flow 3D Carousel View"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3D CAROUSEL</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setViewMode('browse');
                  }}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md text-[11px] sm:text-xs font-chakra font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'browse'
                      ? 'bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="A-Z Artist Directory & Strip"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>A-Z CATALOG</span>
                </button>
              </div>

              {/* Dedicated Video Player for Clips Button */}
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  if (isCurrentSongClip) {
                    setVideoPlayerMode(prev => prev === 'closed' ? 'floating' : prev === 'floating' ? 'cinema' : 'closed');
                  } else {
                    handleSelectMediaFilter(activeMediaFilter === 'video' ? 'all' : 'video');
                    showToast(activeMediaFilter === 'video' ? 'Showing all media tracks' : '🎬 Filtered to HD Video Clips');
                  }
                }}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-chakra font-black flex items-center gap-1.5 cursor-pointer shadow transition-all ${
                  isCurrentSongClip
                    ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white border-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.8)] animate-pulse'
                    : activeMediaFilter === 'video'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                    : 'bg-[#141828] hover:bg-purple-600 hover:text-white text-purple-300 border-purple-500/30'
                }`}
                title={isCurrentSongClip ? "Toggle Video Player (Floating / Cinema Stage)" : "Show all HD Video Clips"}
              >
                <Film className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isCurrentSongClip ? 'VIDEO PLAYER' : 'CLIPS'}</span>
                {isCurrentSongClip && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                )}
              </button>

              {/* Media Sources & Video Options Button */}
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  setIsMediaSourceModalOpen(true);
                }}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-chakra font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow transition-all ${
                  activeMediaFilter === 'video'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                    : activeMediaFilter === 'audio'
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                    : 'bg-[#141828] hover:bg-purple-600 hover:text-white text-purple-300 border-purple-500/30'
                }`}
                title="Select Media Sources (Music, Videos, Local Files, Streams)"
              >
                <Film className="w-3.5 h-3.5" />
                <span className="uppercase">{activeMediaFilter === 'all' ? 'MEDIA' : activeMediaFilter.toUpperCase()}</span>
              </button>

              {/* Search Button */}
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  setIsSearchKeyboardOpen(true);
                }}
                className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-[#141828] hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-[11px] sm:text-xs font-chakra font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow transition-all"
                title="Search Artist, Track or Album"
              >
                <Search className="w-3.5 h-3.5" />
                <span>SEARCH</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content Views */}
          {viewMode === 'carousel' ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              
              {/* 3D Cover Flow Carousel Deck & Tracklist */}
              <TouchTunesCarousel
                songs={filteredBySourceSongs}
                onQueueSong={handleQueueSong}
                onOpenSearch={() => setIsSearchKeyboardOpen(true)}
                onOpenQuickNumber={() => setIsNumberPadOpen(true)}
                credits={config.credits}
                freePlay={config.freePlay}
                onToggleShuffle={handleToggleShuffle}
                isShuffleActive={config.shuffleMode ?? false}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Mini Turntable & Queue Widgets in Carousel View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-5xl mx-auto w-full">
                <NowPlayingDisplay
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onTogglePlay={() => {
                    soundEffects.playButtonClick();
                    if (isPlaying) {
                      audioEngine.pause();
                    } else {
                      audioEngine.resume();
                    }
                  }}
                  onSkipNext={() => {
                    soundEffects.playButtonClick();
                    handlePlayNextInQueue();
                  }}
                  skin={config.skin}
                  queueCount={queue.length}
                  detailedVisualFeedback={config.detailedVisualFeedback}
                  language={config.language}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenLyrics={() => setIsLyricsOpen(true)}
                  onOpenVideoStage={(stageMode) => setVideoPlayerMode(stageMode || 'floating')}
                />

                <QueueList
                  queue={queue}
                  onRemoveItem={(idx) => {
                    soundEffects.playButtonClick();
                    setQueue(prev => prev.filter((_, i) => i !== idx));
                  }}
                  onClearQueue={() => {
                    soundEffects.playButtonClick();
                    setQueue([]);
                  }}
                  skin={config.skin}
                  detailedVisualFeedback={config.detailedVisualFeedback}
                />
              </div>

            </div>
          ) : viewMode === 'browse' ? (
            /* A-Z Alphabet Strip & Catalog Grid (Photo 2 Matching) */
            <div className="flex flex-col gap-3 sm:gap-4">
              <TouchTunesBrowseDeck
                songs={filteredBySourceSongs}
                categories={GENRE_CATEGORIES}
                playlists={playlists}
                onQueueSong={handleQueueSong}
                onOpenQuickNumber={() => setIsNumberPadOpen(true)}
                credits={config.credits}
                freePlay={config.freePlay}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ) : (
            /* Classic 2-Column Responsive Deck */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 flex-1">
              
              {/* Left Column (Desktop/Tablet 7 Cols): 5-Button Genre & Song Browser */}
              <div className="md:col-span-7 flex flex-col h-full">
                <SongBrowser
                  categories={GENRE_CATEGORIES}
                  activeGenreIndex={activeGenreIndex}
                  songs={filteredBySourceSongs}
                  selectedSongIndex={selectedSongIndex}
                  focusArea={focusArea}
                  onSelectGenre={(idx) => {
                    soundEffects.playButtonClick();
                    setActiveGenreIndex(idx);
                    setSelectedSongIndex(0);
                  }}
                  onSelectSong={(idx) => {
                    soundEffects.playButtonClick();
                    setSelectedSongIndex(idx);
                    setFocusArea('song-list');
                  }}
                  onQueueSong={handleQueueSong}
                  skin={config.skin}
                  credits={config.credits}
                  freePlay={config.freePlay}
                  playlists={playlists}
                  activePlaylistId={activePlaylistId}
                  onSelectPlaylist={(plId) => {
                    soundEffects.playButtonClick();
                    setActivePlaylistId(plId);
                    setSelectedSongIndex(0);
                  }}
                  onOpenPlaylistManager={() => setIsPlaylistManagerOpen(true)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>

              {/* Right Column (Desktop/Tablet 5 Cols): Turntable + Visualizer + Queue */}
              <div className="md:col-span-5 flex flex-col gap-3 sm:gap-4">
                <div className="flex-1 min-h-[240px] sm:min-h-[280px]">
                  <NowPlayingDisplay
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onTogglePlay={() => {
                      soundEffects.playButtonClick();
                      if (isPlaying) {
                        audioEngine.pause();
                      } else {
                        audioEngine.resume();
                      }
                    }}
                    onSkipNext={() => {
                      soundEffects.playButtonClick();
                      handlePlayNextInQueue();
                    }}
                    skin={config.skin}
                    queueCount={queue.length}
                    detailedVisualFeedback={config.detailedVisualFeedback}
                    language={config.language}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenLyrics={() => setIsLyricsOpen(true)}
                    onOpenVideoStage={(stageMode) => setVideoPlayerMode(stageMode || 'floating')}
                  />
                </div>

                <div className="min-h-[170px] sm:min-h-[190px]">
                  <QueueList
                    queue={queue}
                    onRemoveItem={(idx) => {
                      soundEffects.playButtonClick();
                      setQueue(prev => prev.filter((_, i) => i !== idx));
                    }}
                    onClearQueue={() => {
                      soundEffects.playButtonClick();
                      setQueue([]);
                    }}
                    skin={config.skin}
                    detailedVisualFeedback={config.detailedVisualFeedback}
                  />
                </div>
              </div>

            </div>
          )}

        </main>

        {/* Commercial Navigation Dock (Optional, disabled by default) */}
        {config.showCommercialDock && (
          <TouchTunesCommercialDock
            activeTab={
              viewMode === 'carousel' ? 'top-played' :
              viewMode === 'browse' ? 'browse' :
              'home'
            }
            onSelectTab={(tab) => {
              if (tab === 'home') setViewMode('classic');
              else if (tab === 'browse') setViewMode('browse');
              else if (tab === 'top-played') setViewMode('carousel');
              else if (tab === 'search') setIsSearchKeyboardOpen(true);
              else if (tab === 'photobooth') setIsPhotoBoothOpen(true);
              else if (tab === 'more') setIsServiceMenuOpen(true);
            }}
            onOpenCoinModal={() => setIsCoinModalOpen(true)}
            onOpenMediaSources={() => setIsMediaSourceModalOpen(true)}
            queueCount={queue.length}
            language={config.language}
            title={config.branding?.title}
          />
        )}

        {/* Lower Cabinet Body: Horizontal Blue LED Beam + Working Coin Acceptor Window & 5-Button Pad */}
        <TouchTunesLowerCabinet
          onPressButton={handleHardwareAction}
          activeButton={activeHardwareButton}
          keyBindings={config.keyBindings}
          credits={config.credits}
          freePlay={config.freePlay}
          currencySymbol={config.currencySymbol}
          lowCreditNudgeEnabled={config.lowCreditNudgeEnabled}
          lowCreditNudgeStyle={config.lowCreditNudgeStyle}
        />

        {/* 5. Modals & Screens */}
        
        {/* Coin Drop Modal */}
        <CoinDropModal
          isOpen={isCoinModalOpen}
          onClose={() => setIsCoinModalOpen(false)}
          onInsertCoin={(amt) => handleInsertCoin(amt)}
          onToggleFreePlay={() => {
            setConfig(c => ({ ...c, freePlay: !c.freePlay }));
            soundEffects.playButtonClick();
          }}
          config={config}
        />

        {/* 2-Drum Number Pad Selector */}
        <NumberPadSelector
          isOpen={isNumberPadOpen}
          onClose={() => setIsNumberPadOpen(false)}
          songs={allSongs}
          onQueueSong={handleQueueSong}
        />

        {/* 5-Button Virtual Matrix Keyboard */}
        <VirtualKeyboard5Btn
          isOpen={isSearchKeyboardOpen}
          onClose={() => setIsSearchKeyboardOpen(false)}
          onSearch={(query) => {
            if (!query.trim()) return;
            const match = allSongs.find(s => 
              s.title.toLowerCase().includes(query.toLowerCase()) || 
              s.artist.toLowerCase().includes(query.toLowerCase())
            );
            if (match) {
              handleQueueSong(match);
            } else {
              showToast(`No tracks found for "${query}"`);
            }
          }}
        />

        {/* Service & Technician Menu */}
        <ServiceMenuModal
          isOpen={isServiceMenuOpen}
          onClose={() => setIsServiceMenuOpen(false)}
          config={config}
          onUpdateConfig={(newConf) => setConfig(newConf)}
          customSongs={customSongs}
          onAddCustomSongs={(newSongs) => {
            const updated = [...customSongs, ...newSongs];
            setCustomSongs(updated);
            saveCustomSongs(updated);
            showToast(`✓ Added ${newSongs.length} custom tracks to machine library!`);
          }}
          onClearCustomSongs={() => {
            setCustomSongs([]);
            saveCustomSongs([]);
            showToast('Custom tracks cleared');
          }}
          onResetLifetimeStats={() => {
            setConfig(c => ({ ...c, sessionCoins: 0 }));
            showToast('Session coin counter reset');
          }}
          playlists={playlists}
          onUpdatePlaylists={(updated) => {
            setPlaylists(updated);
            savePlaylists(updated);
            showToast('✓ Playlists updated and saved');
          }}
          allSongs={allSongs}
          onTriggerBootSequence={() => setIsBooting(true)}
        />

        {/* Playlist Manager Modal */}
        <PlaylistManagerModal
          isOpen={isPlaylistManagerOpen}
          onClose={() => setIsPlaylistManagerOpen(false)}
          playlists={playlists}
          allSongs={allSongs}
          skin={config.skin}
          activePlaylistId={activePlaylistId}
          onSavePlaylists={(updated) => {
            setPlaylists(updated);
            savePlaylists(updated);
            showToast('✓ Playlists saved');
          }}
          onQueueSong={handleQueueSong}
          onQueuePlaylist={handleQueuePlaylist}
        />

        {/* Owner Customization & Branding Modal */}
        <OwnerCustomizationModal
          isOpen={isBrandingModalOpen}
          onClose={() => setIsBrandingModalOpen(false)}
          config={config}
          onUpdateConfig={(newConf) => {
            setConfig(newConf);
            showToast('✓ Branding and theme settings updated');
          }}
        />

        {/* Photo Booth Modal */}
        <PhotoBoothModal
          isOpen={isPhotoBoothOpen}
          onClose={() => setIsPhotoBoothOpen(false)}
          machineTitle={config.branding?.title || 'TouchTunes Playdium'}
        />

        {/* Attract Mode Screensaver */}
        {isAttractModeActive && (
          <AttractMode
            onDismiss={() => setIsAttractModeActive(false)}
            onInsertCoin={() => {
              setIsAttractModeActive(false);
              handleInsertCoin(1);
            }}
            credits={config.credits}
            freePlay={config.freePlay}
          />
        )}

        {/* Help & Hardware Wiring Guide */}
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />

        {/* Mobile Remote Overlay */}
        <MobileRemoteOverlay
          isOpen={isMobileRemoteOpen}
          onClose={() => setIsMobileRemoteOpen(false)}
          config={config}
          currentSong={currentSong}
          isPlaying={isPlaying}
          queue={queue}
          allSongs={allSongs}
          onQueueSong={handleQueueSong}
          onTogglePlay={() => {
            if (isPlaying) audioEngine.pause();
            else audioEngine.resume();
          }}
          onSkipNext={handlePlayNextInQueue}
          onSetVolume={(vol) => setConfig(prev => ({ ...prev, volume: vol }))}
          onInsertCoin={(count) => handleInsertCoin(count)}
        />

        {/* Scrollable Synchronized Lyrics Overlay */}
        <LyricsOverlay
          isOpen={isLyricsOpen}
          onClose={() => setIsLyricsOpen(false)}
          currentSong={currentSong}
          currentTime={currentTime}
          duration={duration}
          onSeek={(time) => {
            audioEngine.seek(time);
          }}
        />

        {/* Global CRT Scanlines & Phosphor Glow Overlay */}
        <CrtScanlineOverlay
          scanlinesEnabled={config.crtScanlinesEnabled ?? config.scanlinesEnabled ?? true}
          phosphorGlowEnabled={config.phosphorGlowEnabled ?? true}
        />

        {/* Fullscreen Theme Startup Boot Sequence */}
        {isBooting && (
          <BootSequenceOverlay
            config={config}
            onComplete={() => setIsBooting(false)}
          />
        )}

        {/* Cinema Video Jukebox Stage Modal */}
        {videoPlayerMode === 'cinema' && (
          <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
            <div className="max-w-5xl w-full flex flex-col gap-2">
              <VideoJukeboxStage
                currentSong={currentSong}
                isPlaying={isPlaying}
                isMuted={isMuted}
                mode="cinema"
                onToggleMode={(newMode) => setVideoPlayerMode(newMode)}
                onTogglePlay={() => {
                  if (isPlaying) audioEngine.pause();
                  else audioEngine.resume();
                }}
                onSkipNext={handlePlayNextInQueue}
                onToggleMute={() => setIsMuted(m => !m)}
                onClose={() => setVideoPlayerMode('closed')}
              />
            </div>
          </div>
        )}

        {/* Floating Picture-in-Picture Video Player for Clips */}
        {videoPlayerMode === 'floating' && (
          <VideoJukeboxStage
            currentSong={currentSong}
            isPlaying={isPlaying}
            isMuted={isMuted}
            mode="floating"
            isMinimized={isVideoMinimized}
            onToggleMinimize={() => setIsVideoMinimized(v => !v)}
            onToggleMode={(newMode) => setVideoPlayerMode(newMode)}
            onTogglePlay={() => {
              if (isPlaying) audioEngine.pause();
              else audioEngine.resume();
            }}
            onSkipNext={handlePlayNextInQueue}
            onToggleMute={() => setIsMuted(m => !m)}
            onClose={() => setVideoPlayerMode('closed')}
          />
        )}

        {/* Media Source & Format Selector Modal */}
        <MediaSourceSelectorModal
          isOpen={isMediaSourceModalOpen}
          onClose={() => setIsMediaSourceModalOpen(false)}
          activeFilter={activeMediaFilter}
          onSelectFilter={handleSelectMediaFilter}
          allSongs={allSongs}
          customSongs={customSongs}
          onImportSongs={handleImportMediaSongs}
          onClearCustomSongs={handleClearCustomSongs}
          onOpenVideoStage={() => {
            setIsMediaSourceModalOpen(false);
            setVideoPlayerMode('floating');
          }}
        />

      </div>
    </TouchTunesKioskFrame>
  );
}
