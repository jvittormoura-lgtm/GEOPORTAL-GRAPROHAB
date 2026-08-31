import React, { useState } from 'react';
import { GisLayer, ExportFormat, AppMode } from '../types/gis';
import { exportToShapefileZip } from '../utils/shapefileExporter';
import { exportToKml } from '../utils/kmlExporter';
import { exportToCsv } from '../utils/csvExporter';
import { filterFeatures } from '../utils/geoJsonParser';
import JSZip from 'jszip';
import { Download, FileCode, FileSpreadsheet, Archive, MapPin, CheckCircle2, AlertCircle, Loader2, Package, Lock, ShieldAlert } from 'lucide-react';

interface ExportModalProps {
  layers: GisLayer[];
  activeLayerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  appMode?: AppMode;
  onRequireAuth?: (callback: () => void) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  layers,
  activeLayerId,
  isOpen,
  onClose,
  appMode = 'cidadao',

  onRequireAuth
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
      // If citizen opens export modal and somehow github_bundle is selected, fallback to geojson
      if (appMode !== 'gestor' && selectedFormat === 'github_bundle') {
        setSelectedFormat('geojson');
      }
    }
  }, [isOpen, activeLayerId, layers, appMode]);

  if (!isOpen) return null;

  const isGestor = appMode === 'gestor';
  const currentLayer = layers.find(l => l.id === selectedLayerId) || layers[0];
  const effectiveFileName = fileName.trim() || (selectedFormat === 'github_bundle' ? 'pacote_github_graprohab' : (currentLayer ? currentLayer.name.toLowerCase().replace(/\s+/g, '_') : 'map_export'));

  const handleExport = async () => {
    if (selectedFormat === 'github_bundle' && !isGestor) {
      if (onRequireAuth) {
        onRequireAuth(() => {
          setSelectedFormat('github_bundle');
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'A exportação do pacote para o GitHub é restrita ao perfil de Gestor.'
        });
      }
      return;
    }

    if (selectedFormat !== 'github_bundle' && !currentLayer) return;

    setIsExporting(true);
    setStatusMessage(null);

    try {
      let blob: Blob;
      let downloadExt = '';

      if (selectedFormat === 'github_bundle') {
        const zip = new JSZip();
        const configJson = {
          camadas_fixas: [] as any[]
        };

        const nameCounts: Record<string, number> = {};

        for (let i = 0; i < layers.length; i++) {
          const lyr = layers[i];
          let safeName = lyr.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || `camada_${i + 1}`;
          
          if (nameCounts[safeName]) {
            nameCounts[safeName]++;
            safeName = `${safeName}_${nameCounts[safeName]}`;
          } else {
            nameCounts[safeName] = 1;
          }
          
          const layerFileName = `${safeName}.geojson`;
          
          zip.file(`data/${layerFileName}`, JSON.stringify(lyr.data, null, 2));

          configJson.camadas_fixas.push({
            nome: lyr.name,
            arquivo: `data/${layerFileName}`,
            visivel: lyr.visible,
            opacity: lyr.opacity,
            popupTitleField: lyr.popupTitleField || undefined,
            popupVisibleFields: lyr.popupVisibleFields || [],
            popupFieldOrder: lyr.popupFieldOrder || [],
            estilo: lyr.style
          });
        }

        zip.file('mapas-config.json', JSON.stringify(configJson, null, 2));
        zip.file('INSTRUCOES_GITHUB.txt', `COMO USAR E ATUALIZAR AS CAMADAS NO SEU GITHUB:

1. Extraia este arquivo ZIP baixado.
2. Você verá o arquivo 'mapas-config.json' e a pasta 'data/' contendo suas camadas em formato .geojson.
3. Copie 'mapas-config.json' e a pasta 'data/' para dentro da pasta 'public/' do repositório no GitHub.
4. Faça commit e push no GitHub.

COMO ATUALIZAR MENSALMENTE:
- Basta substituir os arquivos .geojson dentro da pasta 'public/data/' no seu GitHub por arquivos atualizados de mesmo nome.
- O GitHub Actions recompilará e atualizará o site automaticamente em menos de 1 minuto!`);

        blob = await zip.generateAsync({ type: 'blob' });
        downloadExt = '.zip';
      } else {
        // 1. Prepare FeatureCollection
        let exportFeatures = currentLayer.data.features;
        if (exportFilteredOnly) {
          exportFeatures = filterFeatures(
            currentLayer.data.features,
            currentLayer.filters
          );
        }

        if (exportFeatures.length === 0) {
          throw new Error('Nenhuma feição encontrada para exportar com os filtros atuais.');
        }

        const exportGeoJson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: exportFeatures
        };

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
        text: selectedFormat === 'github_bundle'
          ? `Pacote para GitHub com ${layers.length} camada(s) gerado e baixado com sucesso!`
          : `Arquivo "${effectiveFileName}${downloadExt}" gerado e baixado com sucesso!`
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

  const formats: { id: ExportFormat; title: string; desc: string; icon: any; badge: string; isLocked?: boolean }[] = [
    {
      id: 'github_bundle',
      title: 'Pacote para GitHub Pages (.zip)',
      desc: 'Exporta todas as camadas (.geojson) + mapas-config.json para hospedar e atualizar no GitHub',
      icon: isGestor ? Package : Lock,
      badge: isGestor ? 'Gestor' : 'Acesso Gestor',
      isLocked: !isGestor
    },
    {
      id: 'geojson',
      title: 'GeoJSON Standard (.geojson)',
      desc: 'Padrão aberto IETF RFC 7946 para aplicações web, Leaflet, Mapbox e APIs REST',
      icon: FileCode,
      badge: 'Web & APIs'
    },
    {
      id: 'shp',
      title: 'Shapefile ESRI (.zip)',
      desc: `Pacote binário completo com .SHP, .SHX, .DBF e projeção SIRGAS 2000 .PRJ para QGIS, ArcGIS e AutoCAD`,
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
    }
  ];

  const handleFormatClick = (fmtId: ExportFormat, isLocked?: boolean) => {
    if (isLocked) {
      if (onRequireAuth) {
        onRequireAuth(() => {
          setSelectedFormat(fmtId);
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Esta opção requer autenticação com perfil de Gestor.'
        });
      }
      return;
    }
    setSelectedFormat(fmtId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="export-modal"
        className="w-full max-w-2xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Exportar Dados Geográficos</h2>
              <p className="text-xs text-slate-500">Converta e baixe camadas em múltiplos formatos vetoriais GIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Layer Selection (hidden or styled when exporting full github bundle) */}
          {selectedFormat === 'github_bundle' ? (
            <div className="p-4 bg-emerald-950/30 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Exportação de Todas as {layers.length} Camadas para GitHub Pages</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Este pacote gera os arquivos <strong>.geojson</strong> de cada camada ativa e o arquivo de configuração <strong>mapas-config.json</strong> com estilos e visibilidade preservados.
              </p>
              <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Atualizações mensais: bastará substituir os arquivos .geojson dentro de <code>public/data/</code> no GitHub.</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Selecione a Camada de Origem
              </label>
              <select
                value={selectedLayerId}
                onChange={(e) => setSelectedLayerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.featureCount} feições, tipo: {l.geometryType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Format Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                    onClick={() => handleFormatClick(fmt.id, fmt.isLocked)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-emerald-200'
                        : fmt.isLocked
                          ? 'bg-white/60 border-slate-200 hover:border-slate-300 text-slate-500 opacity-80 hover:opacity-100'
                          : 'bg-slate-100/60 border-slate-300/60 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : fmt.isLocked ? 'text-amber-400/80' : 'text-slate-500'}`} />
                        <span className="font-semibold text-sm text-slate-900">{fmt.title}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-emerald-500/20 text-emerald-700' 
                          : fmt.isLocked
                            ? 'bg-amber-950/60 border border-amber-500/30 text-amber-300'
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {fmt.isLocked && <Lock className="w-2.5 h-2.5" />}
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{fmt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          {selectedFormat !== 'github_bundle' && (
            <div className="p-4 bg-slate-100/50 rounded-xl border border-slate-300/60 space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Opções de Filtro e Nomenclatura
              </span>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Nome do Arquivo</label>
                  <input
                    type="text"
                    placeholder={currentLayer?.name || 'nome_do_arquivo'}
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={exportFilteredOnly}
                      onChange={(e) => setExportFilteredOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                    />
                    <span>
                      Exportar apenas feições filtradas ({currentLayer?.filteredCount ?? currentLayer?.featureCount ?? 0} de {currentLayer?.featureCount ?? 0})
                    </span>
                  </label>
                </div>
              </div>

              {selectedFormat === 'csv' && (
                <div className="pt-2 border-t border-slate-300/60 flex flex-wrap gap-4 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLatLon}
                      onChange={(e) => setIncludeLatLon(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                    />
                    <span>Incluir colunas Latitude e Longitude</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeWkt}
                      onChange={(e) => setIncludeWkt(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                    />
                    <span>Incluir coluna WKT (Well-Known Text)</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-50 border-rose-500/50 text-rose-200'
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
        <div className="px-6 py-4 border-t border-slate-200 bg-white/90 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            CRS: EPSG:4674 (SIRGAS 2000 Geográfico)
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-export"
              onClick={handleExport}
              disabled={isExporting || (selectedFormat === 'github_bundle' ? layers.length === 0 : !currentLayer)}
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
