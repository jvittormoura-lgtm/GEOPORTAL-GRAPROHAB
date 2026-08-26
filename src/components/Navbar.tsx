import React, { useRef, useState } from 'react';
import { BasemapOption, GisLayer, AppMode } from '../types/gis';

import { 
  Globe, Upload, Download, Sparkles, Layers, 
  Database, ChevronDown, Plus, FileCode, Lock, Unlock, 
  Building2, ShieldCheck, LogOut, Check, Send, CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  layers: GisLayer[];
  activeBasemap: BasemapOption;
  appMode: AppMode;
  onToggleAuthModal: () => void;
  onLogoutGestor: () => void;
  onOpenBasemapModal: () => void;
  onOpenExportModal: () => void;
  onOpenAiModal: () => void;
  onLoadGeoJsonFile: (file: File) => void;
  onLoadSampleDataset: (datasetId: string) => void;
  onRequireAuth: (callback: () => void) => void;
  onPublishToPublic?: () => void;
  lastPublishedAt?: number | null;
  hasUnpublishedChanges?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  layers,
  activeBasemap,
  appMode,
  onToggleAuthModal,
  onLogoutGestor,
  onOpenBasemapModal,
  onOpenExportModal,
  onOpenAiModal,
  onLoadGeoJsonFile,
  
  onRequireAuth,
  onPublishToPublic,
  lastPublishedAt,
  hasUnpublishedChanges = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onLoadGeoJsonFile(files[i]);
      }
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    if (appMode === 'gestor') {
      fileInputRef.current?.click();
    } else {
      onRequireAuth(() => {
        fileInputRef.current?.click();
      });
    }
  };

  const handlePublishClick = () => {
    if (onPublishToPublic) {
      onPublishToPublic();
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    }
  };

  const totalFeatures = layers.reduce((acc, l) => acc + l.featureCount, 0);
  const totalFiltered = layers.reduce((acc, l) => acc + l.filteredCount, 0);

  return (
    <header 
      id="app-navbar"
      className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none relative z-30 shrink-0"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.kml,.csv"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Brand & Logo - GRAPROHAB SP */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-900/40">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-white tracking-tight leading-none">
                Geo<span className="text-sky-400 font-extrabold">GRAPROHAB</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 bg-sky-950 border border-sky-500/30 text-sky-300 font-bold rounded">
                SP
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Portal de Empreendimentos Habitacionais</span>
          </div>
        </div>

        {/* Mode Indicator Badge */}
        <div className="hidden sm:flex items-center">
          {appMode === 'gestor' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-full text-[11px] font-semibold animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ambiente Gestor (Técnico)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Consulta Pública (Cidadão)</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Upload Button */}
        <button
          id="btn-upload-geojson"
          onClick={handleUploadClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
            appMode === 'gestor'
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={appMode === 'gestor' ? 'Subir novos arquivos GeoJSON' : 'Requer senha de gestor'}
        >
          {appMode === 'gestor' ? (
            <Upload className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>Subir Camada GeoJSON</span>
        </button>



        {/* Basemaps Modal Trigger */}
        <button
          id="btn-open-basemaps"
          onClick={onOpenBasemapModal}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Mapas Base (Satélite / OSM / Carto / Topo)"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{activeBasemap.name}</span>
        </button>

        {/* Export Button */}
        <button
          id="btn-open-export-modal"
          onClick={onOpenExportModal}
          disabled={layers.length === 0}
          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar (KML/SHP/CSV)</span>
        </button>

        {/* AI GIS Copilot Button */}
        <button
          id="btn-open-ai-gis"
          onClick={onOpenAiModal}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Copiloto IA</span>
        </button>

        {/* Gestor: Save & Publish to Citizen Button */}
        {appMode === 'gestor' && onPublishToPublic && (
          <button
            id="btn-publish-to-citizen"
            onClick={handlePublishClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
              publishSuccess 
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-900/50' 
                : hasUnpublishedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
            }`}
            title="Salvar alterações e publicar para acesso no Modo Cidadão"
          >
            {publishSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publicado com Sucesso!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{hasUnpublishedChanges ? 'Salvar & Publicar (Alterações)' : 'Salvar & Publicar'}</span>
              </>
            )}
          </button>
        )}

        {/* Auth / Mode Switcher */}
        {appMode === 'gestor' ? (
          <button
            onClick={onLogoutGestor}
            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Sair do modo de edição de gestor"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair do Gestor</span>
          </button>
        ) : (
          <button
            onClick={onToggleAuthModal}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-950 transition-all"
            title="Acessar painel técnico com senha"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Acesso Gestor</span>
          </button>
        )}
      </div>
    </header>
  );
};
