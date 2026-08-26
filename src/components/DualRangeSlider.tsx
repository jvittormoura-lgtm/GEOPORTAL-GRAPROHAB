import React, { useState, useEffect, useRef } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number] | null;
  onChange: (value: [number, number]) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, value, onChange }) => {
  const [minVal, setMinVal] = useState(value ? value[0] : min);
  const [maxVal, setMaxVal] = useState(value ? value[1] : max);
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);

  useEffect(() => {
    if (value) {
      setMinVal(value[0]);
      setMaxVal(value[1]);
      minValRef.current = value[0];
      maxValRef.current = value[1];
    } else {
      setMinVal(min);
      setMaxVal(max);
      minValRef.current = min;
      maxValRef.current = max;
    }
  }, [value, min, max]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(event.target.value), maxVal);
    setMinVal(value);
    minValRef.current = value;
    onChange([value, maxVal]);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(event.target.value), minVal);
    setMaxVal(value);
    maxValRef.current = value;
    onChange([minVal, value]);
  };

  const getPercent = (value: number) => {
    if (min === max) return 100;
    return Math.round(((value - min) / (max - min)) * 100);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="flex justify-between w-full text-[10px] text-slate-400 mb-1 px-1">
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 font-mono font-bold">{minVal}</span>
        <span className="text-[9px] text-slate-500 uppercase">Ano de Entrada</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 font-mono font-bold">{maxVal}</span>
      </div>
      <div className="relative w-full h-4 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          className={`absolute w-full h-1 appearance-none pointer-events-none bg-transparent ${minVal === maxVal && minVal === max ? 'z-40' : 'z-20'}`}
          style={{ WebkitAppearance: 'none' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          className={`absolute w-full h-1 appearance-none pointer-events-none bg-transparent ${minVal === maxVal && minVal === min ? 'z-40' : 'z-30'}`}
          style={{ WebkitAppearance: 'none' }}
        />
        <div className="absolute left-0 right-0 h-1 bg-slate-700/80 rounded-full z-10" />
        <div
          className="absolute h-1 bg-sky-500 rounded-full z-10"
          style={{
            left: `${getPercent(minVal)}%`,
            width: `${getPercent(maxVal) - getPercent(minVal)}%`
          }}
        />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          -webkit-appearance: none;
          background: #38bdf8;
          border: 2px solid #0f172a;
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #38bdf8;
          border: 2px solid #0f172a;
          cursor: pointer;
        }
      `}} />
    </div>
  );
};
