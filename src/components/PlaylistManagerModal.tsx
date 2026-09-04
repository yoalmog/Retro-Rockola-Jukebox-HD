import React, { useState } from 'react';
import { Playlist, Song, SkinType } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { soundEffects } from '../services/soundEffects';
import { 
  ListMusic, Plus, Trash2, ArrowUp, ArrowDown, Play, 
  X, Edit3, Sparkles, Download, Upload, Check, Music,
  FolderPlus, Clock, Disc, Copy
} from 'lucide-react';

interface PlaylistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  allSongs: Song[];
  skin: SkinType;
  activePlaylistId?: string;
  onSavePlaylists: (updated: Playlist[]) => void;
  onQueueSong: (song: Song) => void;
  onQueuePlaylist: (playlist: Playlist) => void;
}

export const PlaylistManagerModal: React.FC<PlaylistManagerModalProps> = ({
  isOpen,
  onClose,
  playlists,
  allSongs,
  skin,
  activePlaylistId,
  onSavePlaylists,
  onQueueSong,
  onQueuePlaylist
}) => {
  const theme = getTheme(skin);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    activePlaylistId || (playlists[0] ? playlists[0].id : '')
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [searchSongQuery, setSearchSongQuery] = useState('');
  
  // New playlist form state
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [newPlaylistTheme, setNewPlaylistTheme] = useState<string>('wild-west');

  if (!isOpen) return null;

  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];
  
  // Resolve actual song objects in order
  const playlistSongs: Song[] = currentPlaylist 
    ? currentPlaylist.songIds
        .map(id => allSongs.find(s => s.id === id))
        .filter((s): s is Song => Boolean(s))
    : [];

  const totalDurationSeconds = playlistSongs.reduce((acc, s) => acc + s.duration, 0);
  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins} min ${remainingSec > 0 ? remainingSec + ' sec' : ''}`;
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    soundEffects.playButtonClick();
    
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      nameHe: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom Playlist',
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      theme: newPlaylistTheme,
      isPreset: false
    };

    const updated = [...playlists, newPl];
    onSavePlaylists(updated);
    setSelectedPlaylistId(newPl.id);
    setIsCreatingNew(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
  };

  const handleDeletePlaylist = (id: string) => {
    soundEffects.playButtonClick();
    const updated = playlists.filter(p => p.id !== id);
    onSavePlaylists(updated);
    if (updated.length > 0) {
      setSelectedPlaylistId(updated[0].id);
    }
  };

  const handleDuplicatePlaylist = (pl: Playlist) => {
    soundEffects.playButtonClick();
    const clone: Playlist = {
      ...pl,
      id: `pl-${Date.now()}`,
      name: `${pl.name} (Copy)`,
      nameHe: `${pl.name} (Copy)`,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [...playlists, clone];
    onSavePlaylists(updated);
    setSelectedPlaylistId(clone.id);
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    if (!currentPlaylist) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentPlaylist.songIds.length) return;

    soundEffects.playButtonClick();
    const newSongIds = [...currentPlaylist.songIds];
    const [moved] = newSongIds.splice(index, 1);
    newSongIds.splice(newIndex, 0, moved);

    const updatedPlaylists = playlists.map(p => 
      p.id === currentPlaylist.id 
        ? { ...p, songIds: newSongIds, updatedAt: Date.now() } 
        : p
    );
    onSavePlaylists(updatedPlaylists);
  };

  const handleRemoveSongFromPlaylist = (songId: string) => {
    if (!currentPlaylist) return;
    soundEffects.playButtonClick();
    const newSongIds = currentPlaylist.songIds.filter(id => id !== songId);
    const updatedPlaylists = playlists.map(p => 
      p.id === currentPlaylist.id 
        ? { ...p, songIds: newSongIds, updatedAt: Date.now() } 
        : p
    );
    onSavePlaylists(updatedPlaylists);
  };

  const handleAddSongToPlaylist = (song: Song) => {
    if (!currentPlaylist) return;
    if (currentPlaylist.songIds.includes(song.id)) return;
    soundEffects.playSongSelect();

    const newSongIds = [...currentPlaylist.songIds, song.id];
    const updatedPlaylists = playlists.map(p => 
      p.id === currentPlaylist.id 
        ? { ...p, songIds: newSongIds, updatedAt: Date.now() } 
        : p
    );
    onSavePlaylists(updatedPlaylists);
  };

  // Export Playlist to JSON
  const handleExportJSON = (pl: Playlist) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pl, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `playlist_${pl.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Filter songs for adding
  const availableSongsToAdd = allSongs.filter(s => {
    const notInPlaylist = currentPlaylist ? !currentPlaylist.songIds.includes(s.id) : true;
    const matchesSearch = searchSongQuery.trim() === '' || 
      s.title.toLowerCase().includes(searchSongQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchSongQuery.toLowerCase());
    return notInPlaylist && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className={`${theme.cardBg} border-2 ${theme.headerBorder} rounded-2xl max-w-5xl w-full h-[90vh] max-h-[760px] shadow-2xl flex flex-col overflow-hidden relative text-gray-200`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${theme.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.primaryAccent} text-black font-bold shadow-md`}>
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <span>PLAYLIST STUDIO</span>
                <span className="text-xs px-2 py-0.5 rounded bg-black/40 text-amber-400 font-mono">
                  {playlists.length} playlists
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-chakra">
                Create, customize, reorder tracks, and export themed playlists
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-black/40 text-gray-400 hover:text-white border border-white/10 hover:border-amber-400 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left / Playlists Navigation Sidebar (4 cols) */}
          <div className="md:col-span-4 bg-black/40 border-r border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-chakra">
                  Playlists
                </span>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className={`px-2.5 py-1 rounded-lg ${theme.primaryAccent} text-black font-chakra font-bold text-xs flex items-center gap-1 shadow cursor-pointer transition-all`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* Playlists List */}
              <div className="space-y-2">
                {playlists.map(pl => {
                  const isSelected = pl.id === currentPlaylist?.id;
                  return (
                    <div
                      key={pl.id}
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setSelectedPlaylistId(pl.id);
                        setIsAddingSongs(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? `${theme.cardBg} ${theme.highlightBorder} shadow-lg ring-1 ring-amber-400/50`
                          : 'bg-[#141414]/70 border-white/5 hover:border-white/20 hover:bg-[#181818]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10">
                        <img 
                          src={pl.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'} 
                          alt={pl.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {pl.name}
                          </h4>
                          {pl.isPreset && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              PRESET
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {pl.songIds.length} tracks
                        </p>
                      </div>

                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${theme.primaryAccent}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Quick Help Info */}
            <div className="mt-4 p-3 rounded-xl bg-[#0A0A0A] border border-white/10 text-[11px] text-gray-400 font-chakra">
              <p className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Jukebox Tip:
              </p>
              Playlists can be queued in their entirety with a single touch, or assigned to specific venue events and themes.
            </div>

          </div>

          {/* Right / Playlist Details & Track Manager (8 cols) */}
          <div className="md:col-span-8 p-4 md:p-6 flex flex-col justify-between overflow-y-auto">
            
            {/* Create New Playlist Form Overlay */}
            {isCreatingNew ? (
              <div className="bg-[#101010] p-5 rounded-2xl border border-amber-500/50 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-amber-400" />
                    Create New Playlist
                  </h3>
                  <button 
                    onClick={() => setIsCreatingNew(false)}
                    className="p-1 rounded text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1 font-chakra">Playlist Name:</label>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="e.g. Happy Hour Hits / Rock Party"
                      className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1 font-chakra">Short Description:</label>
                    <input
                      type="text"
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      placeholder="Atmosphere or genre notes"
                      className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1 font-chakra">Visual Theme:</label>
                    <select
                      value={newPlaylistTheme}
                      onChange={(e) => setNewPlaylistTheme(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-amber-400 focus:outline-none focus:border-amber-400"
                    >
                      <option value="wild-west">🤠 Wild West Saloon</option>
                      <option value="salsa-latino">💃 Havana Salsa Fiesta</option>
                      <option value="heavy-rock">🎸 Heavy Rock Legends</option>
                      <option value="classic-wood">📻 Wurlitzer 50s Vinyl</option>
                      <option value="neon-arcade">🕹️ Cyber Synthwave 80s</option>
                      <option value="rockolas-peru">💎 Costco Pro Dark</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="px-4 py-2 rounded-xl bg-[#1C1C1C] text-gray-300 font-chakra text-xs hover:bg-[#252525] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                    className={`px-5 py-2 rounded-xl ${theme.primaryAccent} text-black font-chakra font-bold text-xs shadow-md cursor-pointer disabled:opacity-50`}
                  >
                    Save Playlist
                  </button>
                </div>
              </div>
            ) : currentPlaylist ? (
              <div className="flex flex-col h-full gap-4">
                
                {/* Playlist Info Header & Actions */}
                <div className="flex flex-wrap items-start justify-between gap-4 p-4 rounded-2xl bg-[#0F0F0F] border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-lg">
                      <img 
                        src={currentPlaylist.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80'} 
                        alt={currentPlaylist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-white">
                        {currentPlaylist.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-chakra mt-0.5">
                        {currentPlaylist.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3 text-amber-400" />
                          {playlistSongs.length} tracks
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTotalTime(totalDurationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Queue All, Add Song, Duplicate, Export, Delete) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    
                    {/* Queue Entire Playlist */}
                    <button
                      onClick={() => {
                        soundEffects.playButtonClick();
                        onQueuePlaylist(currentPlaylist);
                      }}
                      disabled={playlistSongs.length === 0}
                      className={`px-3.5 py-2 rounded-xl ${theme.primaryAccent} text-black font-chakra font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40 transition-all`}
                      title="Queue all songs in playlist"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Queue All</span>
                    </button>

                    {/* Add Songs Toggle */}
                    <button
                      onClick={() => setIsAddingSongs(a => !a)}
                      className="px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-amber-400 border border-white/10 font-chakra font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingSongs ? 'Close Picker' : 'Add Tracks'}</span>
                    </button>

                    {/* Export JSON */}
                    <button
                      onClick={() => handleExportJSON(currentPlaylist)}
                      className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-gray-400 hover:text-white border border-white/10 cursor-pointer"
                      title="Export Playlist JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicatePlaylist(currentPlaylist)}
                      className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-gray-400 hover:text-white border border-white/10 cursor-pointer"
                      title="Duplicate Playlist"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    {!currentPlaylist.isPreset && (
                      <button
                        onClick={() => handleDeletePlaylist(currentPlaylist.id)}
                        className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/40 cursor-pointer"
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>

                {/* Add Songs Picker Drawer */}
                {isAddingSongs && (
                  <div className="bg-[#121212] p-4 rounded-2xl border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-chakra flex items-center gap-1.5">
                        <Plus className="w-4 h-4" />
                        Select songs from catalog to add
                      </span>
                      <input
                        type="text"
                        value={searchSongQuery}
                        onChange={(e) => setSearchSongQuery(e.target.value)}
                        placeholder="Search title or artist..."
                        className="bg-[#1C1C1C] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-gray-500 w-48"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {availableSongsToAdd.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No additional songs available to add</p>
                      ) : (
                        availableSongsToAdd.map(s => (
                          <div key={s.id} className="p-2 rounded-lg bg-[#1C1C1C] border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-black/50 text-[10px]">
                                {s.code}
                              </span>
                              <span className="font-semibold text-gray-200 truncate">{s.title}</span>
                              <span className="text-gray-500 text-[11px] truncate">- {s.artist}</span>
                            </div>
                            <button
                              onClick={() => handleAddSongToPlaylist(s)}
                              className={`px-2.5 py-1 rounded-lg ${theme.primaryAccent} text-black font-bold font-chakra text-[11px] flex items-center gap-1 cursor-pointer`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Playlist Tracks List & Reordering */}
                <div className="flex-1 bg-[#0A0A0A] rounded-2xl p-3 border border-white/10 overflow-y-auto space-y-2 min-h-[220px]">
                  {playlistSongs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2 font-chakra">
                      <Music className="w-8 h-8 text-amber-500/40" />
                      <p className="text-xs">This playlist has no tracks yet</p>
                      <button
                        onClick={() => setIsAddingSongs(true)}
                        className="px-3 py-1 rounded-lg bg-[#1C1C1C] text-amber-400 border border-white/10 text-xs font-bold cursor-pointer"
                      >
                        Click here to add tracks
                      </button>
                    </div>
                  ) : (
                    playlistSongs.map((song, idx) => (
                      <div
                        key={song.id}
                        className="p-2.5 rounded-xl bg-[#141414] border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 group transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Order Index */}
                          <span className="w-6 text-center font-mono text-xs text-gray-500 font-bold">
                            {idx + 1}.
                          </span>

                          {/* Code */}
                          <span className="font-mono text-xs font-bold text-amber-400 px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                            {song.code}
                          </span>

                          {/* Cover Thumbnail */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10">
                            <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-200 truncate">{song.title}</h4>
                            <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        {/* Controls (Move Up, Move Down, Queue Single, Remove) */}
                        <div className="flex items-center gap-1">
                          
                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveSong(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-[#1C1C1C] text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveSong(idx, 'down')}
                            disabled={idx === playlistSongs.length - 1}
                            className="p-1.5 rounded-lg bg-[#1C1C1C] text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Queue Song Now */}
                          <button
                            onClick={() => {
                              soundEffects.playSongSelect();
                              onQueueSong(song);
                            }}
                            className={`p-1.5 rounded-lg ${theme.primaryAccent} text-black font-bold cursor-pointer`}
                            title="Queue Track"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                          </button>

                          {/* Remove from playlist */}
                          <button
                            onClick={() => handleRemoveSongFromPlaylist(song.id)}
                            className="p-1.5 rounded-lg bg-[#1C1C1C] hover:bg-red-950 text-gray-500 hover:text-red-400 cursor-pointer transition-colors"
                            title="Remove Track from Playlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            ) : null}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0A0A0A] flex items-center justify-between text-xs text-gray-500 font-chakra">
          <span>Compatible with 5-button hardware, touchscreens, and Ubuntu/Windows Kiosk modes</span>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl ${theme.primaryAccent} text-black font-bold font-chakra cursor-pointer shadow`}
          >
            Close Studio
          </button>
        </div>

      </div>
    </div>
  );
};
