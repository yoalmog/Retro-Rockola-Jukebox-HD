import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

interface TopAuroraSoundWaveProps {
  isPlaying: boolean;
  className?: string;
}

export const TopAuroraSoundWave: React.FC<TopAuroraSoundWaveProps> = ({
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const freqData = new Uint8Array(64);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Chassis dark background
      ctx.fillStyle = '#060810';
      ctx.fillRect(0, 0, w, h);

      audioEngine.getFrequencyData(freqData);

      const now = performance.now() * 0.0025;

      // Calculate audio energy
      let avgEnergy = 0;
      for (let i = 0; i < 32; i++) {
        avgEnergy += freqData[i] || 0;
      }
      avgEnergy = avgEnergy / (32 * 255);

      if (!isPlaying) {
        avgEnergy = 0.28 + Math.sin(now * 1.5) * 0.08;
      }

      // Draw multi-layered organic glowing wave lobes (Green left lobe, Cyan center, Blue/Violet right lobe)
      const layers = [
        { blur: 24, alpha: 0.45, ampScale: 1.35, offset: 0 },
        { blur: 14, alpha: 0.75, ampScale: 1.0, offset: Math.PI * 0.25 },
        { blur: 4, alpha: 0.95, ampScale: 0.7, offset: Math.PI * 0.5 }
      ];

      layers.forEach(({ blur, alpha, ampScale, offset }) => {
        ctx.save();
        ctx.filter = `blur(${blur}px)`;
        ctx.globalAlpha = alpha;

        // Create horizontal linear gradient across the wave (Neon Green -> Cyan -> Electric Blue -> Magenta/Violet)
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0.0, '#10b981'); // Green
        grad.addColorStop(0.2, '#22c55e'); // Bright Green
        grad.addColorStop(0.4, '#06b6d4'); // Cyan
        grad.addColorStop(0.65, '#0ea5e9'); // Sky Blue
        grad.addColorStop(0.85, '#3b82f6'); // Royal Blue
        grad.addColorStop(1.0, '#8b5cf6'); // Purple / Violet

        // Top half wave
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const step = 6;
        for (let x = 0; x <= w; x += step) {
          const normX = x / w;
          // Dual lobe envelope (pinched at ends and center, high at 25% and 75%)
          const envelope = Math.sin(normX * Math.PI) * Math.sin(normX * Math.PI);
          const freqIdx = Math.min(freqData.length - 1, Math.floor(normX * (freqData.length - 1)));
          const audioAmp = isPlaying ? (freqData[freqIdx] / 255) * 1.3 : 0.4;

          const wave1 = Math.sin(normX * 6 + now * 2 + offset) * 12;
          const wave2 = Math.cos(normX * 12 - now * 3) * 6;
          const totalAmp = (wave1 + wave2 + audioAmp * 24) * envelope * ampScale * (0.6 + avgEnergy * 0.8);

          const y = centerY - totalAmp;
          ctx.lineTo(x, y);
        }

        // Bottom mirror half wave
        for (let x = w; x >= 0; x -= step) {
          const normX = x / w;
          const envelope = Math.sin(normX * Math.PI) * Math.sin(normX * Math.PI);
          const freqIdx = Math.min(freqData.length - 1, Math.floor(normX * (freqData.length - 1)));
          const audioAmp = isPlaying ? (freqData[freqIdx] / 255) * 1.3 : 0.4;

          const wave1 = Math.sin(normX * 6 + now * 2 + offset) * 12;
          const wave2 = Math.cos(normX * 12 - now * 3) * 6;
          const totalAmp = (wave1 + wave2 + audioAmp * 24) * envelope * ampScale * (0.6 + avgEnergy * 0.8);

          const y = centerY + totalAmp;
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.restore();
      });

      // Central core bright specular beam line
      ctx.save();
      ctx.filter = 'blur(1px)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, centerY);
      for (let x = w * 0.1; x <= w * 0.9; x += 8) {
        const normX = x / w;
        const envelope = Math.sin(normX * Math.PI);
        const y = centerY + Math.sin(normX * 8 + now * 4) * 3 * envelope * (0.5 + avgEnergy);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.35)] bg-[#04060c] ${className}`}>
      <canvas
        ref={canvasRef}
        width={960}
        height={90}
        className="w-full h-full block"
      />
      {/* Glossy top curvature glare reflecting arcade glass */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-black/40" />
      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
};
