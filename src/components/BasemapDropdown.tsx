import React, { useState, useEffect, useRef } from 'react';
import { Layers, Map as MapIcon, X, Check } from 'lucide-react';
import { BASEMAPS } from './BasemapSelector';
import { BasemapOption } from '../types/gis';

interface BasemapDropdownProps {
  currentBasemap: BasemapOption;
  onSelectBasemap: (basemap: BasemapOption) => void;
}

export const BasemapDropdown: React.FC<BasemapDropdownProps> = ({ currentBasemap, onSelectBasemap }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-colors ${
          isExpanded ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:text-red-600 hover:bg-slate-100'
        }`}
        title="Mapas Base"
      >
        <Layers className="w-4 h-4 mb-0.5" />
        <span className="text-[8px] font-bold tracking-widest leading-none">BASE</span>
      </button>

      {isExpanded && (
        <div className="absolute top-0 left-[110%] ml-2 w-64 sm:w-80 z-[1001] bg-white/95 border border-slate-300 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-700">Mapas Base</span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
              title="Fechar mapas base"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {BASEMAPS.map((base) => {
              const isSelected = currentBasemap.id === base.id;
              return (
                <button
                  key={base.id}
                  type="button"
                  onClick={() => {
                    onSelectBasemap(base);
                    setIsExpanded(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors group ${
                    isSelected ? 'bg-red-50/80 border border-red-100' : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className={`text-[13px] leading-tight truncate ${isSelected ? 'text-red-700 font-semibold' : 'text-slate-800'}`}>
                      {base.name}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {base.category}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
