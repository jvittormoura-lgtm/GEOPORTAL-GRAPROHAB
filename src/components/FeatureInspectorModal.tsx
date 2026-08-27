import React, { useState, useEffect, useMemo } from 'react';
import { GisLayer, AppMode } from '../types/gis';
import { 
  calculateFeatureArea, 
  extractUhFromProperties, 
  extractAreaM2FromProperties,
  matchSmartSearch 
} from '../utils/geoJsonParser';
import { 
  X, Edit3, Save, Trash2, Plus, ArrowLeft, ArrowRight, 
  MapPin, Layers, Copy, Check, FileText, Settings, 
  Sliders, AlertCircle, RefreshCw, Eye, Tag, Lock, Home, Trees
} from 'lucide-react';

interface FeatureInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: GeoJSON.Feature | null;
  layer: GisLayer | null;
  featureIndex?: number;
  appMode?: AppMode;
  onRequireAuth?: (callback: () => void) => void;
  onUpdateFeatureProperties: (layerId: string, featureIndex: number, updatedProperties: Record<string, any>) => void;
  onRenameField?: (layerId: string, oldKey: string, newKey: string) => void;
  onDeleteField?: (layerId: string, fieldKey: string) => void;
  onAddField?: (layerId: string, fieldName: string, defaultValue: any, fieldType: 'string' | 'number') => void;
  onDeleteFeature?: (layerId: string, featureIndex: number) => void;
  onSelectFeatureIndex?: (newIndex: number) => void;
  onZoomToFeature?: (feature: GeoJSON.Feature) => void;
  onOpenGraprohabDetail?: (feature: GeoJSON.Feature) => void;
}

export const FeatureInspectorModal: React.FC<FeatureInspectorModalProps> = ({
  isOpen,
  onClose,
  feature,
  layer,
  featureIndex = 0,
  appMode = 'gestor',
  onRequireAuth,
  onUpdateFeatureProperties,
  onRenameField,
  onDeleteField,
  onAddField,
  onDeleteFeature,
  onSelectFeatureIndex,
  onZoomToFeature,
  onOpenGraprohabDetail
}) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [confirmPrompt, setConfirmPrompt] = useState<{msg: string, action: () => void} | null>(null);
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Field renaming sub-state
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState<string>('');

  // Add new field sub-state
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number'>('string');
  const [newFieldDefaultVal, setNewFieldDefaultVal] = useState<string>('');

  // Tab: 'attributes' | 'geometry'
  const [activeTab, setActiveTab] = useState<'attributes' | 'geometry'>('attributes');

  // Protect mutating actions
  const handleProtectedAction = (action: () => void) => {
    if (appMode === 'gestor') {
      action();
    } else if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  // Sync editedProperties whenever feature changes
  useEffect(() => {
    if (feature && feature.properties) {
      setEditedProperties({ ...feature.properties });
    } else {
      setEditedProperties({});
    }
    setRenamingKey(null);
    setIsAddingField(false);
    setSavedNotice(false);
    if (appMode !== 'gestor') {
      setIsEditMode(false);
    }
  }, [feature, featureIndex, appMode]);

  const totalFeatures = layer?.data.features.length || 0;
  const geomType = feature?.geometry?.type || 'Desconhecido';

  // Calculate geometric metric
  const areaMetric = useMemo(() => {
    if (!feature) return null;
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      const areaM2 = calculateFeatureArea(feature);
      if (areaM2 > 0) {
        return {
          ha: (areaM2 / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
          m2: areaM2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
        };
      }
    }
    return null;
  }, [feature, geomType]);

  const isGraprohab = useMemo(() => {
    const p = feature?.properties || {};
    return !!(p.processo_graprohab || p.nome_empreendimento);
  }, [feature]);

  const featureTitle = useMemo(() => {
    const p = feature?.properties || {};
    return p.nome_empreendimento || p.name || p.nome || p.NAME || p.title || p.cidade || p.municipio || `Feição #${(featureIndex ?? 0) + 1}`;
  }, [feature, featureIndex]);

  if (!isOpen || !feature) return null;

  const propertyKeys = Object.keys(editedProperties);

  const handlePropertyValueChange = (key: string, val: any) => {
    setEditedProperties(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSaveProperties = () => {
    if (!layer || featureIndex === undefined || featureIndex < 0) return;
    onUpdateFeatureProperties(layer.id, featureIndex, editedProperties);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleStartRename = (key: string) => {
    setRenamingKey(key);
    setNewKeyInput(key);
  };

  const handleConfirmRename = (oldKey: string) => {
    const trimmed = newKeyInput.trim();
    if (!trimmed || trimmed === oldKey || !layer) {
      setRenamingKey(null);
      return;
    }

    if (onRenameField) {
      onRenameField(layer.id, oldKey, trimmed);
    }

    // Update local state
    setEditedProperties(prev => {
      const next = { ...prev };
      next[trimmed] = next[oldKey];
      delete next[oldKey];
      return next;
    });

    setRenamingKey(null);
  };

  const handleDeleteFieldLocal = (key: string) => {
    if (!layer) return;
    setConfirmPrompt({
      msg: `Deseja realmente excluir o campo "${key}" desta camada e de todas as suas feições?`,
      action: () => {
        if (onDeleteField) {
          onDeleteField(layer.id, key);
        }
        setEditedProperties(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });
  };

  const handleConfirmAddField = () => {
    const trimmed = newFieldName.trim().replace(/\s+/g, '_');
    if (!trimmed || !layer) return;

    const val = newFieldType === 'number' 
      ? (newFieldDefaultVal ? Number(newFieldDefaultVal) : 0) 
      : (newFieldDefaultVal || '');

    if (onAddField) {
      onAddField(layer.id, trimmed, val, newFieldType);
    }

    setEditedProperties(prev => ({
      ...prev,
      [trimmed]: val
    }));

    setNewFieldName('');
    setNewFieldDefaultVal('');
    setIsAddingField(false);
  };

  const handleDeleteThisFeature = () => {
    if (!layer || featureIndex === undefined || featureIndex < 0) return;
    setConfirmPrompt({
      msg: `Tem certeza que deseja excluir esta feição (${featureTitle}) permanentemente?`,
      action: () => {
        if (onDeleteFeature) {
          onDeleteFeature(layer.id, featureIndex);
        }
        onClose();
      }
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(feature, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id="feature-inspector-popup"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-300/80 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-red-600/15 border border-red-600/30 rounded-xl text-red-600 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider truncate max-w-[200px]">
                  {layer?.name || 'Camada'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  {geomType}
                </span>
                {totalFeatures > 0 && (
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Feição {featureIndex + 1} de {totalFeatures}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {featureTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Feature Stepper */}
            {totalFeatures > 1 && onSelectFeatureIndex && (
              <div className="flex items-center bg-slate-100/90 border border-slate-300 rounded-lg p-0.5 mr-1">
                <button
                  onClick={() => onSelectFeatureIndex(Math.max(0, featureIndex - 1))}
                  disabled={featureIndex <= 0}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 rounded transition-colors"
                  title="Feição anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-semibold text-slate-700 px-1.5 min-w-[40px] text-center">
                  {featureIndex + 1}/{totalFeatures}
                </span>
                <button
                  onClick={() => onSelectFeatureIndex(Math.min(totalFeatures - 1, featureIndex + 1))}
                  disabled={featureIndex >= totalFeatures - 1}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 rounded transition-colors"
                  title="Próxima feição"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Fechar Pop-up"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Metric Strip */}
        <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Lotes / UH metric */}
            {(() => {
              const uhVal = extractUhFromProperties(editedProperties);
              if (uhVal > 0) {
                return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/10 border border-red-600/20 rounded-md text-red-500 font-mono font-bold">
                    <Home className="w-3.5 h-3.5 text-red-600" />
                    <span>{uhVal.toLocaleString('pt-BR')} UH / Lotes</span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Gleba Area Metric */}
            {(() => {
              const areaM2 = extractAreaM2FromProperties(editedProperties, feature);
              if (areaM2 > 0) {
                const ha = (areaM2 / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
                return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-700 font-mono">
                    <Trees className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">{ha} ha</span>
                    <span className="text-slate-500 text-[10px]">({areaM2.toLocaleString('pt-BR')} m²)</span>
                  </div>
                );
              }
              return null;
            })()}

            {savedNotice && (
              <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Salvo com sucesso!
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {onZoomToFeature && (
              <button
                onClick={() => onZoomToFeature(feature)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Centralizar e aproximar nesta feição"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Zoom</span>
              </button>
            )}

            {isGraprohab && onOpenGraprohabDetail && (
              <button
                onClick={() => onOpenGraprohabDetail(feature)}
                className="px-2.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                title="Ver Ficha Técnica Habitacional do Processo"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha Técnica</span>
              </button>
            )}

            {/* Mode Switcher: View vs Edit */}
            <button
              onClick={() => {
                if (!isEditMode) {
                  handleProtectedAction(() => setIsEditMode(true));
                } else {
                  setIsEditMode(false);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                isEditMode 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900'
              }`}
              title={appMode === 'gestor' ? "Alternar edição" : "Requer senha de gestor para editar"}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Modo Leitura</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Campos & Valores</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Mode Notice */}
          {isEditMode && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Você está no <strong>Modo de Edição</strong>. Altere os valores, renomeie colunas ou adicione novos campos e clique em <strong>Salvar Alterações</strong>.
                </span>
              </div>
              <button
                onClick={handleSaveProperties}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            </div>
          )}

          {/* Add Field Panel in Edit Mode */}
          {isEditMode && (
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-red-600" />
                  Adicionar Novo Campo na Camada
                </span>
                {!isAddingField && (
                  <button
                    onClick={() => setIsAddingField(true)}
                    className="px-2.5 py-1 bg-red-600/15 hover:bg-red-600/25 text-red-500 hover:text-sky-200 border border-red-600/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Campo</span>
                  </button>
                )}
              </div>

              {isAddingField && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Nome do Campo</label>
                    <input
                      type="text"
                      placeholder="ex: observacao_licenciamento"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Tipo</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                    >
                      <option value="string">Texto (String)</option>
                      <option value="number">Numérico (Number)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Valor Inicial</label>
                    <div className="flex gap-1.5">
                      <input
                        type={newFieldType === 'number' ? 'number' : 'text'}
                        placeholder="Valor padrão"
                        value={newFieldDefaultVal}
                        onChange={(e) => setNewFieldDefaultVal(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600"
                      />
                      <button
                        onClick={handleConfirmAddField}
                        disabled={!newFieldName.trim()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsAddingField(false)}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg text-xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attributes List / Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Atributos da Feição ({propertyKeys.length} {propertyKeys.length === 1 ? 'campo' : 'campos'})
              </span>
              <button
                onClick={handleCopyJson}
                className="text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>

            {propertyKeys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhum atributo cadastrado nesta feição.
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60">
                {propertyKeys.map((key) => {
                  const val = editedProperties[key];
                  const isRenamingThis = renamingKey === key;

                  return (
                    <div 
                      key={key} 
                      className={`p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/30 transition-colors ${
                        isRenamingThis ? 'bg-red-50/30 border-l-2 border-red-600' : ''
                      }`}
                    >
                      {/* Field Key Label / Rename Input */}
                      <div className="sm:w-2/5 flex items-center gap-2">
                        {isRenamingThis ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={newKeyInput}
                              onChange={(e) => setNewKeyInput(e.target.value)}
                              autoFocus
                              className="flex-1 px-2 py-1 bg-white border border-red-600 rounded text-xs text-slate-900 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => handleConfirmRename(key)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                              title="Salvar novo nome do campo"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setRenamingKey(null)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded"
                              title="Cancelar renomeação"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full pr-2">
                            <span 
                              className="font-mono text-xs font-semibold text-slate-700 break-all select-all"
                              title={key}
                            >
                              {key}
                            </span>
                            {isEditMode && (
                              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 shrink-0 ml-1">
                                <button
                                  onClick={() => handleStartRename(key)}
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                                  title="Renomear este campo"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFieldLocal(key)}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-100 rounded transition-colors"
                                  title="Excluir este campo da camada"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Field Value: View or Edit Input */}
                      <div className="sm:w-3/5">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={val !== null && val !== undefined ? String(val) : ''}
                            onChange={(e) => handlePropertyValueChange(key, e.target.value)}
                            placeholder="vazio (null)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-400 transition-colors font-sans"
                          />
                        ) : (
                          <div className="text-xs text-slate-800 break-words font-sans bg-white/60 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                            {val !== null && val !== undefined ? (
                              typeof val === 'object' ? JSON.stringify(val) : String(val)
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">null / vazio</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {isEditMode ? (
              <button
                onClick={handleDeleteThisFeature}
                className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Feição</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-mono">
                GeoJSON {geomType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => {
                    if (feature?.properties) {
                      setEditedProperties({ ...feature.properties });
                    }
                    setIsEditMode(false);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleSaveProperties();
                    setIsEditMode(false);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar e Fechar</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
      {confirmPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm rounded-2xl">
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