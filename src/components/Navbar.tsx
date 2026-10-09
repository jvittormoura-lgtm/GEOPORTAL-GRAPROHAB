import React, { useRef, useState } from 'react';
import { BasemapOption, GisLayer, AppMode } from '../types/gis';

import { Upload, Download, Lock, LogOut } from 'lucide-react';

interface NavbarProps {
  layers: GisLayer[];
  activeBasemap: BasemapOption;
  appMode?: AppMode;
  onOpenBasemapModal: () => void;
  onOpenExportModal: () => void;
  onLoadGeoJsonFile: (file: File) => void;
  onLoadSampleDataset?: (datasetId: string) => void;
  onRequireAuth?: (callback: () => void, title?: string, description?: string) => void;
  onPublishToPublic?: () => void;
  lastPublishedAt?: number | null;
  hasUnpublishedChanges?: boolean;
  isUnlocked?: boolean;
  onUnlockSession?: () => void;
  onLockSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  layers,
  activeBasemap,
  appMode = 'consumidor',
  onOpenBasemapModal,
  onOpenExportModal,
  onLoadGeoJsonFile,
  onRequireAuth,
  onPublishToPublic,
  lastPublishedAt,
  hasUnpublishedChanges = false,
  isUnlocked = false,
  onUnlockSession,
  onLockSession
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const executeUpload = () => {
        for (let i = 0; i < fileList.length; i++) {
          onLoadGeoJsonFile(fileList[i]);
        }
      };

      if (onRequireAuth) {
        onRequireAuth(
          executeUpload,
          'Subir Camada GeoJSON',
          'Para importar e processar novos arquivos no GeoPortal, digite a senha de acesso.'
        );
      } else {
        executeUpload();
      }
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    if (onRequireAuth) {
      onRequireAuth(
        () => {
          fileInputRef.current?.click();
        },
        'Subir Camada GeoJSON',
        'Para importar e processar novos arquivos no GeoPortal, digite a senha de acesso.'
      );
    } else {
      fileInputRef.current?.click();
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
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl tracking-tighter leading-none whitespace-nowrap">
                <span className="text-slate-900 font-black">Grapro</span><span className="text-red-600 font-black">h@b</span>
              </h1>
            </div>
            <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap truncate mt-0.5">GeoPortal</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Upload Button */}
        <button
          id="btn-upload-geojson"
          onClick={handleUploadClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
          title="Subir novos arquivos GeoJSON ou CSV (requer autorização)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Subir Camada GeoJSON</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
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

        {/* Botão pequeno e discreto para deslogar do modo gestor */}
        {isUnlocked && onLockSession && (
          <button
            type="button"
            id="btn-logout-gestor"
            onClick={onLockSession}
            title="Sair do modo gestor (bloquear ações de edição)"
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Sair (Gestor)</span>
          </button>
        )}
      </div>
    </header>
  );
};
