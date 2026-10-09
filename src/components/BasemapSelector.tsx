import React, { useState } from 'react';
import { BasemapOption } from '../types/gis';
import { Layers, Check, Key, Globe, Eye } from 'lucide-react';

export const BASEMAPS: BasemapOption[] = [
  {
    id: 'jawg_sunny',
    name: 'Jawg Sunny (Vibrante & Detalhado)',
    category: 'light',
    url: 'https://{s}.tile.jawg.io/jawg-sunny/{z}/{x}/{y}.png?access-token=OEt7Cap0rjC045eTj4bW7TR8nKxpZbWoqIdWsELYGKsAWywaR8HODybDW58ruth4',
    attribution: '&copy; <a href="https://jawg.io" target="_blank" rel="noopener noreferrer">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'jawg_light',
    name: 'Jawg Light (Minimalista Claro)',
    category: 'light',
    url: 'https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}.png?access-token=OEt7Cap0rjC045eTj4bW7TR8nKxpZbWoqIdWsELYGKsAWywaR8HODybDW58ruth4',
    attribution: '&copy; <a href="https://jawg.io" target="_blank" rel="noopener noreferrer">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'jawg_dark',
    name: 'Jawg Dark (Elegante Escuro)',
    category: 'dark',
    url: 'https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}.png?access-token=OEt7Cap0rjC045eTj4bW7TR8nKxpZbWoqIdWsELYGKsAWywaR8HODybDW58ruth4',
    attribution: '&copy; <a href="https://jawg.io" target="_blank" rel="noopener noreferrer">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap (Padrão)',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  {
    id: 'google_hybrid',
    name: 'Google Satélite Híbrido',
    category: 'satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  }
];

interface BasemapSelectorProps {
  currentBasemap: BasemapOption;
  onSelectBasemap: (basemap: BasemapOption) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BasemapSelector: React.FC<BasemapSelectorProps> = ({
  currentBasemap,
  onSelectBasemap,
  isOpen,
  onClose
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [mapboxToken, setMapboxToken] = useState('');
  const [mapboxStyleId, setMapboxStyleId] = useState('mapbox/streets-v12');

  if (!isOpen) return null;

  const handleApplyCustomMapbox = () => {
    if (!mapboxToken) return;
    const mapboxBasemap: BasemapOption = {
      id: 'mapbox_custom',
      name: `Mapbox (${mapboxStyleId})`,
      category: 'custom',
      url: `https://api.mapbox.com/styles/v1/${mapboxStyleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
      requiresKey: true
    };
    onSelectBasemap(mapboxBasemap);
    onClose();
  };

  const handleApplyCustomXyz = () => {
    if (!customUrl) return;
    const customBasemap: BasemapOption = {
      id: 'xyz_custom_' + Date.now(),
      name: 'Camada XYZ Customizada',
      category: 'custom',
      url: customUrl,
      attribution: '&copy; Camada Personalizada do Usuário',
      maxZoom: 19
    };
    onSelectBasemap(customBasemap);
    onClose();
  };

  

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="basemap-selector-modal"
        className="w-full max-w-2xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/10 text-red-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Mapas Base (Basemaps)</h2>
              <p className="text-xs text-slate-500">Escolha o mapa de fundo para sobrepor suas camadas geográficas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Grid of Basemaps */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Mapas Base Disponíveis
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BASEMAPS.map((base) => {
                const isSelected = currentBasemap.id === base.id;
                return (
                  <button
                    key={base.id}
                    id={`basemap-option-${base.id}`}
                    onClick={() => {
                      onSelectBasemap(base);
                      onClose();
                    }}
                    className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-red-50/40 border-red-600 text-sky-200 ring-1 ring-red-600'
                        : 'bg-slate-100/60 border-slate-300/60 hover:bg-slate-100 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900">{base.name}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-600 text-slate-950 rounded-sm">
                            Ativo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 capitalize block">
                        Estilo: {base.category} • Zoom máx: {base.maxZoom}
                      </span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mapbox Integration */}
          <div className="p-4 bg-slate-100/40 rounded-xl border border-slate-300/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <Key className="w-4 h-4" />
              <span>Integração Mapbox API (Opcional)</span>
            </div>
            <p className="text-xs text-slate-500">
              Caso possua seu próprio Access Token do Mapbox e estilo customizado (ex: <code>mapbox/outdoors-v12</code> ou <code>mapbox/satellite-streets-v12</code>), insira abaixo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="password"
                placeholder="Mapbox Access Token (pk.eyJ1...)"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
              />
              <input
                type="text"
                placeholder="Estilo (ex: mapbox/streets-v12)"
                value={mapboxStyleId}
                onChange={(e) => setMapboxStyleId(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>
            <button
              onClick={handleApplyCustomMapbox}
              disabled={!mapboxToken}
              className="w-full py-2 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition-colors"
            >
              Aplicar Estilo Mapbox
            </button>
          </div>

          {/* Custom XYZ Tile URL */}
          <div className="p-4 bg-slate-100/40 rounded-xl border border-slate-300/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Globe className="w-4 h-4" />
              <span>URL de Servidor de Tiles XYZ / TMS Personalizado</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://meu-servidor-gis.com/tiles/{z}/{x}/{y}.png"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleApplyCustomXyz}
                disabled={!customUrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Carregar XYZ
              </button>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
