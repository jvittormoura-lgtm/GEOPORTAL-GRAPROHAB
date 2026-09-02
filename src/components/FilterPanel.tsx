import React, { useState } from 'react';
import { GisLayer, AttributeFilter, FilterOperator } from '../types/gis';
import { Filter, Plus, Trash2, CheckCircle2, SlidersHorizontal, Map, X, Sparkles, MapPin, Building, ChevronDown, ChevronUp } from 'lucide-react';
import { filterFeatures, extractUhFromProperties } from '../utils/geoJsonParser';

interface FilterPanelProps {
  layer: GisLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFilters: (layerId: string, filters: AttributeFilter[]) => void;
  onOpenAiAssistant?: () => void;
  onRequestPickRadiusCenter?: () => void;
  onSelectFeature?: (feature: GeoJSON.Feature) => void;
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  '=': 'Igual a (=)',
  '!=': 'Diferente de (!=)',
  '>': 'Maior que (>)',
  '>=': 'Maior ou igual (>=)',
  '<': 'Menor que (<)',
  '<=': 'Menor ou igual (<=)',
  'contains': 'Contém o texto',
  'startsWith': 'Começa com',
  'in': 'Está na lista (valores separados por vírgula)',
  'between': 'Está no intervalo (Entre Min e Max)',
  'isNull': 'É nulo / Vazio',
  'isNotNull': 'Não é nulo / Preenchido',
  'global_search': 'Busca Global',
  'match_municipio': 'Município (Busca)',
  'match_empreendedor': 'Empreendedor (Busca)',
  'match_protocolo': 'Protocolo (Busca)',
  'match_dispensa': 'Dispensa (Busca)',
  'match_ano_entrada': 'Ano de Entrada (Busca)',
  'match_status': 'Status (Busca)'
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  layer,
  isOpen,
  onClose,
  onUpdateFilters,
  onOpenAiAssistant,
  onSelectFeature
}) => {
  const [filters, setFilters] = useState<AttributeFilter[]>([]);

  // New filter creation state
  const [newProp, setNewProp] = useState<string>('');
  const [newOp, setNewOp] = useState<FilterOperator>('contains');
  const [newVal, setNewVal] = useState<string>('');
  const [newSecVal, setNewSecVal] = useState<string>('');

  const [isResultsExpanded, setIsResultsExpanded] = useState(true);

  // List of property names that are already covered by main quick filters.
  // We exclude them from the advanced filter dropdown.
  const EXCLUDED_PROPS = React.useMemo(() => new Set([
    'municipio', 'MUNICIPIO', 'cidade', 'CIDADE', 'Municipio',
    'PROPRIETARIO', 'proprietario', 'Proprietario', 
    'PROTOCOLO', 'protocolo', 'Protocolo',
    'expediente_dispensa', 'dispensa', 'DISPENSA', 'Expediente Dispensa', 'EXPEDIENTE DISPENSA',
    'ANO ENTRADA', 'ANO', 'ano', 'Ano', 'ano_entrada', 'ANO_ENTRADA',
    'DATA DE ENTRADA', 'DATA DO CERTIFICADO', 'data', 'DATA', 'Data'
  ]), []);

  const filteredSchema = React.useMemo(() => {
    if (!layer) return [];
    return layer.propertiesSchema.filter(p => !EXCLUDED_PROPS.has(p.key));
  }, [layer, EXCLUDED_PROPS]);

  // Sync state when layer or isOpen changes
  React.useEffect(() => {
    if (layer && isOpen) {
      setFilters(layer.filters.filter(f => !f.id.startsWith('search_')));
      const initialProp = filteredSchema[0]?.key || '';
      setNewProp(initialProp);
      const schema = filteredSchema.find(p => p.key === initialProp);
      setNewOp(schema?.type === 'number' ? '>' : 'contains');
      setNewVal('');
      setNewSecVal('');
    }
  }, [layer, isOpen, filteredSchema]);

  const filteredList = React.useMemo(() => {
    if (!layer || !layer.data.features || filters.length === 0) return [];
    return filterFeatures(layer.data.features, filters);
  }, [layer, filters]);

  if (!isOpen || !layer) return null;

  const propSchema = layer.propertiesSchema.find(p => p.key === newProp);

  const handleAddFilter = () => {
    if (!newProp) return;
    if (newOp !== 'isNull' && newOp !== 'isNotNull' && newVal === '') return;

    const schema = layer.propertiesSchema.find(p => p.key === newProp);
    const newFilter: AttributeFilter = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      property: newProp,
      type: schema?.type === 'number' ? 'number' : schema?.type === 'boolean' ? 'boolean' : 'string',
      operator: newOp,
      value: schema?.type === 'number' ? Number(newVal) : newVal,
      secondaryValue: newOp === 'between' ? Number(newSecVal) : undefined,
      active: true
    };

    const updated = [...filters, newFilter];
    setFilters(updated);
    setNewVal('');
    setNewSecVal('');
    saveChanges(updated);
  };

  const handleRemoveFilter = (id: string) => {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    saveChanges(updated);
  };

  const handleToggleFilter = (id: string) => {
    const updated = filters.map(f => f.id === id ? { ...f, active: !f.active } : f);
    setFilters(updated);
    saveChanges(updated);
  };

  const handleClearAll = () => {
    setFilters([]);
    saveChanges([]);
  };

  const saveChanges = (
    currentFilters: AttributeFilter[]
  ) => {
    onUpdateFilters(layer.id, currentFilters);
  };

  const applicableOperators: FilterOperator[] = propSchema?.type === 'number'
    ? ['=', '!=', '>', '>=', '<', '<=', 'between', 'isNull', 'isNotNull']
    : propSchema?.type === 'boolean'
    ? ['=', '!=', 'isNull', 'isNotNull']
    : ['contains', 'startsWith', '=', '!=', 'in', 'isNull', 'isNotNull'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="filter-panel-modal"
        className="w-full max-w-2xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filtragem Avançada de Atributos</h2>
              <p className="text-xs text-slate-500">
                Camada: <strong className="text-slate-900">{layer.name}</strong> • Feições ativas:{' '}
                <span className="text-emerald-400 font-mono font-semibold">{layer.filteredCount}</span> de{' '}
                <span className="font-mono text-slate-700">{layer.featureCount}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filters.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Limpar todos os filtros desta camada"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
            {/* {onOpenAiAssistant && (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAiAssistant) onOpenAiAssistant();
                }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pedir à IA</span>
              </button>
            )} */}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100" title="Fechar painel">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Filter Box */}
          <div className="p-4 bg-slate-100/60 rounded-xl border border-slate-300/80 space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Criar Nova Regra de Filtro
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Field Select */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Campo</label>
                <select
                  value={newProp}
                  onChange={(e) => {
                    setNewProp(e.target.value);
                    const sc = filteredSchema.find(p => p.key === e.target.value);
                    setNewOp(sc?.type === 'number' ? '>' : 'contains');
                  }}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {filteredSchema.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.key} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Select */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Operador</label>
                <select
                  value={newOp}
                  onChange={(e) => setNewOp(e.target.value as FilterOperator)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {applicableOperators.map((op) => (
                    <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                  ))}
                </select>
              </div>

              {/* Value input */}
              {newOp !== 'isNull' && newOp !== 'isNotNull' && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {newOp === 'between' ? 'Valor Mínimo' : 'Valor'}
                  </label>
                  {propSchema?.type === 'number' ? (
                    <input
                      type="number"
                      placeholder={propSchema.min !== undefined ? `Min: ${propSchema.min}` : 'Valor...'}
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  ) : propSchema?.type === 'boolean' ? (
                    <select
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="true">Verdadeiro (True)</option>
                      <option value="false">Falso (False)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Texto ou valor..."
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              )}
            </div>

            {/* If Between operator */}
            {newOp === 'between' && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  placeholder={propSchema?.max !== undefined ? `Max: ${propSchema.max}` : 'Valor Max...'}
                  value={newSecVal}
                  onChange={(e) => setNewSecVal(e.target.value)}
                  className="w-full sm:w-1/3 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Quick sample values click */}
            {propSchema && propSchema.sampleValues.length > 0 && newOp !== 'isNull' && newOp !== 'isNotNull' && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-500">
                <span>Sugestões:</span>
                {propSchema.sampleValues.slice(0, 5).map((sv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewVal(String(sv))}
                    className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
                  >
                    {String(sv)}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleAddFilter}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/40"
            >
              <Plus className="w-4 h-4" />
              Adicionar Filtro à Camada
            </button>
          </div>
          {/* Active Filters List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Filtros Ativos ({filters.length})
              </span>
              {filters.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Todos
                </button>
              )}
            </div>

            {filters.length === 0 ? (
              <div className="p-6 text-center bg-slate-50/40 rounded-xl border border-slate-200 text-xs text-slate-500">
                Nenhum filtro de atributo ativo. Todas as {layer.featureCount} feições estão sendo exibidas.
              </div>
            ) : (
              <div className="space-y-2">
                {filters.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      f.active
                        ? 'bg-slate-100/80 border-indigo-500/50 text-slate-800'
                        : 'bg-white/50 border-slate-200 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={f.active}
                        onChange={() => handleToggleFilter(f.id)}
                        className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 font-mono">{f.property}</span>{' '}
                        <span className="text-indigo-300">{OPERATOR_LABELS[f.operator]}</span>{' '}
                        {f.operator !== 'isNull' && f.operator !== 'isNotNull' && (
                          <strong className="text-amber-300 font-mono">
                            {String(f.value)}
                            {f.secondaryValue !== undefined ? ` e ${f.secondaryValue}` : ''}
                          </strong>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFilter(f.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Excluir filtro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Resultados Preview */}
            {filters.length > 0 && filteredList.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white/50">
                <div className="px-3 py-2 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Resultados ({filteredList.length})
                  </span>
                  <button 
                    onClick={() => setIsResultsExpanded(!isResultsExpanded)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
                  >
                    {isResultsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                
                <div className={`overflow-y-auto results-scrollbar transition-all duration-300 ease-in-out ${isResultsExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col gap-0.5 p-1">
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
                          onClick={() => {
                            if (onSelectFeature) onSelectFeature(f);
                          }}
                          className="w-full text-left px-2.5 py-2 bg-transparent hover:bg-slate-100 rounded-lg text-slate-800 transition-colors flex items-center gap-2 group"
                          title={`Clique para centralizar no mapa: ${title}`}
                        >
                          <div className="p-1.5 bg-slate-100 group-hover:bg-red-50/60 rounded-md border border-slate-300 group-hover:border-red-600/30 transition-colors shrink-0">
                            <Building className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="text-[11px] font-bold text-slate-800 truncate">{title}</span>
                              {badge}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[9px] text-slate-500">
                              {mun && (
                                <span className="flex items-center gap-0.5 max-w-[100px] truncate" title={String(mun)}>
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{mun}</span>
                                </span>
                              )}
                              {prop && (
                                <span className="flex items-center gap-0.5 max-w-[140px] truncate" title={String(prop)}>
                                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                                  <span className="truncate">{prop}</span>
                                </span>
                              )}
                              {uh !== null && (
                                <span className="flex items-center gap-0.5 font-medium text-slate-600 ml-auto bg-slate-100 px-1 rounded">
                                  {uh.toLocaleString('pt-BR')} UHs
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Resultado instantâneo: <strong>{layer.filteredCount}</strong> de <strong>{layer.featureCount}</strong> feições
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
