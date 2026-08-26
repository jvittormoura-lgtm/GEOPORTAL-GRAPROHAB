import React, { useState } from 'react';
import { GisLayer, PropertySchema } from '../types/gis';
import { 
  X, Columns, Edit2, Trash2, Plus, Check, AlertTriangle, 
  HelpCircle, Type, Hash, Calendar, ToggleLeft, Layers
} from 'lucide-react';

interface FieldManagerModalProps {
  layer: GisLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onRenameField: (layerId: string, oldKey: string, newKey: string) => void;
  onDeleteField: (layerId: string, fieldKey: string) => void;
  onAddField: (layerId: string, fieldName: string, defaultValue: any, fieldType: 'string' | 'number') => void;
}

export const FieldManagerModal: React.FC<FieldManagerModalProps> = ({
  layer,
  isOpen,
  onClose,
  onRenameField,
  onDeleteField,
  onAddField
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

  if (!isOpen || !layer) return null;

  const handleStartRename = (field: PropertySchema) => {
    setEditingFieldKey(field.key);
    setEditedFieldName(field.key);
    setErrorMsg(null);
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
    onDeleteField(layer.id, fieldKey);
    setFieldToDelete(null);
    setErrorMsg(null);
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
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
        return <Type className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div 
      id="field-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Gerenciar Campos da Camada
              </h3>
              <p className="text-xs text-slate-400">
                Camada: <span className="text-sky-300 font-semibold">{layer.name}</span> ({layer.propertiesSchema.length} campos)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Edite o nome de qualquer coluna ou exclua campos desnecessários do GeoJSON.
          </p>
          <button
            onClick={() => {
              setIsAddingField(!isAddingField);
              setErrorMsg(null);
            }}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-950/40 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Novo Campo</span>
          </button>
        </div>

        {/* Add New Field Drawer */}
        {isAddingField && (
          <form 
            onSubmit={handleCreateField}
            className="mx-6 my-3 p-4 bg-slate-950/80 border border-sky-500/40 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar Novo Campo na Camada
              </span>
              <button 
                type="button" 
                onClick={() => setIsAddingField(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Campo:</label>
                <input
                  type="text"
                  placeholder="Ex: status_vistoria"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tipo de Dado:</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="string">Texto (String)</option>
                  <option value="number">Número (Integer/Float)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Valor Padrão (Opcional):</label>
                <input
                  type={newFieldType === 'number' ? 'number' : 'text'}
                  placeholder={newFieldType === 'number' ? '0' : 'Vazio'}
                  value={newFieldDefaultValue}
                  onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
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
          <div className="mx-6 my-3 p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  Confirmar Exclusão do Campo "{fieldToDelete}"?
                </h4>
                <p className="text-xs text-rose-300/80 mt-1">
                  Este atributo será permanentemente removido de todas as {layer.featureCount} feições desta camada GeoJSON. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFieldToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
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

        {/* Field List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {layer.propertiesSchema.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhum campo de atributo encontrado nesta camada GeoJSON.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 w-12 text-center">#</th>
                    <th className="px-4 py-2.5">Nome do Campo</th>
                    <th className="px-4 py-2.5 w-32">Tipo</th>
                    <th className="px-4 py-2.5">Valores de Amostra</th>
                    <th className="px-4 py-2.5 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {layer.propertiesSchema.map((field, idx) => {
                    const isEditing = editingFieldKey === field.key;

                    return (
                      <tr 
                        key={field.key} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isEditing ? 'bg-sky-950/40' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {idx + 1}
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
                                className="px-2.5 py-1 bg-slate-900 border border-sky-500 rounded-lg text-xs text-white font-mono focus:outline-none w-56"
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
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200 font-mono text-xs">
                                {field.key}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-300 font-mono">
                            {getFieldTypeIcon(field.type)}
                            {field.type}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-slate-400 text-[11px] truncate max-w-xs font-mono">
                          {field.sampleValues && field.sampleValues.length > 0 ? (
                            <span>{field.sampleValues.slice(0, 3).map(v => String(v)).join(', ')}</span>
                          ) : (
                            <span className="text-slate-600 italic">—</span>
                          )}
                        </td>

                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartRename(field)}
                              className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-colors"
                              title="Editar Nome do Campo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFieldToDelete(field.key)}
                              className="px-2 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                              title="Excluir Campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-xs">Excluir</span>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>As alterações são aplicadas imediatamente a todas as feições da camada.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
