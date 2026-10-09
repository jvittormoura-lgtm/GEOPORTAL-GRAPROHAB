import React, { useMemo, useState } from 'react';
import { 
  Search, Building, Home, Filter, ChevronUp, ChevronDown, Trees, Calendar, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { GisLayer } from '../types/gis';
import { DualRangeSlider } from './DualRangeSlider';
import { 
  extractFeaturesMetrics, 
  matchSmartSearch, 
  extractUhFromProperties,
  normalizeSearchText,
  extractYearFromProperties,
  filterFeatures,
  getFeatureMunicipio,
  getFeatureProtocolo,
  getFeatureDispensa
} from '../utils/geoJsonParser';

interface ConsumerPortalProps {
  layers: GisLayer[];
  onSelectFeature: (feature: GeoJSON.Feature) => void;
  onFilterChange: (municipio: string, empreendedor: string, protocolo: string, dispensa: string, anoRange: [number, number] | null) => void;
  municipioFilter: string;
  empreendedorFilter: string;
  protocoloFilter: string;
  dispensaFilter: string;
  anoFilter: [number, number] | null;
  onOpenGlobalFilters: () => void;
  globalFiltersCount: number;
  onClearGlobalFilters: () => void;
  onClearAllFilters?: () => void;
}

export const ConsumerPortal: React.FC<ConsumerPortalProps> = ({
  layers,
  onSelectFeature,
  onFilterChange,
  municipioFilter,
  empreendedorFilter,
  protocoloFilter,
  dispensaFilter,
  anoFilter,
  onOpenGlobalFilters,
  globalFiltersCount,
  onClearGlobalFilters,
  onClearAllFilters,
}) => {
  const [showAnoFilter, setShowAnoFilter] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isResultsExpanded, setIsResultsExpanded] = useState(true);
  const [isResultsDismissed, setIsResultsDismissed] = useState(false);

  // Extract all features from visible layers after applying layer filters
  const allFeatures = useMemo(() => {
    const list: GeoJSON.Feature[] = [];
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        const visibleFeatures = filterFeatures(l.data.features, l.filters);
        list.push(...visibleFeatures);
      }
    });
    return list;
  }, [layers]);

  // Extract unique municipalities in the dataset (normalized & sorted)
  // Extract from raw visible features to ensure the dropdown NEVER collapses when a filter is applied
  const municipalities = useMemo(() => {
    const map = new Map<string, string>(); // normKey -> displayKey
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        l.data.features.forEach(f => {
          const p = f.properties || {};
          const rawMun = getFeatureMunicipio(p);
          if (rawMun && rawMun.trim()) {
            const trimmed = rawMun.trim();
            const norm = normalizeSearchText(trimmed);
            if (!map.has(norm)) {
              map.set(norm, trimmed);
            }
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [layers]);

  // Extract unique protocols and dispensas from raw features so suggestions never vanish
  const protocolosList = useMemo(() => {
    const set = new Set<string>();
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        l.data.features.forEach(f => {
          const p = f.properties || {};
          const rawProt = getFeatureProtocolo(p);
          if (rawProt && rawProt.trim()) {
            set.add(rawProt.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [layers]);

  const dispensasList = useMemo(() => {
    const set = new Set<string>();
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        l.data.features.forEach(f => {
          const p = f.properties || {};
          const rawDisp = getFeatureDispensa(p);
          if (rawDisp && rawDisp.trim()) {
            set.add(rawDisp.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [layers]);

  // Extract global available year range from all raw features in visible layers
  // This avoids collapsing the range when an active year filter is applied (preventing 2020-2022 lockup)
  const globalAnoRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        l.data.features.forEach(f => {
          const p = f.properties || {};
          const numAno = extractYearFromProperties(p);
          if (numAno !== null) {
            if (numAno < min) min = numAno;
            if (numAno > max) max = numAno;
          }
        });
      }
    });
    // Se nenhum ano for encontrado em todo o dataset, mostrar um range padrão (ex: 2000 a ano atual)
    if (min === Infinity || max === -Infinity) {
      const currentYear = new Date().getFullYear();
      return [2000, currentYear] as [number, number];
    }
    if (min === max) {
      return [min - 1, max + 1] as [number, number];
    }
    return [min, max] as [number, number];
  }, [layers]);

  // Key metrics calculation using coherent extractor for 'ÁREA TOTAL DA GLEBA/M²' & 'Nº DE LOTES UNIDADES HABITACIONAIS'
  const stats = useMemo(() => {
    return extractFeaturesMetrics(allFeatures);
  }, [allFeatures]);

  const hasTextSearch = Boolean(municipioFilter.trim() || empreendedorFilter.trim() || protocoloFilter.trim() || dispensaFilter.trim());
  const hasQuickFilter = hasTextSearch || !!anoFilter;
  const hasAnyFilter = hasQuickFilter || globalFiltersCount > 0;

  // Filtered matching list for quick dropdown / preview:
  // Only auto-expand when text query is active to prevent lagging on year-only filtering of 1,000+ items
  const filteredList = useMemo(() => {
    if (!hasTextSearch) return [];
    return allFeatures;
  }, [allFeatures, hasTextSearch]);

  const previewList = useMemo(() => {
    return filteredList.slice(0, 40);
  }, [filteredList]);

  // Reset dismissed state whenever user alters search inputs
  React.useEffect(() => {
    setIsResultsDismissed(false);
  }, [municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter]);

  const handleClearAll = () => {
    setShowAnoFilter(false);
    setIsResultsDismissed(true);
    if (onClearAllFilters) {
      onClearAllFilters();
    } else {
      onFilterChange('', '', '', '', null);
      onClearGlobalFilters();
    }
  };

  return (
    <div className="bg-slate-50/95 backdrop-blur-md border-b-2 border-red-600/20 px-4 py-3 text-xs text-slate-900 z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Panel Title */}
        <div 
          className="flex items-center justify-between text-red-700 font-bold px-1 cursor-pointer select-none"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-[13px] uppercase tracking-wide">Filtros</span>
          </div>
          <div className="p-1 hover:bg-slate-200/50 rounded-full transition-colors">
            {isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isFiltersExpanded && (
          <>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Search Bars Container */}
          <div className="flex-1 flex flex-col gap-3 relative">
          
          {/* Top Row: Municipio and Empreendedor */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Municipio Dropdown */}
            <div className="relative flex-1 z-50 flex items-center">
              <select
                value={municipioFilter}
                onChange={(e) => onFilterChange(e.target.value, empreendedorFilter, protocoloFilter, dispensaFilter, anoFilter)}
                className="w-full px-3 py-1.5 pr-8 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-600 transition-all shadow-inner appearance-none cursor-pointer"
              >
                <option value="">Todos Municípios</option>
                {municipalities.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {municipioFilter ? (
                <button
                  type="button"
                  onClick={() => onFilterChange('', empreendedorFilter, protocoloFilter, dispensaFilter, anoFilter)}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpar município"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>

            {/* Empreendedor */}
            <div className="relative flex-1 z-50 flex items-center">
              <input
                type="text"
                placeholder="Empreendedor / Interessado"
                value={empreendedorFilter}
                onChange={(e) => onFilterChange(municipioFilter, e.target.value, protocoloFilter, dispensaFilter, anoFilter)}
                className="w-full px-3 py-1.5 pr-7 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 transition-all shadow-inner"
              />
              {empreendedorFilter && (
                <button
                  type="button"
                  onClick={() => onFilterChange(municipioFilter, '', protocoloFilter, dispensaFilter, anoFilter)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpar empreendedor"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Protocolo, Dispensa, Ano, and Limpar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-start w-full">
            {/* Protocolo */}
            <div className="relative flex-1 min-w-[120px] z-50 flex flex-col">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Nº Protocolo"
                  value={protocoloFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Protocolo and Dispensa are mutually exclusive in GRAPROHAB datasets
                    onFilterChange(municipioFilter, empreendedorFilter, val, val ? '' : dispensaFilter, anoFilter);
                  }}
                  className="w-full px-3 py-1.5 pr-7 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 transition-all shadow-inner"
                  list="protocolos-datalist"
                />
                {protocoloFilter && (
                  <button
                    type="button"
                    onClick={() => onFilterChange(municipioFilter, empreendedorFilter, '', dispensaFilter, anoFilter)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Limpar protocolo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <datalist id="protocolos-datalist">
                {protocolosList.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <small className="text-[10px] text-slate-500 mt-1 block">ex: Protocolo 1999</small>
            </div>

            {/* Dispensa */}
            <div className="relative flex-1 min-w-[120px] z-50 flex flex-col">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Nº Dispensa"
                  value={dispensaFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Protocolo and Dispensa are mutually exclusive in GRAPROHAB datasets
                    onFilterChange(municipioFilter, empreendedorFilter, val ? '' : protocoloFilter, val, anoFilter);
                  }}
                  className="w-full px-3 py-1.5 pr-7 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 transition-all shadow-inner"
                  list="dispensas-datalist"
                />
                {dispensaFilter && (
                  <button
                    type="button"
                    onClick={() => onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, '', anoFilter)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Limpar dispensa"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <datalist id="dispensas-datalist">
                {dispensasList.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <small className="text-[10px] text-slate-500 mt-1 block">ex: DISPENSA 123/2024</small>
            </div>

            {/* Ano Range Slider Toggle & Content */}
            {globalAnoRange && (
              <div className="relative z-50 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAnoFilter(!showAnoFilter)}
                    className={`px-2.5 py-1.5 rounded-xl h-[30px] flex items-center gap-1.5 shrink-0 transition-all border shadow-inner text-xs cursor-pointer ${
                      anoFilter
                        ? 'bg-red-600/20 border-red-600 text-red-600 font-semibold'
                        : showAnoFilter
                        ? 'bg-slate-100 border-slate-300 text-slate-900'
                        : 'bg-slate-50/90 border-slate-300/80 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title="Filtro por Ano de Entrada"
                  >
                    <Calendar className="w-3.5 h-3.5 text-red-600" />
                    <span>
                      {anoFilter ? `${anoFilter[0]}–${anoFilter[1]}` : 'Ano'}
                    </span>
                  </button>

                  {anoFilter && (
                    <button
                      type="button"
                      onClick={() => onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter, null)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Remover filtro de ano"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={onOpenGlobalFilters}
                  className={`px-2 py-1 rounded-md text-[10px] flex items-center gap-1 transition-colors border cursor-pointer ${
                    globalFiltersCount > 0
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-700 font-medium'
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                  title="Filtros Avançados Globais"
                >
                  <Filter className="w-3 h-3 text-indigo-400" />
                  Filtros avançados
                  {globalFiltersCount > 0 && (
                    <span className="px-1 py-0.5 bg-indigo-500 text-[9px] text-white rounded-full font-mono leading-none">
                      {globalFiltersCount}
                    </span>
                  )}
                </button>

                {showAnoFilter && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowAnoFilter(false)} 
                    />
                    <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[290px] sm:w-[320px] z-50 animate-in fade-in zoom-in-95 duration-150">
                      <DualRangeSlider
                        min={globalAnoRange[0]}
                        max={globalAnoRange[1]}
                        value={anoFilter}
                        onChange={(value) => {
                          onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter, value);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Limpar Filtros Button */}
            {hasAnyFilter && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 rounded-xl text-xs font-semibold transition-colors border h-[30px] self-end sm:self-start sm:mt-0 flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                title="Limpar todos os filtros da busca"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
          
          {/* Quick Search Preview Results Popup (Vertical Dropdown) */}
          <div className="w-full relative z-50">
            {hasQuickFilter && !isResultsDismissed && filteredList.length > 0 && (
              <div className="absolute top-0 left-0 w-full md:w-[400px] mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-300/80 rounded-xl shadow-2xl flex flex-col p-1.5 gap-0.5 overflow-hidden">
                <div className="px-2 pt-1 pb-1.5 mb-1 border-b border-slate-200/80 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Resultados da Busca</span>
                  <div className="flex items-center gap-1.5">
                    <span>{filteredList.length} encontrados</span>
                    <button 
                      onClick={() => setIsResultsExpanded(!isResultsExpanded)}
                      className="p-1 hover:bg-slate-200/50 rounded-md transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={isResultsExpanded ? "Recolher resultados" : "Expandir resultados"}
                    >
                      {isResultsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => setIsResultsDismissed(true)}
                      className="p-1 hover:bg-slate-200/50 rounded-md transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Fechar pré-visualização"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className={`overflow-y-auto results-scrollbar transition-all duration-300 ease-in-out ${isResultsExpanded ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col gap-0.5">
                {previewList.map((f, idx) => {
                  const p = f.properties || {};
                  
                  let title = 'Sem identificação';
                  const rawProt = p.PROTOCOLO ?? p.protocolo ?? p.Protocolo;
                  const rawDisp = p.expediente_dispensa ?? p.dispensa ?? p.DISPENSA ?? p['Expediente Dispensa'] ?? p['EXPEDIENTE DISPENSA'];

                  let badge = null;

                  if (rawProt !== null && rawProt !== undefined && String(rawProt).trim() !== '') {
                    title = String(rawProt).trim();
                    badge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] border border-emerald-500/20 font-semibold ml-2 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Aprovado
                      </span>
                    );
                  } else if (rawDisp !== null && rawDisp !== undefined && String(rawDisp).trim() !== '') {
                    title = String(rawDisp).trim();
                    badge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-orange-500/10 text-orange-600 text-[8px] border border-orange-500/20 font-semibold ml-2 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Dispensado
                      </span>
                    );
                  }

                  const mun = p.municipio || p.cidade || p.MUNICIPIO || '';
                  const prop = p.PROPRIETARIO || p.proprietario || p.Proprietario || p.interessado_empreendedor || p.Interessado || p.INTERESSADO || '';
                  const uh = extractUhFromProperties(p);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectFeature(f)}
                      className="w-full text-left px-2.5 py-2 bg-transparent hover:bg-slate-100/80 rounded-lg text-slate-800 transition-colors flex items-center gap-2 group"
                      title={`Clique para centralizar no mapa: ${title}`}
                    >
                      <div className="p-1.5 bg-slate-100 group-hover:bg-red-50/60 rounded-md border border-slate-300 group-hover:border-red-600/30 transition-colors shrink-0">
                        <Building className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center">
                          <span className="font-semibold text-[11px] truncate">{title}</span>
                          {badge}
                        </div>
                        {(mun || prop) && (
                          <span className="text-[10px] text-slate-500 font-mono truncate">
                            {mun}
                            {mun && prop && ' • '}
                            {prop}
                          </span>
                        )}
                      </div>
                      {uh > 0 && (
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider mb-[2px]">Lotes/UH</span>
                          <span className="text-[10px] px-1.5 py-[1px] bg-red-50/40 text-red-500 rounded-md font-mono font-bold border border-red-600/20">
                            {uh}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
                  </div>
                  {filteredList.length > previewList.length && (
                    <div className="px-3 py-1.5 text-[10px] text-slate-500 text-center bg-slate-50 border-t border-slate-200">
                      Exibindo os primeiros {previewList.length} de {filteredList.length} resultados. Todos estão visíveis no mapa.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* HUD Indicator (Top Right/Center in Consumer Portal) - Dynamic Metrics */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 shrink-0">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 uppercase font-mono">
              <Home className="w-3 h-3 text-red-600" />
              <span>Unidades/Lotes Registrados</span>
            </div>
            <span className="text-sm font-bold text-red-600 font-mono tracking-tight" title="Soma total do campo Nº de Unidades Habitacionais (UH)">
              {stats.totalUh > 0 ? stats.totalUh.toLocaleString('pt-BR') : '0'} <span className="text-xs font-normal text-red-500">UH</span>
            </span>
          </div>

          <div className="w-px h-7 bg-slate-100" />

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 uppercase font-mono">
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>Área Mapeada</span>
            </div>
            <span className="text-sm font-bold text-emerald-400 font-mono tracking-tight" title={`Área total da gleba: ${stats.totalAreaM2.toLocaleString('pt-BR')} m²`}>
              {stats.totalHectares} <span className="text-xs font-normal text-emerald-700">ha</span>
            </span>
          </div>
        </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

