import React, { useState, useEffect } from 'react';
import { RotateCcw, Calendar } from 'lucide-react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, value, onChange }) => {
  const [minVal, setMinVal] = useState<number>(value ? value[0] : min);
  const [maxVal, setMaxVal] = useState<number>(value ? value[1] : max);

  // Sync with incoming prop changes
  useEffect(() => {
    const newMin = value ? value[0] : min;
    const newMax = value ? value[1] : max;
    setMinVal(newMin);
    setMaxVal(newMax);
  }, [value, min, max]);

  const setExactRange = (newMin: number, newMax: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, max));
    const clampedMax = Math.max(clampedMin, Math.min(newMax, max));
    setMinVal(clampedMin);
    setMaxVal(clampedMax);
    onChange([clampedMin, clampedMax]);
  };

  const handleReset = () => {
    setMinVal(min);
    setMaxVal(max);
    onChange([min, max]);
  };

  // Generate list of available years for quick dropdown
  const yearOptions: number[] = [];
  for (let y = min; y <= max; y++) {
    yearOptions.push(y);
  }

  const isFullRange = minVal === min && maxVal === max;

  return (
    <div className="w-full bg-white/98 border border-slate-300/90 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md">
      {/* Top Header: Title & Reset button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Filtrar por Ano</span>
        </div>

        {!isFullRange && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300/80 cursor-pointer"
            title="Redefinir para todos os anos"
          >
            <RotateCcw className="w-2.5 h-2.5 text-red-600" />
            <span>Todos</span>
          </button>
        )}
      </div>

      {/* Direct Dropdowns: De [Ano] até [Ano] */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* De */}
        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-750 rounded-lg px-2.5 py-1.5 focus-within:border-red-600 transition-colors">
          <span className="text-[11px] text-slate-500 font-medium">De:</span>
          <select
            value={minVal}
            onChange={(e) => setExactRange(Number(e.target.value), maxVal)}
            className="w-full bg-transparent text-xs text-red-600 font-mono font-bold focus:outline-none cursor-pointer"
          >
            {yearOptions.map(y => (
              <option key={y} value={y} className="bg-white text-slate-900 font-mono">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Até */}
        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-750 rounded-lg px-2.5 py-1.5 focus-within:border-red-600 transition-colors">
          <span className="text-[11px] text-slate-500 font-medium">Até:</span>
          <select
            value={maxVal}
            onChange={(e) => setExactRange(minVal, Number(e.target.value))}
            className="w-full bg-transparent text-xs text-red-600 font-mono font-bold focus:outline-none cursor-pointer"
          >
            {yearOptions.map(y => (
              <option key={y} value={y} className="bg-white text-slate-900 font-mono">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Preset Buttons for 1-Click Filtering */}
      <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-200">
        <span className="text-[9px] text-slate-500 uppercase font-semibold mr-1">Atalhos:</span>
        <button
          type="button"
          onClick={() => setExactRange(min, max)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
            isFullRange
              ? 'bg-red-600/20 text-red-500 border border-red-600/50'
              : 'bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
          }`}
        >
          Todos ({min}–{max})
        </button>
        {max >= 2026 && (
          <button
            type="button"
            onClick={() => setExactRange(2026, 2026)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              minVal === 2026 && maxVal === 2026
                ? 'bg-red-600/20 text-red-500 border border-red-600/50'
                : 'bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            2026
          </button>
        )}
        {max >= 2024 && (
          <button
            type="button"
            onClick={() => setExactRange(2024, max)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              minVal === 2024 && maxVal === max
                ? 'bg-red-600/20 text-red-500 border border-red-600/50'
                : 'bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            2024–{max}
          </button>
        )}
        {max - 5 >= min && (
          <button
            type="button"
            onClick={() => setExactRange(max - 5, max)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              minVal === max - 5 && maxVal === max
                ? 'bg-red-600/20 text-red-500 border border-red-600/50'
                : 'bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            Últimos 5 anos
          </button>
        )}
      </div>
    </div>
  );
};
