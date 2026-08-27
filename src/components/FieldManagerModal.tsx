import React, { useState, useMemo } from 'react';
import { GisLayer, PropertySchema, AppMode } from '../types/gis';
import { 
  X, Columns, Edit2, Trash2, Plus, Check, AlertTriangle, 
  HelpCircle, Type, Hash, Calendar, ToggleLeft, Layers,
  MoveVertical, ShieldCheck, Lock,
  Eye, EyeOff, Star, Sparkles, MessageSquare, RotateCcw, GripVertical
} from 'lucide-react';

interface FieldManagerModalProps {
  layer: GisLayer | null;
  isOpen: boolean;
  appMode?: AppMode;
  onRequireAuth?: (callback: () => void) => void;
  onClose: () => void;
  onRenameField: (layerId: string, oldKey: string, newKey: string) => void;
  onDeleteField: (layerId: string, fieldKey: string) => void;
  onAddField: (layerId: string, fieldName: string, defaultValue: any, fieldType: 'string' | 'number') => void;
  onReorderFields?: (layerId: string, newOrder: string[]) => void;
  onUpdatePopupSettings?: (
    layerId: string, 
    popupVisibleFields?: string[], 
    popupTitleField?: string
  ) => void;
}

export const FieldManagerModal: React.FC<FieldManagerModalProps> = ({
  layer,
  isOpen,
  appMode = 'gestor',
  onRequireAuth,
  onClose,
  onRenameField,
  onDeleteField,
  onAddField,
  onReorderFields,
  onUpdatePopupSettings
}) => {
  
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editedFieldName, setEditedFieldName] = useState<string>('');
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  
  // New field form
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number'>('string');
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Popup settings state
  const currentVisibleFields = useMemo<string[]>(() => {
    if (layer?.popupVisibleFields && Array.isArray(layer.popupVisibleFields)) {
      return layer.popupVisibleFields;
    }
    return layer?.propertiesSchema.map(p => p.key) || [];
  }, [layer?.popupVisibleFields, layer?.propertiesSchema]);

  const currentTitleField = useMemo<string>(() => {
    if (layer?.popupTitleField) return layer.popupTitleField;
    const candidates = ['nome_empreendimento', 'nome', 'Nome', 'NOME', 'titulo', 'name', 'processo_graprohab', 'processo'];
    for (const c of candidates) {
      if (layer?.propertiesSchema.some(p => p.key === c)) return c;
    }
    return layer?.propertiesSchema[0]?.key || '';
  }, [layer?.popupTitleField, layer?.propertiesSchema]);

  if (!isOpen || !layer) return null;

  const isGestor = appMode === 'gestor';

  const handleProtected = (action: () => void) => {
    if (isGestor) {
      action();
    } else if (onRequireAuth) {
      onRequireAuth(action);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    if (!isGestor) {
      e.preventDefault();
      if (onRequireAuth) onRequireAuth(() => {});
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    handleProtected(() => {
      if (!onReorderFields) return;
      const keys = layer.propertiesSchema.map(p => p.key);
      const [movedItem] = keys.splice(draggedIndex, 1);
      keys.splice(targetIndex, 0, movedItem);

      onReorderFields(layer.id, keys);
      setDraggedIndex(null);
    });
  };

  const handleTogglePopupVisibility = (fieldKey: string) => {
    handleProtected(() => {
      if (!onUpdatePopupSettings) return;
      const isVisible = currentVisibleFields.includes(fieldKey);
      const newVisible = isVisible 
        ? currentVisibleFields.filter(k => k !== fieldKey)
        : [...currentVisibleFields, fieldKey];
      
      onUpdatePopupSettings(layer.id, newVisible, currentTitleField);
    });
  };

  const handleSetTitleField = (fieldKey: string) => {
    handleProtected(() => {
      if (!onUpdatePopupSettings) return;
      const newTitle = currentTitleField === fieldKey ? '' : fieldKey;
      onUpdatePopupSettings(layer.id, currentVisibleFields, newTitle);
    });
  };

  const handleStartRename = (field: PropertySchema) => {
    handleProtected(() => {
      setEditingFieldKey(field.key);
      setEditedFieldName(field.key);
      setErrorMsg(null);
    });
  };

  const handleSaveRename = (oldKey: string) => {
    const trimmed = editedFieldName.trim();
    if (!trimmed) {
      setErrorMsg('O nome do campo não pode ficar vazio.');
      return;
    }
    if (trimmed !== oldKey && layer.propertiesSchema.some(p => p.key === trimmed)) {
      setErrorMsg(`O campo "${trimmed}" já existe nesta camada.`);
      return;
    }

    onRenameField(layer.id, oldKey, trimmed);
    setEditingFieldKey(null);
    setEditedFieldName('');
    setErrorMsg(null);
  };

  const handleConfirmDelete = (fieldKey: string) => {
    handleProtected(() => {
      onDeleteField(layer.id, fieldKey);
      setFieldToDelete(null);
      setErrorMsg(null);
    });
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    handleProtected(() => {
      const trimmed = newFieldName.trim();
      if (!trimmed) {
        setErrorMsg('Informe o nome do novo campo.');
        return;
      }
      if (layer.propertiesSchema.some(p => p.key === trimmed)) {
        setErrorMsg(`O campo "${trimmed}" já existe.`);
        return;
      }

      let val: any = newFieldDefaultValue;
      if (newFieldType === 'number') {
        val = newFieldDefaultValue === '' ? 0 : Number(newFieldDefaultValue);
        if (isNaN(val)) val = 0;
      }

      onAddField(layer.id, trimmed, val, newFieldType);
      setNewFieldName('');
      setNewFieldDefaultValue('');
      setIsAddingField(false);
      setErrorMsg(null);
    });
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-amber-400" />;
      case 'boolean':
        return <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-red-600" />;
    }
  };

  // Sample feature for live preview
  const sampleFeature = layer.data?.features?.[0];
  const sampleProps = sampleFeature?.properties || {};

  return (
    <div 
      id="field-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/10 border border-red-600/30 rounded-xl text-red-600">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Campos da Camada: Ordem na Tabela & Pop-up
                {isGestor ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Gestor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Requer Senha de Gestor
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Camada: <span className="text-red-500 font-semibold">{layer.name}</span> ({layer.propertiesSchema.length} campos) • Arraste (⠿) para alterar a ordem no Pop-up e na Tabela
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-700 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-white/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Configuração de Atributos e Pop-up em Tempo Real</span>
          </div>

          <button
            onClick={() => {
              handleProtected(() => {
                setIsAddingField(!isAddingField);
                setErrorMsg(null);
              });
            }}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-200/40 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Novo Campo</span>
          </button>
        </div>

        {/* Add New Field Form */}
        {isAddingField && (
          <form 
            onSubmit={handleCreateField}
            className="mx-6 my-3 p-4 bg-slate-50/80 border border-red-600/40 rounded-xl space-y-3 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar Novo Campo na Camada
              </span>
              <button 
                type="button" 
                onClick={() => setIsAddingField(false)}
                className="text-slate-500 hover:text-slate-800 text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Nome do Campo:</label>
                <input
                  type="text"
                  placeholder="Ex: status_vistoria"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Tipo de Dado:</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                >
                  <option value="string">Texto (String)</option>
                  <option value="number">Número (Integer/Float)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Valor Padrão (Opcional):</label>
                <input
                  type={newFieldType === 'number' ? 'number' : 'text'}
                  placeholder={newFieldType === 'number' ? '0' : 'Vazio'}
                  value={newFieldDefaultValue}
                  onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Adicionar Campo a Todas as Feições</span>
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Warning */}
        {fieldToDelete && (
          <div className="mx-6 my-3 p-4 bg-rose-950/60 border border-rose-200 rounded-xl space-y-3 shrink-0">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  Confirmar Exclusão do Campo "{fieldToDelete}"?
                </h4>
                <p className="text-xs text-rose-700/80 mt-1">
                  Este atributo será permanentemente removido de todas as {layer.featureCount} feições desta camada GeoJSON. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFieldToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(fieldToDelete)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Campo</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace (Grid layout) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Side: Field List & Drag-and-drop */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/40 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 bg-white/40 shrink-0">
              <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Columns className="w-4 h-4 text-red-600" />
                Ordem dos Campos
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {layer.propertiesSchema.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhum campo de atributo encontrado nesta camada GeoJSON.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5 w-24 text-center">Arraste / Ordem</th>
                        <th className="px-4 py-2.5">Nome do Campo</th>
                        <th className="px-3 py-2.5 w-28 text-center">No Pop-up</th>
                        <th className="px-4 py-2.5 w-24 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 font-sans">
                      {layer.propertiesSchema.map((field, idx) => {
                        const isEditing = editingFieldKey === field.key;
                        const isVisibleInPopup = currentVisibleFields.includes(field.key);
                        const isTitleInPopup = currentTitleField === field.key;
                        const isBeingDragged = draggedIndex === idx;

                        return (
                          <tr 
                            key={field.key} 
                            draggable={isGestor}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={() => setDraggedIndex(null)}
                            className={`hover:bg-slate-100/60 transition-all ${
                              isBeingDragged ? 'opacity-40 bg-red-50/60 border-y-2 border-red-600 scale-[0.99]' : ''
                            } ${
                              isEditing ? 'bg-red-50/40' : ''
                            }`}
                          >
                            {/* Drag Handle & Order Position */}
                            <td className="px-3 py-2 text-center text-slate-500 font-mono text-xs">
                              <div className="flex items-center justify-center gap-2">
                                <div 
                                  className={`p-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-amber-400 rounded transition-colors ${isGestor ? '' : 'opacity-40 cursor-not-allowed'}`}
                                  title={isGestor ? "Clique e arraste para reordenar" : "Requer autenticação de gestor"}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-amber-400 w-4 text-xs">{idx + 1}</span>
                              </div>
                            </td>
                            
                            <td className="px-4 py-2.5">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editedFieldName}
                                    onChange={(e) => setEditedFieldName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(field.key);
                                      if (e.key === 'Escape') setEditingFieldKey(null);
                                    }}
                                    className="px-2.5 py-1 bg-white border border-red-600 rounded-lg text-xs text-slate-900 font-mono focus:outline-none w-32"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(field.key)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md"
                                    title="Salvar novo nome"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldKey(null)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold font-mono text-xs truncate max-w-[120px] ${isTitleInPopup ? 'text-red-500' : 'text-slate-800'}`}>
                                    {field.key}
                                  </span>
                                  {isTitleInPopup && (
                                    <span className="px-1.5 py-0.5 bg-red-600/20 text-red-500 text-[9px] font-bold rounded shrink-0">
                                      Título
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Pop-up Controls: Eye Visibility + Star Title */}
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePopupVisibility(field.key)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isVisibleInPopup 
                                      ? 'text-red-600 hover:bg-red-600/20' 
                                      : 'text-slate-600 hover:text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title={isVisibleInPopup ? 'Visível no pop-up (Clique para ocultar)' : 'Oculto no pop-up (Clique para exibir)'}
                                >
                                  {isVisibleInPopup ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetTitleField(field.key)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isTitleInPopup 
                                      ? 'text-amber-400 bg-amber-500/20' 
                                      : 'text-slate-600 hover:text-amber-400 hover:bg-slate-100'
                                  }`}
                                  title={isTitleInPopup ? 'Campo definido como Título do Pop-up' : 'Definir este campo como Título do Pop-up'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isTitleInPopup ? 'fill-amber-400' : ''}`} />
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartRename(field)}
                                  className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-600/10 rounded-lg transition-colors"
                                  title={isGestor ? 'Editar Nome do Campo' : 'Requer login de gestor'}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProtected(() => setFieldToDelete(field.key))}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title={isGestor ? 'Excluir Campo' : 'Requer login de gestor'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Live Pop-up Preview */}
          <div className="lg:col-span-5 flex flex-col h-full bg-white/60 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 bg-white/40 shrink-0">
              <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Prévia do Pop-up no Mapa
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start bg-slate-50/20">
              <div className="w-full max-w-sm bg-white text-slate-800 rounded-xl p-5 shadow-2xl border border-slate-200 text-xs font-sans">
                {/* Header */}
                <div 
                  className="border-b-2 pb-2 mb-3"
                  style={{ borderColor: layer.style?.strokeColor || '#0284c7' }}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    {layer.name}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    {currentTitleField && sampleProps[currentTitleField] ? String(sampleProps[currentTitleField]) : (sampleProps.nome_empreendimento || sampleProps.nome || 'Exemplo de Empreendimento')}
                  </h4>
                  {sampleProps.processo_graprohab && (
                    <div className="text-[11px] text-red-700 font-semibold mt-0.5">
                      Proc. GRAPROHAB: {sampleProps.processo_graprohab}
                    </div>
                  )}
                </div>

                {/* Ordered Fields Table */}
                <div className="max-h-72 overflow-y-auto pr-1">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <tbody>
                      {layer.propertiesSchema
                        .filter(p => currentVisibleFields.includes(p.key))
                        .map((p) => {
                          const val = sampleProps[p.key];
                          return (
                            <tr key={p.key} className="border-b border-slate-100 last:border-0">
                              <td className="py-1.5 pr-2 font-semibold text-slate-500 capitalize w-2/5">
                                {p.key.replace(/_/g, ' ')}:
                              </td>
                              <td className="py-1.5 text-slate-900 font-medium">
                                {val !== undefined && val !== null ? String(val) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 pt-2.5 mt-3 text-[10px] text-slate-500 text-center">
                  Visualização fiel do balão de informações ao clicar na feição no mapa
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Arraste as linhas pelo ícone pontilhado (⠿) para reordenar simultaneamente o pop-up e a tabela.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-semibold transition-colors shrink-0"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
