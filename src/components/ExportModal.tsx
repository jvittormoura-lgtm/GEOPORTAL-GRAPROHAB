import React, { useState } from 'react';
import { GisLayer, ExportFormat } from '../types/gis';
import { exportToShapefileZip } from '../utils/shapefileExporter';
import { exportToKml } from '../utils/kmlExporter';
import { exportToCsv } from '../utils/csvExporter';
import { filterFeatures } from '../utils/geoJsonParser';
import { Download, FileCode, FileSpreadsheet, Archive, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ExportModalProps {
  layers: GisLayer[];
  activeLayerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  layers,
  activeLayerId,
  isOpen,
  onClose
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(activeLayerId || (layers[0]?.id || ''));
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('geojson');
  const [exportFilteredOnly, setExportFilteredOnly] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('');
  const [includeWkt, setIncludeWkt] = useState<boolean>(true);
  const [includeLatLon, setIncludeLatLon] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedLayerId(activeLayerId || (layers[0]?.id || ''));
      setStatusMessage(null);
    }
  }, [isOpen, activeLayerId, layers]);

  if (!isOpen) return null;

  const currentLayer = layers.find(l => l.id === selectedLayerId) || layers[0];
  const effectiveFileName = fileName.trim() || (currentLayer ? currentLayer.name.toLowerCase().replace(/\s+/g, '_') : 'map_export');

  const handleExport = async () => {
    if (!currentLayer) return;

    setIsExporting(true);
    setStatusMessage(null);

    try {
      // 1. Prepare FeatureCollection
      let exportFeatures = currentLayer.data.features;
      if (exportFilteredOnly) {
        exportFeatures = filterFeatures(
          currentLayer.data.features,
          currentLayer.filters,
          currentLayer.spatialFilter
        );
      }

      if (exportFeatures.length === 0) {
        throw new Error('Nenhuma feição encontrada para exportar com os filtros atuais.');
      }

      const exportGeoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: exportFeatures
      };

      let blob: Blob;
      let downloadExt = '';

      switch (selectedFormat) {
        case 'shp': {
          blob = await exportToShapefileZip(exportGeoJson, effectiveFileName);
          downloadExt = '.zip';
          break;
        }
        case 'kml': {
          const kmlContent = exportToKml(exportGeoJson, currentLayer, currentLayer.name);
          blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
          downloadExt = '.kml';
          break;
        }
        case 'csv': {
          const csvContent = exportToCsv(exportGeoJson, includeWkt, includeLatLon);
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          downloadExt = '.csv';
          break;
        }
        case 'geojson':
        default: {
          const geoJsonStr = JSON.stringify(exportGeoJson, null, 2);
          blob = new Blob([geoJsonStr], { type: 'application/geo+json;charset=utf-8' });
          downloadExt = '.geojson';
          break;
        }
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${effectiveFileName}${downloadExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Arquivo "${effectiveFileName}${downloadExt}" gerado e baixado com sucesso! (${exportFeatures.length} feições)`
      });
    } catch (err: any) {
      console.error('Erro na exportação:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Falha ao processar arquivo para exportação.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formats: { id: ExportFormat; title: string; desc: string; icon: any; badge: string }[] = [
    {
      id: 'shp',
      title: 'Shapefile ESRI (.zip)',
      desc: 'Pacote binário completo com .SHP, .SHX, .DBF e projeção WGS84 .PRJ para QGIS, ArcGIS e AutoCAD',
      icon: Archive,
      badge: 'GIS Padrão'
    },
    {
      id: 'kml',
      title: 'Google Earth KML (.kml)',
      desc: 'Formato XML compatível com Google Earth, Google My Maps e GPS com ExtendedData e estilos',
      icon: MapPin,
      badge: 'Google Earth'
    },
    {
      id: 'csv',
      title: 'Tabela CSV (.csv)',
      desc: 'Tabela de atributos com coordenadas Latitude/Longitude e geometria em formato WKT',
      icon: FileSpreadsheet,
      badge: 'Excel / Pandas'
    },
    {
      id: 'geojson',
      title: 'GeoJSON Standard (.geojson)',
      desc: 'Padrão aberto IETF RFC 7946 para aplicações web, Leaflet, Mapbox e APIs REST',
      icon: FileCode,
      badge: 'Web & APIs'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="export-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Exportar Dados Geográficos</h2>
              <p className="text-xs text-slate-400">Converta e baixe camadas em múltiplos formatos vetoriais GIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Layer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Selecione a Camada de Origem
            </label>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.featureCount} feições, tipo: {l.geometryType})
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Formato de Exportação Desejado
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    id={`export-format-${fmt.id}`}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-emerald-200'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="font-semibold text-sm text-white">{fmt.title}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{fmt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Opções de Filtro e Nomenclatura
            </span>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Nome do Arquivo</label>
                <input
                  type="text"
                  placeholder={currentLayer?.name || 'nome_do_arquivo'}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={exportFilteredOnly}
                    onChange={(e) => setExportFilteredOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>
                    Exportar apenas feições filtradas ({currentLayer?.filteredCount ?? currentLayer?.featureCount ?? 0} de {currentLayer?.featureCount ?? 0})
                  </span>
                </label>
              </div>
            </div>

            {selectedFormat === 'csv' && (
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLatLon}
                    onChange={(e) => setIncludeLatLon(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Incluir colunas Latitude e Longitude</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWkt}
                    onChange={(e) => setIncludeWkt(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Incluir coluna WKT (Well-Known Text)</span>
                </label>
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            CRS: EPSG:4326 (WGS 84 Geográfico)
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-export"
              onClick={handleExport}
              disabled={isExporting || !currentLayer}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando Arquivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar e Baixar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
