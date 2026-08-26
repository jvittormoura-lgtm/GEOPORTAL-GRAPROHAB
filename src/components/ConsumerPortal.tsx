import React, { useMemo, useState } from 'react';
import { 
  Search, Building, Home, Trees, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import { GisLayer } from '../types/gis';
import { DualRangeSlider } from './DualRangeSlider';
import { 
  extractFeaturesMetrics, 
  matchSmartSearch, 
  extractUhFromProperties,
  normalizeSearchText,
  extractYearFromProperties
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
}) => {
  const [showAnoFilter, setShowAnoFilter] = useState(false);

  // Extract all features from visible layers
  const allFeatures = useMemo(() => {
    const list: GeoJSON.Feature[] = [];
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        list.push(...l.data.features);
      }
    });
    return list;
  }, [layers]);

  // Extract unique municipalities in the dataset (normalized & sorted)
  const municipalities = useMemo(() => {
    const map = new Map<string, string>(); // normKey -> displayKey
    allFeatures.forEach(f => {
      const p = f.properties || {};
      const rawMun = p.municipio || p.MUNICIPIO || p.cidade || p.CIDADE || p.Municipio || '';
      if (rawMun && typeof rawMun === 'string' && rawMun.trim()) {
        const trimmed = rawMun.trim();
        const norm = normalizeSearchText(trimmed);
        if (!map.has(norm)) {
          map.set(norm, trimmed);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [allFeatures]);

  // Extract unique protocols and dispensas
  const protocolosList = useMemo(() => {
    const set = new Set<string>();
    allFeatures.forEach(f => {
      const p = f.properties || {};
      const rawProt = p.PROTOCOLO ?? p.protocolo ?? p.Protocolo;
      
      if (rawProt !== null && rawProt !== undefined && rawProt !== '') {
        const strProt = String(rawProt).trim();
        if (strProt) set.add(strProt);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [allFeatures]);

  const dispensasList = useMemo(() => {
    const set = new Set<string>();
    allFeatures.forEach(f => {
      const p = f.properties || {};
      const rawDisp = p.expediente_dispensa ?? p.dispensa ?? p.DISPENSA ?? p['Expediente Dispensa'] ?? p['EXPEDIENTE DISPENSA'];
      
      if (rawDisp !== null && rawDisp !== undefined && rawDisp !== '') {
        const strDisp = String(rawDisp).trim();
        if (strDisp) set.add(strDisp);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [allFeatures]);

  const globalAnoRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    allFeatures.forEach(f => {
      const p = f.properties || {};
      const numAno = extractYearFromProperties(p);
      if (numAno !== null) {
        if (numAno < min) min = numAno;
        if (numAno > max) max = numAno;
      }
    });
    // Se nenhum ano for encontrado em todo o dataset, mostrar um range padrão (ex: 2015 a ano atual)
    // Isso garante que o componente de UI não desapareça de forma inesperada caso os dados não tenham a coluna correta.
    if (min === Infinity || max === -Infinity) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 10, currentYear] as [number, number];
    }
    if (min === max) {
      // Se todos tiverem o mesmo ano, dar um espaçamento mínimo para a UI do slider funcionar
      return [min - 1, max + 1] as [number, number];
    }
    return [min, max] as [number, number];
  }, [allFeatures]);

  // Key metrics calculation using coherent extractor for 'ÁREA TOTAL DA GLEBA/M²' & 'Nº DE LOTES UNIDADES HABITACIONAIS'
  const stats = useMemo(() => {
    return extractFeaturesMetrics(allFeatures);
  }, [allFeatures]);

  // Filtered matching list for quick dropdown / preview using smart accent-insensitive search
  const filteredList = useMemo(() => {
    if (!municipioFilter.trim() && !empreendedorFilter.trim() && !protocoloFilter.trim() && !dispensaFilter.trim() && !anoFilter) return [];

    return allFeatures.filter(f => {
      const p = f.properties || {};
      
      let matchMun = true;
      if (municipioFilter.trim()) {
        const featMun = p.municipio || p.MUNICIPIO || p.cidade || p.CIDADE || p.Municipio || '';
        matchMun = normalizeSearchText(String(featMun)) === normalizeSearchText(municipioFilter);
      }

      let matchEmp = true;
      if (empreendedorFilter.trim()) {
        const rawEmp = p.PROPRIETARIO ?? p.proprietario ?? p.Proprietario ?? '';
        matchEmp = matchSmartSearch(String(rawEmp), empreendedorFilter);
      }

      let matchProt = true;
      if (protocoloFilter.trim()) {
        const rawProt = p.PROTOCOLO ?? p.protocolo ?? p.Protocolo ?? '';
        matchProt = matchSmartSearch(String(rawProt), protocoloFilter);
      }
      
      let matchDisp = true;
      if (dispensaFilter.trim()) {
        const rawDisp = p.expediente_dispensa ?? p.dispensa ?? p.DISPENSA ?? p['Expediente Dispensa'] ?? p['EXPEDIENTE DISPENSA'] ?? '';
        matchDisp = matchSmartSearch(String(rawDisp), dispensaFilter);
      }

      let matchAno = true;
      if (anoFilter) {
        const numAno = extractYearFromProperties(p);
        if (numAno === null || numAno < anoFilter[0] || numAno > anoFilter[1]) {
          matchAno = false;
        }
      }

      return matchMun && matchEmp && matchProt && matchDisp && matchAno;
    });
  }, [allFeatures, municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter, anoFilter]);

  const hasAnyFilter = municipioFilter.trim() || empreendedorFilter.trim() || protocoloFilter.trim() || dispensaFilter.trim() || !!anoFilter;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 text-xs text-white z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Bars Container */}
        <div className="flex-1 flex flex-col gap-3 relative">
          
          {/* Top Row: Municipio and Empreendedor */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Municipio Dropdown */}
            <div className="relative flex-1 z-50">
              <select
                value={municipioFilter}
                onChange={(e) => onFilterChange(e.target.value, empreendedorFilter, protocoloFilter, dispensaFilter, anoFilter)}
                className="w-full px-3 py-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all shadow-inner appearance-none cursor-pointer"
              >
                <option value="">Todos Municípios</option>
                {municipalities.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>

            {/* Empreendedor */}
            <div className="relative flex-1 z-50">
              <input
                type="text"
                placeholder="Empreendedor / Interessado"
                value={empreendedorFilter}
                onChange={(e) => onFilterChange(municipioFilter, e.target.value, protocoloFilter, dispensaFilter, anoFilter)}
                className="w-full px-3 py-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Bottom Row: Protocolo, Dispensa, Ano, and Limpar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-start w-full">
            {/* Protocolo */}
            <div className="relative flex-1 min-w-[120px] z-50 flex flex-col">
              <input
                type="text"
                placeholder="Nº Protocolo"
                value={protocoloFilter}
                onChange={(e) => onFilterChange(municipioFilter, empreendedorFilter, e.target.value, dispensaFilter, anoFilter)}
                className="w-full px-3 py-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                list="protocolos-datalist"
              />
              <datalist id="protocolos-datalist">
                {protocolosList.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <small className="text-[10px] text-slate-500 mt-1 block">ex: Protocolo 1999</small>
            </div>

            {/* Dispensa */}
            <div className="relative flex-1 min-w-[120px] z-50 flex flex-col">
              <input
                type="text"
                placeholder="Nº Dispensa"
                value={dispensaFilter}
                onChange={(e) => onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, e.target.value, anoFilter)}
                className="w-full px-3 py-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                list="dispensas-datalist"
              />
              <datalist id="dispensas-datalist">
                {dispensasList.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <small className="text-[10px] text-slate-500 mt-1 block">ex: DISPENSA 123/2024</small>
            </div>

            {/* Ano Range Slider Toggle & Content */}
            {globalAnoRange && (
              <div className={`relative flex flex-col sm:flex-row items-center gap-3 transition-all ${showAnoFilter ? 'flex-[1.5] min-w-[180px]' : ''}`}>
                <button
                  onClick={() => {
                    setShowAnoFilter(!showAnoFilter);
                    if (showAnoFilter && anoFilter) {
                      onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter, null);
                    }
                  }}
                  className={`p-2 rounded-xl h-[30px] w-[30px] flex items-center justify-center shrink-0 self-end sm:self-start sm:mt-[2px] transition-colors border shadow-inner ${showAnoFilter || anoFilter ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-950/90 border-slate-700/80 text-slate-400 hover:text-white'}`}
                  title="Filtro por Ano de Entrada"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                {showAnoFilter && (
                  <div className="relative flex-1 w-full z-50 flex flex-col items-center">
                    <DualRangeSlider
                      min={globalAnoRange[0]}
                      max={globalAnoRange[1]}
                      value={anoFilter}
                      onChange={(value) => onFilterChange(municipioFilter, empreendedorFilter, protocoloFilter, dispensaFilter, value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Limpar Filtros Button */}
            {hasAnyFilter && (
              <button
                onClick={() => {
                  onFilterChange('', '', '', '', null);
                  setShowAnoFilter(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-slate-700 h-[30px] self-end sm:self-start sm:mt-0"
              >
                Limpar
              </button>
            )}
          </div>
          
          {/* Quick Search Preview Results Popup (Vertical Dropdown) */}
          <div className="w-full relative z-50">
            {hasAnyFilter && filteredList.length > 0 && (
              <div className="absolute top-0 left-0 w-full md:w-[400px] mt-1.5 max-h-[350px] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl flex flex-col p-1.5 gap-0.5">
                <div className="px-2 pt-1 pb-1.5 mb-1 border-b border-slate-800/80 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Resultados da Busca</span>
                  <span>{filteredList.length} encontrados</span>
                </div>
                {filteredList.map((f, idx) => {
                  const p = f.properties || {};
                  
                  let title = 'Sem identificação';
                  const rawProt = p.PROTOCOLO ?? p.protocolo ?? p.Protocolo;
                  const rawDisp = p.expediente_dispensa ?? p.dispensa ?? p.DISPENSA ?? p['Expediente Dispensa'] ?? p['EXPEDIENTE DISPENSA'];

                  let badge = null;

                  if (rawProt !== null && rawProt !== undefined && String(rawProt).trim() !== '') {
                    title = String(rawProt).trim();
                    badge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-emerald-500/10 text-emerald-400 text-[8px] border border-emerald-500/20 font-semibold ml-2 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Aprovado
                      </span>
                    );
                  } else if (rawDisp !== null && rawDisp !== undefined && String(rawDisp).trim() !== '') {
                    title = String(rawDisp).trim();
                    badge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-orange-500/10 text-orange-400 text-[8px] border border-orange-500/20 font-semibold ml-2 shrink-0">
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
                      className="w-full text-left px-2.5 py-2 bg-transparent hover:bg-slate-800/80 rounded-lg text-slate-200 transition-colors flex items-center gap-2 group"
                      title={`Clique para centralizar no mapa: ${title}`}
                    >
                      <div className="p-1.5 bg-slate-800 group-hover:bg-sky-950/60 rounded-md border border-slate-700 group-hover:border-sky-500/30 transition-colors shrink-0">
                        <Building className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center">
                          <span className="font-semibold text-[11px] truncate">{title}</span>
                          {badge}
                        </div>
                        {(mun || prop) && (
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            {mun}
                            {mun && prop && ' • '}
                            {prop}
                          </span>
                        )}
                      </div>
                      {uh > 0 && (
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider mb-[2px]">Lotes/UH</span>
                          <span className="text-[10px] px-1.5 py-[1px] bg-sky-950/40 text-sky-300 rounded-md font-mono font-bold border border-sky-500/20">
                            {uh}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* HUD Indicator (Top Right/Center in Consumer Portal) - Dynamic Metrics */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4 shrink-0">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <Home className="w-3 h-3 text-sky-400" />
              <span>Unidades / Lotes</span>
            </div>
            <span className="text-sm font-bold text-sky-400 font-mono tracking-tight" title="Soma total do campo Nº de Lotes / Unidades Habitacionais (UH)">
              {stats.totalUh > 0 ? stats.totalUh.toLocaleString('pt-BR') : '0'} <span className="text-xs font-normal text-sky-300">UH</span>
            </span>
          </div>

          <div className="w-px h-7 bg-slate-800" />

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>Área Mapeada</span>
            </div>
            <span className="text-sm font-bold text-emerald-400 font-mono tracking-tight" title={`Área total da gleba: ${stats.totalAreaM2.toLocaleString('pt-BR')} m²`}>
              {stats.totalHectares} <span className="text-xs font-normal text-emerald-300">ha</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

