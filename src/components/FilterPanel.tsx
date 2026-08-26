import React, { useState } from 'react';
import { GisLayer, AttributeFilter, FilterOperator, SpatialFilter } from '../types/gis';
import { Filter, Plus, Trash2, CheckCircle2, SlidersHorizontal, Map, X, Sparkles } from 'lucide-react';

interface FilterPanelProps {
  layer: GisLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFilters: (layerId: string, filters: AttributeFilter[], spatialFilter?: SpatialFilter) => void;
  onOpenAiAssistant?: () => void;
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
  onOpenAiAssistant
}) => {
  const [filters, setFilters] = useState<AttributeFilter[]>([]);
  const [spatialEnabled, setSpatialEnabled] = useState<boolean>(false);
  const [spatialType, setSpatialType] = useState<'bbox' | 'radius'>('bbox');
  const [radiusKm, setRadiusKm] = useState<number>(500);

  // New filter creation state
  const [newProp, setNewProp] = useState<string>('');
  const [newOp, setNewOp] = useState<FilterOperator>('contains');
  const [newVal, setNewVal] = useState<string>('');
  const [newSecVal, setNewSecVal] = useState<string>('');

  // Sync state when layer or isOpen changes
  React.useEffect(() => {
    if (layer && isOpen) {
      setFilters([...layer.filters]);
      setSpatialEnabled(!!layer.spatialFilter?.enabled);
      setSpatialType(layer.spatialFilter?.type === 'radius' ? 'radius' : 'bbox');
      setRadiusKm(layer.spatialFilter?.radiusKm || 500);
      const initialProp = layer.propertiesSchema[0]?.key || '';
      setNewProp(initialProp);
      const schema = layer.propertiesSchema.find(p => p.key === initialProp);
      setNewOp(schema?.type === 'number' ? '>' : 'contains');
      setNewVal('');
      setNewSecVal('');
    }
  }, [layer, isOpen]);

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
    saveChanges(updated, spatialEnabled, spatialType, radiusKm);
  };

  const handleRemoveFilter = (id: string) => {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    saveChanges(updated, spatialEnabled, spatialType, radiusKm);
  };

  const handleToggleFilter = (id: string) => {
    const updated = filters.map(f => f.id === id ? { ...f, active: !f.active } : f);
    setFilters(updated);
    saveChanges(updated, spatialEnabled, spatialType, radiusKm);
  };

  const handleClearAll = () => {
    setFilters([]);
    setSpatialEnabled(false);
    saveChanges([], false, spatialType, radiusKm);
  };

  const saveChanges = (
    currentFilters: AttributeFilter[],
    isSpatial: boolean,
    sType: 'bbox' | 'radius',
    rad: number
  ) => {
    let spatial: SpatialFilter | undefined = undefined;
    if (isSpatial) {
      spatial = {
        enabled: true,
        type: sType,
        bbox: layer.bbox,
        center: [(layer.bbox[0] + layer.bbox[2]) / 2, (layer.bbox[1] + layer.bbox[3]) / 2],
        radiusKm: rad
      };
    }
    onUpdateFilters(layer.id, currentFilters, spatial);
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
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Filtragem Avançada de Atributos</h2>
              <p className="text-xs text-slate-400">
                Camada: <strong className="text-white">{layer.name}</strong> • Feições ativas:{' '}
                <span className="text-emerald-400 font-mono font-semibold">{layer.filteredCount}</span> de{' '}
                <span className="font-mono text-slate-300">{layer.featureCount}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAiAssistant && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAiAssistant();
                }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pedir à IA</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Filter Box */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Criar Nova Regra de Filtro
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Field Select */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Campo</label>
                <select
                  value={newProp}
                  onChange={(e) => {
                    setNewProp(e.target.value);
                    const sc = layer.propertiesSchema.find(p => p.key === e.target.value);
                    setNewOp(sc?.type === 'number' ? '>' : 'contains');
                  }}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {layer.propertiesSchema.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.key} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Select */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Operador</label>
                <select
                  value={newOp}
                  onChange={(e) => setNewOp(e.target.value as FilterOperator)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {applicableOperators.map((op) => (
                    <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                  ))}
                </select>
              </div>

              {/* Value input */}
              {newOp !== 'isNull' && newOp !== 'isNotNull' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {newOp === 'between' ? 'Valor Mínimo' : 'Valor'}
                  </label>
                  {propSchema?.type === 'number' ? (
                    <input
                      type="number"
                      placeholder={propSchema.min !== undefined ? `Min: ${propSchema.min}` : 'Valor...'}
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  ) : propSchema?.type === 'boolean' ? (
                    <select
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              )}
            </div>

            {/* If Between operator */}
            {newOp === 'between' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  placeholder={propSchema?.max !== undefined ? `Max: ${propSchema.max}` : 'Valor Max...'}
                  value={newSecVal}
                  onChange={(e) => setNewSecVal(e.target.value)}
                  className="w-full sm:w-1/3 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Quick sample values click */}
            {propSchema && propSchema.sampleValues.length > 0 && newOp !== 'isNull' && newOp !== 'isNotNull' && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
                <span>Sugestões:</span>
                {propSchema.sampleValues.slice(0, 5).map((sv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewVal(String(sv))}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
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

          {/* Spatial Filter Options */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Filtro Espacial Geográfico
                </span>
              </div>
              <input
                type="checkbox"
                checked={spatialEnabled}
                onChange={(e) => {
                  setSpatialEnabled(e.target.checked);
                  saveChanges(filters, e.target.checked, spatialType, radiusKm);
                }}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
            </div>

            {spatialEnabled && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="spatialType"
                      checked={spatialType === 'bbox'}
                      onChange={() => {
                        setSpatialType('bbox');
                        saveChanges(filters, true, 'bbox', radiusKm);
                      }}
                      className="text-emerald-500"
                    />
                    <span>Limitar pela extensão da tela / Bounding Box</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="spatialType"
                      checked={spatialType === 'radius'}
                      onChange={() => {
                        setSpatialType('radius');
                        saveChanges(filters, true, 'radius', radiusKm);
                      }}
                      className="text-emerald-500"
                    />
                    <span>Raio de Proximidade (Buffer)</span>
                  </label>
                </div>

                {spatialType === 'radius' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Raio de busca:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{radiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="3000"
                      step="10"
                      value={radiusKm}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRadiusKm(val);
                        saveChanges(filters, true, 'radius', val);
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Filters List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Filtros Ativos ({filters.length})
              </span>
              {filters.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Todos
                </button>
              )}
            </div>

            {filters.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                Nenhum filtro de atributo ativo. Todas as {layer.featureCount} feições estão sendo exibidas.
              </div>
            ) : (
              <div className="space-y-2">
                {filters.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      f.active
                        ? 'bg-slate-800/80 border-indigo-500/50 text-slate-200'
                        : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={f.active}
                        onChange={() => handleToggleFilter(f.id)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-white font-mono">{f.property}</span>{' '}
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
                      className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Excluir filtro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Resultado instantâneo: <strong>{layer.filteredCount}</strong> de <strong>{layer.featureCount}</strong> feições
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
