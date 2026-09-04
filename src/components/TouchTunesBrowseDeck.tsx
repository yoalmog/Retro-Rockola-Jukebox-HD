import React, { useState } from 'react';
import { Song, GenreCategory, Playlist } from '../types/rockola';
import { soundEffects } from '../services/soundEffects';
import { getSongCoverArt, generateComingSoonCoverArt } from '../utils/coverArtUtils';
import { Search, Plus, Play, Hash, Disc, Music, Check, Sparkles, Heart } from 'lucide-react';

interface TouchTunesBrowseDeckProps {
  songs: Song[];
  categories: GenreCategory[];
  playlists: Playlist[];
  onQueueSong: (song: Song) => void;
  onOpenQuickNumber: () => void;
  credits: number;
  freePlay: boolean;
  onToggleFavorite?: (songId: string) => void;
}

const ALPHABET = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const TouchTunesBrowseDeck: React.FC<TouchTunesBrowseDeckProps> = ({
  songs,
  categories,
  playlists,
  onQueueSong,
  onOpenQuickNumber,
  credits,
  freePlay,
  onToggleFavorite
}) => {
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);

  // Filter songs by letter, category, and search query
  const filteredSongs = songs.filter(song => {
    const matchesLetter = selectedLetter === 'ALL' || song.artist.toUpperCase().startsWith(selectedLetter) || song.title.toUpperCase().startsWith(selectedLetter);
    const matchesCategory = selectedCategory === 'all' || song.genre === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) || 
      song.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 select-none">
      
      {/* 1. Upper Control Bar: A-Z Alphabet Strip (Photo 2 Matching - NSM / Touch Jukebox) */}
      <div className="bg-[#0b0e1c] p-2.5 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 text-xs font-chakra">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            ARTIST A-Z DIRECTORY
          </span>
          <span className="text-gray-400 font-mono">{filteredSongs.length} tracks found</span>
        </div>

        {/* Horizontal Scrollable Alphabet Button Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500">
          {ALPHABET.map(letter => {
            const isActive = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => {
                  soundEffects.playButtonClick();
                  setSelectedLetter(letter);
                  setSelectedSongIndex(0);
                }}
                className={`min-w-[32px] h-8 rounded-lg font-mono font-black text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-105'
                    : 'bg-[#12172a] text-gray-300 hover:text-white hover:bg-[#1a223e] border border-white/5'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Genre Categories Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            soundEffects.playButtonClick();
            setSelectedCategory('all');
            setSelectedSongIndex(0);
          }}
          className={`px-4 py-1.5 rounded-xl font-chakra font-bold text-xs shrink-0 cursor-pointer transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'bg-[#0e1224] text-gray-300 border border-white/10 hover:border-cyan-400'
          }`}
        >
          🌟 All Genres
        </button>

        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundEffects.playButtonClick();
                setSelectedCategory(cat.id);
                setSelectedSongIndex(0);
              }}
              className={`px-4 py-1.5 rounded-xl font-chakra font-bold text-xs shrink-0 cursor-pointer transition-all ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'bg-[#0e1224] text-gray-300 border border-white/10 hover:border-cyan-400'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 3. Songs Catalog Grid Deck */}
      <div className="bg-[#0a0d1a]/95 rounded-2xl border border-cyan-500/30 p-3 sm:p-4 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-h-[280px] sm:max-h-[340px] md:max-h-[400px] overflow-y-auto pr-1">
          {filteredSongs.map((song, idx) => {
            const isSelected = selectedSongIndex === idx;

            return (
              <div
                key={song.id}
                onClick={() => setSelectedSongIndex(idx)}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-[#0e1224]/80 border-white/5 hover:border-cyan-500/40 hover:bg-[#141b34]'
                }`}
              >
                {/* Left: Code badge & thumbnail & metadata */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 w-10 h-10 rounded-lg bg-black/90 border border-cyan-500/40 text-cyan-300 font-mono font-black text-sm flex items-center justify-center shadow-inner">
                    {song.code}
                  </span>

                  {/* Album Cover Thumbnail */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
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
                      <div className="absolute top-0.5 right-0.5 px-0.5 bg-amber-500 text-black font-mono font-black text-[6px] rounded uppercase shadow">
                        NEW
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate font-chakra">
                      {song.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {song.artist}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite && onToggleFavorite(song.id);
                    }}
                    className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                      song.favorite
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-black/60 hover:bg-rose-500/20 border-white/10 text-gray-400 hover:text-rose-400'
                    }`}
                    title={song.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${song.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQueueSong(song);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-chakra font-black text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.5)] cursor-pointer shrink-0 transition-all"
                    title="Queue & Play Track"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>PLAY</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
