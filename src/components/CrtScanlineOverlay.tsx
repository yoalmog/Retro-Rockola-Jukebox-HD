import React from 'react';

interface CrtScanlineOverlayProps {
  scanlinesEnabled?: boolean;
  phosphorGlowEnabled?: boolean;
}

export const CrtScanlineOverlay: React.FC<CrtScanlineOverlayProps> = ({
  scanlinesEnabled = true,
  phosphorGlowEnabled = true
}) => {
  if (!scanlinesEnabled && !phosphorGlowEnabled) return null;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none select-none overflow-hidden">
      {/* 1. Authentic Horizontal CRT Scanlines */}
      {scanlinesEnabled && (
        <div 
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.7) 0px,
              rgba(0, 0, 0, 0.7) 1px,
              transparent 1px,
              transparent 3px
            )`,
            backgroundSize: '100% 3px'
          }}
        />
      )}

      {/* 2. CRT Glass Curvature & Corner Vignette Shadow */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 0, 0, 0.85) 100%)'
        }}
      />

      {/* 3. Subtle Retro Phosphor Glow Tint */}
      {phosphorGlowEnabled && (
        <div 
          className="absolute inset-0 opacity-10 mix-blend-screen bg-gradient-to-tr from-cyan-500/30 via-emerald-500/20 to-amber-500/20 animate-pulse pointer-events-none"
          style={{ animationDuration: '4s' }}
        />
      )}

      {/* 4. Glass Reflection & Tube Flicker Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};
