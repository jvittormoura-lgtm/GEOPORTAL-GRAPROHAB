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

  const handleMinChange = (val: number) => {
    const clampedMin = Math.max(min, Math.min(val, max));
    const nextMax = Math.max(clampedMin, maxVal);
    setMinVal(clampedMin);
    setMaxVal(nextMax);
    if (clampedMin === min && nextMax === max) {
      onChange(null);
    } else {
      onChange([clampedMin, nextMax]);
    }
  };

  const handleMaxChange = (val: number) => {
    const clampedMax = Math.max(min, Math.min(val, max));
    const nextMin = Math.min(clampedMax, minVal);
    setMinVal(nextMin);
    setMaxVal(clampedMax);
    if (nextMin === min && clampedMax === max) {
      onChange(null);
    } else {
      onChange([nextMin, clampedMax]);
    }
  };

  const setExactRange = (newMin: number, newMax: number) => {
    const sortedMin = Math.min(newMin, newMax);
    const sortedMax = Math.max(newMin, newMax);
    const clampedMin = Math.max(min, Math.min(sortedMin, max));
    const clampedMax = Math.max(clampedMin, Math.min(sortedMax, max));
    setMinVal(clampedMin);
    setMaxVal(clampedMax);
    if (clampedMin === min && clampedMax === max) {
      onChange(null);
    } else {
      onChange([clampedMin, clampedMax]);
    }
  };

  const handleReset = () => {
    setMinVal(min);
    setMaxVal(max);
    onChange(null);
  };

  // Generate list of available years for quick dropdown
  const yearOptions: number[] = [];
  for (let y = min; y <= max; y++) {
    yearOptions.push(y);
  }

  const isFullRange = (!value) || (minVal === min && maxVal === max);

  return (
    <div className="w-full bg-white/98 border border-slate-300/90 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md">
      {/* Top Header: Title & Reset button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Filtrar por Ano ({min}–{max})</span>
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
        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-red-600 transition-colors">
          <span className="text-[11px] text-slate-500 font-medium">De:</span>
          <select
            value={minVal}
            onChange={(e) => handleMinChange(Number(e.target.value))}
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
        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-red-600 transition-colors">
          <span className="text-[11px] text-slate-500 font-medium">Até:</span>
          <select
            value={maxVal}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
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
          onClick={handleReset}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
            isFullRange
              ? 'bg-red-600/20 text-red-600 border border-red-600/50 font-bold'
              : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
          }`}
        >
          Todos
        </button>

        {min <= 2020 && max >= 2022 && (
          <button
            type="button"
            onClick={() => {
              if (!isFullRange && minVal === 2020 && maxVal === 2022) {
                handleReset();
              } else {
                setExactRange(2020, 2022);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              !isFullRange && minVal === 2020 && maxVal === 2022
                ? 'bg-red-600/20 text-red-600 border border-red-600/50 font-bold'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            2020–2022
          </button>
        )}

        {min <= 2023 && max >= 2025 && (
          <button
            type="button"
            onClick={() => {
              if (!isFullRange && minVal === 2023 && maxVal === 2025) {
                handleReset();
              } else {
                setExactRange(2023, 2025);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              !isFullRange && minVal === 2023 && maxVal === 2025
                ? 'bg-red-600/20 text-red-600 border border-red-600/50 font-bold'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            2023–2025
          </button>
        )}

        {max >= 2026 && (
          <button
            type="button"
            onClick={() => {
              if (!isFullRange && minVal === 2026 && maxVal === 2026) {
                handleReset();
              } else {
                setExactRange(2026, 2026);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              !isFullRange && minVal === 2026 && maxVal === 2026
                ? 'bg-red-600/20 text-red-600 border border-red-600/50 font-bold'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            2026
          </button>
        )}

        {max - 4 >= min && (
          <button
            type="button"
            onClick={() => {
              if (!isFullRange && minVal === max - 4 && maxVal === max) {
                handleReset();
              } else {
                setExactRange(max - 4, max);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
              !isFullRange && minVal === max - 4 && maxVal === max
                ? 'bg-red-600/20 text-red-600 border border-red-600/50 font-bold'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            Últimos 5 anos
          </button>
        )}
      </div>
    </div>
  );
};
