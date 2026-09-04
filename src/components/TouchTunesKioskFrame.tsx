import React from 'react';

interface TouchTunesKioskFrameProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const TouchTunesKioskFrame: React.FC<TouchTunesKioskFrameProps> = ({
  children,
  enabled
}) => {
  if (!enabled) {
    return <div className="w-full min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#020307] p-1 sm:p-4 md:p-8 flex items-center justify-center overflow-x-hidden">
      
      {/* Outer Curved Matte-Black Jukebox Cabinet Shell with Glowing White Perimeter LED Halo (Photo 1 Matching) */}
      <div className="relative w-full max-w-6xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-2 sm:p-4 md:p-5 bg-gradient-to-b from-[#181c28] via-[#090b14] to-[#04060b] shadow-[0_0_80px_rgba(255,255,255,0.25),0_30px_70px_rgba(0,0,0,0.95)] border-[3px] sm:border-[5px] border-white ring-2 sm:ring-4 ring-cyan-500/50 flex flex-col overflow-hidden">
        
        {/* Subtle Side Bezel Reflections */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

        {/* Screen Display Inner Bezel */}
        <div className="w-full rounded-[18px] sm:rounded-[24px] md:rounded-[28px] overflow-hidden border-2 border-cyan-500/40 shadow-2xl flex flex-col bg-black">
          {children}
        </div>

      </div>

    </div>
  );
};
