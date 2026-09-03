import React from 'react';
import { Compass, MapPin, Ruler } from 'lucide-react';
import { AddressSearch } from './AddressSearch';
import { BasemapDropdown } from './BasemapDropdown';
import { BasemapOption } from '../types/gis';

interface MapToolbarProps {
  onFlyTo: (lat: number, lon: number, bbox?: [number, number, number, number]) => void;
  activeBasemap: BasemapOption;
  onSelectBasemap: (basemap: BasemapOption) => void;
  onLocateMe: () => void;
  onResetExtent: () => void;
  isMeasuring: boolean;
  onToggleMeasure: () => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  onFlyTo,
  activeBasemap,
  onSelectBasemap,
  onLocateMe,
  onResetExtent,
  isMeasuring,
  onToggleMeasure,
}) => {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col items-center gap-1.5 p-1.5 bg-white/90 border border-slate-300/80 rounded-xl shadow-xl backdrop-blur-xs">
      <AddressSearch onFlyTo={onFlyTo} />
      <BasemapDropdown currentBasemap={activeBasemap} onSelectBasemap={onSelectBasemap} />
      
      <div className="w-8 h-px bg-slate-200 my-0.5" />
      
      <button
        onClick={onLocateMe}
        className="flex flex-col items-center justify-center w-11 h-11 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="Minha Localização GPS"
      >
        <Compass className="w-4 h-4 mb-0.5" />
        <span className="text-[8px] font-bold tracking-widest leading-none">GPS</span>
      </button>

      <button
        onClick={onResetExtent}
        className="flex flex-col items-center justify-center w-11 h-11 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="Enquadrar todas as camadas"
      >
        <MapPin className="w-4 h-4 mb-0.5" />
        <span className="text-[8px] font-bold tracking-widest leading-none">FOCO</span>
      </button>

      <button
        onClick={onToggleMeasure}
        className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-colors ${
          isMeasuring ? 'bg-red-100 text-red-600' : 'text-slate-700 hover:text-red-600 hover:bg-slate-100'
        }`}
        title="Medir Distância e Área"
      >
        <Ruler className="w-4 h-4 mb-0.5" />
        <span className="text-[8px] font-bold tracking-widest leading-none">MEDIR</span>
      </button>
    </div>
  );
};
