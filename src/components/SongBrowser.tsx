import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, GenreCategory, SkinType, FocusArea, Playlist } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { getSongCoverArt, generateComingSoonCoverArt } from '../utils/coverArtUtils';
import { 
  Flame, Sparkles, Music, Radio, Disc, Guitar, Plus, 
  Play, Clock, BarChart2, ListMusic, Layers, Heart
} from 'lucide-react';

interface SongBrowserProps {
  categories: GenreCategory[];
  activeGenreIndex: number;
  songs: Song[];
  selectedSongIndex: number;
  focusArea: FocusArea;
  onSelectGenre: (index: number) => void;
  onSelectSong: (index: number) => void;
  onQueueSong: (song: Song) => void;
  skin: SkinType;
  credits: number;
  freePlay: boolean;
  playlists?: Playlist[];
  onOpenPlaylistStudio?: () => void;
  onQueuePlaylist?: (playlist: Playlist) => void;
  activePlaylistId?: string;
  onSelectPlaylist?: (playlistId: string) => void;
  onOpenPlaylistManager?: () => void;
  detailedVisualFeedback?: boolean;
  onToggleFavorite?: (songId: string) => void;
}

export const SongBrowser: React.FC<SongBrowserProps> = ({
  categories,
  activeGenreIndex,
  songs,
  selectedSongIndex,
  focusArea,
  onSelectGenre,
  onSelectSong,
  onQueueSong,
  skin,
  credits,
  freePlay,
  playlists = [],
  onOpenPlaylistStudio,
  onQueuePlaylist,
  detailedVisualFeedback = false,
  onToggleFavorite
}) => {
  const theme = getTheme(skin);
  const isPlaylistsTab = activeGenreIndex === categories.length; // Extra tab for playlists

  // If on playlists tab, get songs from the current selected playlist (or show all playlists)
  const currentCategory = !isPlaylistsTab ? categories[activeGenreIndex] || categories[0] : null;
  const filteredSongs = !isPlaylistsTab 
    ? (currentCategory?.id === 'favorites'
        ? songs.filter(s => s.favorite)
        : songs.filter(s => s.genre === currentCategory?.id))
    : [];

  const getGenreIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Radio': return <Radio className="w-3.5 h-3.5" />;
      case 'Disc': return <Disc className="w-3.5 h-3.5" />;
      case 'Guitar': return <Guitar className="w-3.5 h-3.5" />;
      case 'Heart': return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Music className="w-3.5 h-3.5" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="flex flex-col h-full gap-3 select-none">
      
      {/* 1. Genre & Playlists Category Selector Bar (Controlled by Left / Right buttons) */}
      <div className={`${theme.cardBg} rounded-xl p-1.5 border ${theme.cardBorder} shadow-lg transition-colors duration-300`}>
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat, idx) => {
            const isActive = idx === activeGenreIndex;
            const isFocused = focusArea === 'genre-nav' && isActive;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectGenre(idx)}
                className={`flex-1 min-w-[100px] md:min-w-[115px] px-2.5 py-2 rounded-lg flex items-center justify-center gap-1.5 font-chakra font-bold text-xs md:text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? `${theme.primaryAccent} text-[#0A0A0A] font-black ${theme.accentGlow} border ${theme.highlightBorder} scale-[1.02]`
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-gray-200 hover:bg-[#222222] border border-white/5'
                } ${isFocused ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#0A0A0A]' : ''}`}
              >
                {getGenreIcon(cat.iconName)}
                <span className="truncate">{cat.nameHe || cat.name}</span>
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                  isActive ? 'bg-black/30 text-black font-extrabold' : 'bg-black/60 text-amber-400'
                }`}>
                  {cat.badge}
                </span>
              </button>
            );
          })}

          {/* Dedicated Playlists Tab */}
          <button
            onClick={() => onSelectGenre(categories.length)}
            className={`min-w-[120px] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-chakra font-bold text-xs md:text-sm transition-all duration-150 cursor-pointer ${
              isPlaylistsTab
                ? `${theme.primaryAccent} text-[#0A0A0A] font-black ${theme.accentGlow} border ${theme.highlightBorder} scale-[1.02]`
                : 'bg-[#1E140C] text-amber-300 hover:text-white hover:bg-[#2A1A0F] border border-amber-500/20'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="truncate">Playlists</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/60 text-amber-400 font-extrabold">
              {playlists.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Songs Track List Matrix OR Playlists Matrix (Controlled by Up / Down + OK/Select) */}
      <div className={`flex-1 ${theme.cardBg} rounded-xl p-2.5 sm:p-4 border ${theme.cardBorder} shadow-2xl overflow-y-auto min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex flex-col justify-between transition-colors duration-300`}>
        
        {/* If Playlists Tab is Active */}
        {isPlaylistsTab ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                  <span>CUSTOM PLAYLISTS</span>
                </h3>
                <p className="text-xs text-gray-400 font-chakra">
                  Select a playlist for direct playback or open the Playlist Studio
                </p>
              </div>

              {onOpenPlaylistStudio && (
                <button
                  onClick={onOpenPlaylistStudio}
                  className={`px-3 py-1.5 rounded-xl ${theme.primaryAccent} text-black font-chakra font-bold text-xs flex items-center gap-1 shadow cursor-pointer`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Playlist Studio</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {playlists.map((pl, idx) => {
                  const isSelected = idx === selectedSongIndex;
                  const isSongAreaFocused = focusArea === 'song-list';

                  return (
                    <motion.div
                      key={pl.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        onSelectSong(idx);
                        if (onQueuePlaylist) onQueuePlaylist(pl);
                      }}
                      className={`relative rounded-xl p-3 flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                        isSelected && isSongAreaFocused
                          ? `bg-[#1A1A1A] border-2 ${theme.highlightBorder} ${theme.accentGlow} scale-[1.01]`
                          : 'bg-[#141414] border border-white/5 hover:border-white/20 hover:bg-[#181818]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                        <img src={pl.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'} alt={pl.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                            {pl.name}
                          </h4>
                          {pl.isPreset && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              PRESET
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-chakra truncate mt-0.5">{pl.description}</p>
                        <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                          {pl.songIds.length} tracks
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onQueuePlaylist) onQueuePlaylist(pl);
                        }}
                        className={`px-3 py-1.5 rounded-lg ${theme.primaryAccent} text-black font-chakra font-bold text-xs flex items-center gap-1 shadow cursor-pointer shrink-0`}
                        title="Play Entire Playlist"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play All</span>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2 font-chakra">
            <Music className="w-10 h-10 text-amber-500/40 animate-bounce" />
            <p className="text-sm font-semibold text-gray-400">No tracks in this genre</p>
            <p className="text-xs text-gray-600">You can load audio files via the Service Menu (F2)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredSongs.map((song, idx) => {
                const isSelected = idx === selectedSongIndex;
                const isSongAreaFocused = focusArea === 'song-list';

                return (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      onSelectSong(idx);
                      onQueueSong(song);
                    }}
                    className={`relative rounded-xl p-3 flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                      isSelected && isSongAreaFocused
                        ? `bg-[#1A1A1A] border-2 ${theme.highlightBorder} ${theme.accentGlow} scale-[1.01]`
                        : isSelected
                        ? `bg-[#1A1A1A] border ${theme.highlightBorder} text-gray-200`
                        : 'bg-[#141414] border border-white/5 hover:border-white/20 hover:bg-[#181818] text-gray-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                  {/* Selected Pill Badge */}
                  {isSelected && isSongAreaFocused && (
                    <div className={`absolute -top-2.5 -left-1.5 ${theme.primaryAccent} text-[#0A0A0A] px-2 py-0.5 ${
                      detailedVisualFeedback ? 'text-[11px] font-black tracking-widest' : 'text-[9px] font-black'
                    } uppercase rounded shadow font-chakra`}>
                      Selected
                    </div>
                  )}

                  {/* Track Code Badge */}
                  <div className={`${
                    detailedVisualFeedback ? 'w-14 h-14 text-sm' : 'w-11 h-11 text-xs'
                  } rounded-lg flex flex-col items-center justify-center font-mono font-bold shrink-0 border ${
                    isSelected && isSongAreaFocused
                      ? `${theme.primaryAccent} text-[#0A0A0A] border-amber-300 shadow-md`
                      : `bg-[#1A1A1A] ${theme.primaryAccentText} border-white/10`
                  }`}>
                    <span className="leading-none">{song.code}</span>
                    <span className="text-[7px] uppercase tracking-tighter opacity-75 font-sans mt-0.5">TRACK</span>
                  </div>

                  {/* Album Cover Thumbnail */}
                  <div className={`relative ${
                    detailedVisualFeedback ? 'w-14 h-14' : 'w-12 h-12'
                  } bg-[#252525] rounded-lg overflow-hidden shrink-0 border border-white/10 flex items-center justify-center shadow-inner`}>
                    <img
                      src={getSongCoverArt(song)}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = generateComingSoonCoverArt(song.title, song.artist);
                      }}
                    />
                    {(song.isNewlyImported || song.isImported) && (!song.coverArt && !song.albumArtUrl) && (
                      <div className="absolute top-0.5 right-0.5 px-1 py-0.2 bg-amber-500 text-black text-[7px] font-mono font-black rounded uppercase shadow">
                        NEW
                      </div>
                    )}
                    {isSelected && isSongAreaFocused && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <Play className="w-5 h-5 text-amber-300 fill-amber-300 drop-shadow animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Song & Artist Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold truncate leading-tight ${
                      detailedVisualFeedback ? 'text-base sm:text-lg md:text-xl' : 'text-sm md:text-base'
                    } ${
                      isSelected && isSongAreaFocused ? 'text-white' : 'text-gray-200'
                    }`}>
                      {song.title}
                    </h3>
                    <p className={`truncate font-chakra ${
                      detailedVisualFeedback ? 'text-xs sm:text-sm text-gray-300 font-semibold mt-1' : 'text-xs text-gray-400 mt-0.5'
                    }`}>
                      {song.artist}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1 flex-wrap">
                      {(song.mediaType === 'video' || Boolean(song.videoUrl)) && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-600 text-white font-chakra font-black text-[8px] tracking-wider">
                          🎬 VIDEO
                        </span>
                      )}
                      {(song.mediaSource === 'local-file' || song.mediaSource === 'local-folder' || song.isCustom) && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-chakra font-bold text-[8px]">
                          💾 LOCAL
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDuration(song.duration)}
                      </span>
                      {detailedVisualFeedback && song.year && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400/90 font-bold">{song.year}</span>
                        </>
                      )}
                      {detailedVisualFeedback && song.album && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 truncate max-w-[140px]">{song.album}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <BarChart2 className="w-2.5 h-2.5" />
                        {song.playCount} plays
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Favorite + Add to Queue */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite && onToggleFavorite(song.id);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        song.favorite
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                          : 'bg-[#1A1A1A] hover:bg-rose-500/20 border-white/10 text-gray-400 hover:text-rose-400'
                      }`}
                      title={song.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${song.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSong(idx);
                        onQueueSong(song);
                      }}
                      className={`px-3 py-2 rounded-lg flex items-center gap-1 font-chakra font-bold transition-all shrink-0 cursor-pointer ${
                        detailedVisualFeedback ? 'text-sm' : 'text-xs'
                      } ${
                        isSelected && isSongAreaFocused
                          ? `${theme.primaryAccent} text-black shadow-lg`
                          : `bg-[#1A1A1A] hover:${theme.primaryAccent} text-gray-300 hover:text-black border border-white/10`
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Play</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        )}

        {/* 3. 5-Button Hardware Navigation Helper Strip */}
        <div className={`mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between font-chakra gap-2 ${
          detailedVisualFeedback ? 'text-sm text-gray-400' : 'text-xs text-gray-500'
        }`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className={`px-2 py-0.5 rounded bg-[#1A1A1A] border border-white/10 text-amber-400 font-mono font-bold ${
                detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
              }`}>↑ ↓</kbd>
              <span className="text-gray-300 font-medium">Select Song (Up/Down)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className={`px-2 py-0.5 rounded bg-[#1A1A1A] border border-white/10 text-amber-400 font-mono font-bold ${
                detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
              }`}>← →</kbd>
              <span className="text-gray-300 font-medium">Switch Genre / Playlist</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className={`px-2 py-0.5 rounded ${theme.primaryAccent} text-black font-mono font-extrabold ${
                detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
              }`}>OK / ENTER</kbd>
              <span className="text-white font-bold">Add to Queue</span>
            </span>
          </div>

          <div className={`font-mono font-bold ${detailedVisualFeedback ? 'text-sm text-amber-300' : 'text-xs text-amber-400'}`}>
            {freePlay ? '✓ FREE PLAY MODE' : `CREDIT COST: 1 | REMAINING: ${credits}`}
          </div>
        </div>

      </div>

    </div>
  );
};

