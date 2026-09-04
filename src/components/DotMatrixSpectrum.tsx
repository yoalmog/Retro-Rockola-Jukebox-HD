import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

interface DotMatrixSpectrumProps {
  isPlaying: boolean;
  className?: string;
  columns?: number;
  rows?: number;
}

export const DotMatrixSpectrum: React.FC<DotMatrixSpectrumProps> = ({
  isPlaying,
  className = '',
  columns = 36,
  rows = 14
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<number[]>(new Array(columns).fill(0));
  const peakHoldRef = useRef<number[]>(new Array(columns).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const freqData = new Uint8Array(columns * 2);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Dark chassis background with subtle grid lines
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      audioEngine.getFrequencyData(freqData);

      const colWidth = w / columns;
      const dotDiameter = Math.min(colWidth * 0.72, (h / rows) * 0.72);
      const dotRadius = dotDiameter / 2;
      const rowHeight = h / rows;

      const now = Date.now();

      for (let c = 0; c < columns; c++) {
        // Sample audio frequency data (logarithmically or evenly spread)
        const freqIndex = Math.min(freqData.length - 1, Math.floor(Math.pow(c / columns, 1.2) * (freqData.length - 1)));
        let val = freqData[freqIndex] || 0;

        if (!isPlaying) {
          // Idle rhythmic waveform
          val = Math.floor(
            (Math.sin(now * 0.003 + c * 0.25) * 0.35 + 
             Math.cos(now * 0.002 - c * 0.15) * 0.25 + 0.4) * 110
          );
        }

        // Active LED dots in this column (0 to rows)
        const activeDots = Math.min(rows, Math.max(1, Math.round((val / 255) * rows)));

        // Peak hold calculation
        if (activeDots >= peaksRef.current[c]) {
          peaksRef.current[c] = activeDots;
          peakHoldRef.current[c] = 12; // hold 12 frames
        } else {
          if (peakHoldRef.current[c] > 0) {
            peakHoldRef.current[c]--;
          } else {
            peaksRef.current[c] = Math.max(1, peaksRef.current[c] - 0.4);
          }
        }

        const cx = c * colWidth + colWidth / 2;

        for (let r = 0; r < rows; r++) {
          // Row 0 is at bottom, Row rows-1 is at top
          const invertedRow = rows - 1 - r;
          const cy = invertedRow * rowHeight + rowHeight / 2;

          const isLit = r < activeDots;
          const isPeak = Math.floor(peaksRef.current[c]) === r && r > 0;

          if (isLit || isPeak) {
            // Gradient from electric blue to bright cyan to neon white/violet at top
            let ledColor = '#0088ff';
            let glowColor = 'rgba(0, 136, 255, 0.6)';

            if (r > rows * 0.8) {
              ledColor = isPeak ? '#ffffff' : '#38bdf8';
              glowColor = 'rgba(56, 189, 248, 0.9)';
            } else if (r > rows * 0.5) {
              ledColor = '#00d2ff';
              glowColor = 'rgba(0, 210, 255, 0.75)';
            } else {
              ledColor = '#0284c7';
              glowColor = 'rgba(2, 132, 199, 0.6)';
            }

            // Draw glowing LED circle
            ctx.shadowBlur = isLit ? 6 : 10;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = ledColor;

            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Specular shiny core on lit LED
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - dotRadius * 0.25, cy - dotRadius * 0.25, dotRadius * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Unlit LED socket (dark subtle gray/blue recess)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // Inner dark pupil
            ctx.fillStyle = '#080c18';
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, columns, rows]);

  return (
    <div className={`relative w-full rounded-md overflow-hidden border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-[#05070e] ${className}`}>
      <canvas
        ref={canvasRef}
        width={720}
        height={72}
        className="w-full h-full block"
      />
      {/* Subtle glass reflection overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/30" />
    </div>
  );
};
