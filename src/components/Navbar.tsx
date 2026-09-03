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
      className="h-14 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between select-none relative z-30 shrink-0"
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center text-slate-900 shadow-md shadow-red-100/40">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[13px] sm:text-sm text-slate-900 tracking-tight leading-none whitespace-nowrap">
                GeoPortal <span className="text-red-600 font-extrabold">GRAPROHAB</span>
              </h1>
              <span className="text-[9px] px-1 py-[1px] bg-red-50 border border-red-600/30 text-red-500 font-bold rounded shrink-0">
                SP
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 whitespace-nowrap truncate">Portal de Empreendimentos Georreferenciados</span>
          </div>
        </div>

        {/* Mode Indicator Badge */}
        <div className="hidden sm:flex items-center">
          {appMode === 'gestor' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-semibold animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ambiente Gestor (Técnico)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-600" />
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
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-amber-100'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
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






        {/* Export Button */}
        <button
          id="btn-open-export-modal"
          onClick={onOpenExportModal}
          disabled={layers.length === 0}
          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar (KML/SHP/CSV)</span>
        </button>

        {/* AI GIS Copilot Button */}
        {/* <button
          id="btn-open-ai-gis"
          onClick={onOpenAiModal}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Copiloto IA</span>
        </button> */}

        {/* Gestor: Save & Publish to Citizen Button */}
        {appMode === 'gestor' && onPublishToPublic && (
          <button
            id="btn-publish-to-citizen"
            onClick={handlePublishClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
              publishSuccess 
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-200' 
                : hasUnpublishedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-200 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-900 shadow-emerald-200'
            }`}
            title="Salvar alterações na memória do navegador"
          >
            {publishSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{hasUnpublishedChanges ? 'Salvar no navegador (Alterações)' : 'Salvar no navegador'}</span>
              </>
            )}
          </button>
        )}

        {/* Auth / Mode Switcher */}
        {appMode === 'gestor' ? (
          <button
            onClick={onLogoutGestor}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Sair do modo de edição de gestor"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair do Gestor</span>
          </button>
        ) : (
          <button
            onClick={onToggleAuthModal}
            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-600 hover:to-red-400 text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-200 transition-all"
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
