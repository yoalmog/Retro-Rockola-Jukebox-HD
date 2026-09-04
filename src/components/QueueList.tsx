import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QueueItem, SkinType } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { ListMusic, Trash2, Clock, Music } from 'lucide-react';

interface QueueListProps {
  queue: QueueItem[];
  onRemoveItem?: (index: number) => void;
  onClearQueue?: () => void;
  skin?: SkinType;
  detailedVisualFeedback?: boolean;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue,
  onRemoveItem,
  onClearQueue,
  skin = 'elegant-dark',
  detailedVisualFeedback = false
}) => {
  const theme = getTheme(skin);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const totalQueueTime = queue.reduce((acc, item) => acc + (item.song.duration || 180), 0);

  return (
    <div className={`${theme.cardBg} rounded-xl p-5 border ${theme.cardBorder} shadow-xl flex flex-col justify-between h-full select-none transition-colors duration-300`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ListMusic className={`w-3.5 h-3.5 ${theme.primaryAccentText}`} />
          <h2 className={`${
            detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
          } uppercase tracking-[0.3em] text-gray-300 font-black`}>
            Up Next (Queue)
          </h2>
        </div>

        {queue.length > 0 && onClearQueue && (
          <button
            onClick={onClearQueue}
            className={`${
              detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
            } text-red-400/80 hover:text-red-400 font-chakra flex items-center gap-1 cursor-pointer transition-colors`}
            title="Clear Queue"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[140px]">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center text-gray-500 font-chakra text-xs">
            <Music className="w-6 h-6 text-gray-700 mb-1" />
            <p className="text-gray-400">Queue is currently empty</p>
            <p className="text-[10px] text-gray-600">Selected tracks will appear here automatically</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {queue.map((item, idx) => (
              <motion.div
                key={item.queueId || idx}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-[#161616] hover:bg-[#1c1c1c] rounded-lg p-2.5 flex items-center justify-between gap-2.5 border border-white/5 hover:border-white/15 transition-colors group"
              >
                {/* Order number & Track code */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-5 text-center font-mono font-black ${
                    detailedVisualFeedback ? 'text-sm' : 'text-xs'
                  } ${theme.primaryAccentText}`}>
                    #{idx + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded bg-[#222222] text-amber-400 font-mono font-black border border-white/10 ${
                    detailedVisualFeedback ? 'text-xs' : 'text-[10px]'
                  }`}>
                    {item.song.code}
                  </span>
                  {item.isAutoDj && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[8px] border border-purple-500/30 font-bold">
                      AUTO-DJ
                    </span>
                  )}
                  {item.requestedBy && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono text-[8px] border border-blue-500/30 font-bold truncate max-w-[70px]">
                      👤 {item.requestedBy}
                    </span>
                  )}
                </div>

                {/* Song Title & Artist */}
                <div className="flex-1 min-w-0">
                  <h5 className={`font-black text-gray-100 truncate leading-tight ${
                    detailedVisualFeedback ? 'text-sm' : 'text-xs'
                  }`}>
                    {item.song.title}
                  </h5>
                  <p className={`truncate font-chakra ${
                    detailedVisualFeedback ? 'text-xs text-gray-300 font-medium' : 'text-[10px] text-gray-400'
                  }`}>
                    {item.song.artist}
                  </p>
                </div>

                {/* Duration & Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono flex items-center gap-0.5 ${
                    detailedVisualFeedback ? 'text-xs text-gray-300' : 'text-[10px] text-gray-400'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    {formatDuration(item.song.duration)}
                  </span>
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="text-gray-600 hover:text-red-400 p-1 cursor-pointer transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer / Total Queue Time */}
      {queue.length > 0 && (
        <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 font-mono flex items-center justify-between">
          <span>{queue.length} queued tracks</span>
          <span className={`${theme.primaryAccentText} font-bold`}>Total duration: {formatDuration(totalQueueTime)}</span>
        </div>
      )}

    </div>
  );
};
