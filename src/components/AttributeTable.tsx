import React, { useState, useMemo } from 'react';
import { GisLayer, AppMode } from '../types/gis';
import { filterFeatures, matchSmartSearch } from '../utils/geoJsonParser';
import { 
  Table, Search, ArrowUpDown, MapPin, Maximize2, Minimize2, X, 
  Download, Columns, Edit2, Trash2, Check, Plus, MoreVertical,
  SlidersHorizontal, ChevronDown, RefreshCw, Lock, ArrowLeft, ArrowRight
} from 'lucide-react';

interface AttributeTableProps {
  layer: GisLayer | null;
  isOpen: boolean;
  appMode?: AppMode;
  onRequireAuth?: (callback: () => void) => void;
  onClose: () => void;
  onSelectFeature: (feature: GeoJSON.Feature, zoomTo: boolean) => void;
  onOpenExportModal: () => void;
  onOpenFieldManager: () => void;
  onRenameField: (layerId: string, oldKey: string, newKey: string) => void;
  onDeleteField: (layerId: string, fieldKey: string) => void;
  onUpdateCellValue?: (layerId: string, featureIndex: number, fieldKey: string, value: any) => void;
  onDeleteFeature?: (layerId: string, featureIndex: number) => void;
  onOpenFeatureInspector?: (feature: GeoJSON.Feature, layerId: string, featureIndex: number) => void;
  onReorderFields?: (layerId: string, newOrder: string[]) => void;
}

export const AttributeTable: React.FC<AttributeTableProps> = ({
  layer,
  isOpen,
  appMode = 'gestor',
  onRequireAuth,
  onClose,
  onSelectFeature,
  onOpenExportModal,
  onOpenFieldManager,
  onRenameField,
  onDeleteField,
  onUpdateCellValue,
  onDeleteFeature,
  onOpenFeatureInspector,
  onReorderFields
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number | null>(null);
  const [showOnlyFiltered, setShowOnlyFiltered] = useState<boolean>(true);

  // Column quick-actions popup
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null);
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>('');

  // Editable cell state
  const [editingCell, setEditingCell] = useState<{ featureIdx: number; colKey: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  const [confirmPrompt, setConfirmPrompt] = useState<{msg: string, action: () => void} | null>(null);

  const isGestor = appMode === 'gestor';

  // Protect mutating actions
  const handleProtectedAction = (action: () => void) => {
    if (isGestor) {
      action();
    } else if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  const handleMoveColumn = (col: string, direction: 'left' | 'right', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleProtectedAction(() => {
      if (!layer || !onReorderFields) return;
      const keys = layer.propertiesSchema.map(p => p.key);
      const currentIndex = keys.indexOf(col);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= keys.length) return;

      const temp = keys[currentIndex];
      keys[currentIndex] = keys[targetIndex];
      keys[targetIndex] = temp;

      onReorderFields(layer.id, keys);
      setActiveColumnMenu(null);
    });
  };

  // Columns from properties schema
  const columns = useMemo(() => {
    if (!layer) return [];
    return layer.propertiesSchema.map(p => p.key);
  }, [layer?.propertiesSchema]);

  // Features list
  const displayFeatures = useMemo(() => {
    if (!layer) return [];
    let list = showOnlyFiltered 
      ? filterFeatures(layer.data.features, layer.filters)
      : layer.data.features;

    if (searchTerm.trim()) {
      list = list.filter(f => {
        const props = f.properties || {};
        return Object.values(props).some(v => matchSmartSearch(v, searchTerm));
      });
    }

    if (sortColumn) {
      list = [...list].sort((a, b) => {
        const valA = a.properties ? a.properties[sortColumn] : '';
        const valB = b.properties ? b.properties[sortColumn] : '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  }, [layer?.data.features, layer?.filters, layer?.spatialFilter, showOnlyFiltered, searchTerm, sortColumn, sortDirection]);

  if (!isOpen || !layer) return null;

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleStartRenameColumn = (col: string) => {
    handleProtectedAction(() => {
      setRenamingColumn(col);
      setNewColumnName(col);
      setActiveColumnMenu(null);
    });
  };

  const handleSaveRenameColumn = (oldCol: string) => {
    const trimmed = newColumnName.trim();
    if (trimmed && trimmed !== oldCol) {
      onRenameField(layer.id, oldCol, trimmed);
    }
    setRenamingColumn(null);
    setNewColumnName('');
  };

  const handleDeleteColumnConfirm = (col: string) => {
    handleProtectedAction(() => {
      setConfirmPrompt({
        msg: `Tem certeza que deseja excluir a coluna "${col}" de todas as feições desta camada GeoJSON?`,
        action: () => {
          onDeleteField(layer.id, col);
        }
      });
      setActiveColumnMenu(null);
    });
  };

  const handleStartEditCell = (featureIdx: number, colKey: string, currentVal: any) => {
    if (!onUpdateCellValue) return;
    handleProtectedAction(() => {
      setEditingCell({ featureIdx, colKey });
      setCellEditValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
    });
  };

  const handleSaveEditCell = () => {
    if (!editingCell || !onUpdateCellValue) return;
    onUpdateCellValue(layer.id, editingCell.featureIdx, editingCell.colKey, cellEditValue);
    setEditingCell(null);
  };

  return (
    <div 
      id="attribute-table-panel"
      className={`fixed z-40 bg-white border-t border-slate-300 shadow-2xl transition-all duration-300 flex flex-col ${
        isExpanded 
          ? 'inset-x-0 bottom-0 top-16' 
          : 'inset-x-0 bottom-0 h-80 sm:h-96'
      }`}
    >
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-red-600 font-semibold text-xs sm:text-sm">
            <Table className="w-4 h-4" />
            <span>Tabela de Atributos: {layer.name}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono">
            {displayFeatures.length} / {layer.featureCount} feições ({columns.length} campos)
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar em todos os campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600 w-44 sm:w-60"
            />
          </div>

          <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyFiltered}
              onChange={(e) => setShowOnlyFiltered(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-red-700 bg-white border-slate-300"
            />
            <span>Apenas filtradas</span>
          </label>

          {/* Manage Fields Button */}
          <button
            onClick={onOpenFieldManager}
            className="px-2.5 py-1 bg-red-700/20 hover:bg-red-700/30 text-red-500 border border-red-600/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Gerenciar / Editar / Excluir Nomes de Campos"
          >
            <Columns className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Gerenciar Campos</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            title="Exportar esta camada"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Recolher Tabela' : 'Expandir Tabela'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100 transition-colors"
            title="Fechar Tabela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-xs">
            <tr>
              <th className="px-3 py-2 text-slate-500 font-semibold uppercase text-[10px] w-12 text-center">
                #
              </th>
              <th className="px-3 py-2 text-slate-500 font-semibold uppercase text-[10px] w-24">
                Ação
              </th>
              <th className="px-3 py-2 text-slate-500 font-semibold uppercase text-[10px]">
                Geometria
              </th>

              {columns.map((col, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === columns.length - 1;

                return (
                <th
                  key={col}
                  className="px-3 py-2 text-slate-700 font-semibold text-[11px] hover:bg-white/90 transition-colors select-none whitespace-nowrap relative group"
                >
                  {renamingColumn === col ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRenameColumn(col);
                          if (e.key === 'Escape') setRenamingColumn(null);
                        }}
                        className="px-2 py-0.5 bg-white border border-red-600 rounded text-xs text-slate-900 font-mono focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRenameColumn(col)}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        title="Salvar nome do campo"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingColumn(null)}
                        className="p-1 bg-slate-100 text-slate-500 rounded hover:text-slate-900"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer font-mono"
                        onClick={() => handleSort(col)}
                        title="Clique para ordenar"
                      >
                        <span>{col}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>

                      {/* Header Column Actions */}
                      <div className="flex items-center gap-1">
                        {/* Quick reorder buttons visible on hover in Gestor mode */}
                        {isGestor && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-50/80 px-1 py-0.5 rounded border border-slate-200">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={(e) => handleMoveColumn(col, 'left', e)}
                              className="p-0.5 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 rounded transition-colors"
                              title="Mover coluna para a esquerda"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={(e) => handleMoveColumn(col, 'right', e)}
                              className="p-0.5 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 rounded transition-colors"
                              title="Mover coluna para a direita"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Dropdown Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveColumnMenu(activeColumnMenu === col ? null : col);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Opções da Coluna (Reordenar / Renomear / Excluir)"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>

                          {/* Column Menu Popup */}
                          {activeColumnMenu === col && (
                            <div 
                              className="absolute right-0 top-full mt-1 w-48 bg-slate-50 border border-slate-300 rounded-xl shadow-2xl py-1 z-30 font-sans"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={(e) => handleMoveColumn(col, 'left', e)}
                                className="w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                                <span>Mover para Esquerda</span>
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={(e) => handleMoveColumn(col, 'right', e)}
                                className="w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                <span>Mover para Direita</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartRenameColumn(col)}
                                className="w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 flex items-center gap-2 border-t border-slate-200/80"
                              >
                                <Edit2 className="w-3 h-3 text-red-600" />
                                <span>Renomear Campo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteColumnConfirm(col)}
                                className="w-full px-3 py-1.5 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-200/80"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Excluir Campo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </th>
              );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
            {displayFeatures.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="text-center py-12 text-slate-500">
                  Nenhum registro encontrado correspondente aos filtros ou busca.
                </td>
              </tr>
            ) : (
              displayFeatures.map((feature, idx) => {
                const isSelected = selectedFeatureIdx === idx;
                const geom = feature.geometry;
                const props = feature.properties || {};

                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      setSelectedFeatureIdx(idx);
                      onSelectFeature(feature, false);
                    }}
                    className={`hover:bg-slate-100/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/60 text-sky-200' : 'text-slate-700'
                    }`}
                  >
                    <td className="px-3 py-1.5 text-center text-slate-500">
                      {idx + 1}
                    </td>

                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFeatureIdx(idx);
                            onSelectFeature(feature, true);
                          }}
                          className="px-2 py-0.5 bg-red-700/30 hover:bg-red-700 text-sky-200 hover:text-white rounded text-[10px] font-sans flex items-center gap-1 transition-all"
                          title="Centralizar no mapa e abrir popup"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Ver no Mapa</span>
                        </button>

                        {onOpenFeatureInspector && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenFeatureInspector(feature, layer.id, idx);
                            }}
                            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded text-[10px] font-sans font-semibold flex items-center gap-1 transition-all"
                            title="Abrir e editar todos os campos desta feição"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        )}

                        {onDeleteFeature && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const realIdx = layer.data.features.indexOf(feature);
                              setConfirmPrompt({
                                msg: 'Excluir esta feição da camada permanentemente?',
                                action: () => {
                                  onDeleteFeature(layer.id, realIdx);
                                }
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Excluir feição"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                        {geom ? geom.type : 'Sem geom'}
                      </span>
                    </td>

                    {columns.map(col => {
                      const val = props[col];
                      const isEditingThisCell = editingCell?.featureIdx === idx && editingCell?.colKey === col;

                      return (
                        <td 
                          key={col} 
                          className="px-3 py-1.5 truncate max-w-xs font-sans text-xs group/cell"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartEditCell(idx, col, val);
                          }}
                        >
                          {isEditingThisCell ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={cellEditValue}
                                onChange={(e) => setCellEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditCell();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="px-2 py-0.5 bg-slate-50 border border-emerald-500 rounded text-xs text-slate-900 focus:outline-none w-full"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveEditCell}
                                className="p-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCell(null)}
                                className="p-0.5 bg-slate-100 text-slate-500 rounded hover:text-slate-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">
                                {val !== null && val !== undefined ? String(val) : <span className="text-slate-600 italic">null</span>}
                              </span>
                              {onUpdateCellValue && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditCell(idx, col, val);
                                  }}
                                  className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-slate-500 hover:text-red-500 rounded transition-opacity"
                                  title="Editar valor"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {confirmPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm rounded-t-3xl">
          <div className="bg-white border border-rose-500/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-700 mb-2">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-700 mb-6">{confirmPrompt.msg}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmPrompt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmPrompt.action();
                  setConfirmPrompt(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};