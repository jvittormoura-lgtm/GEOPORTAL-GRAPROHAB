import React, { useState, useEffect } from 'react';
import { X, ArrowRight, AlertCircle, Database, Check, Layers } from 'lucide-react';
import { GisLayer, PropertySchema } from '../types/gis';

interface FieldMappingModalProps {
  layer: GisLayer;
  newSchema: PropertySchema[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export const FieldMappingModal: React.FC<FieldMappingModalProps> = ({
  layer,
  newSchema,
  onConfirm,
  onCancel
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    const oldSchema = layer.propertiesSchema || [];
    
    oldSchema.forEach(oldProp => {
      const oldKey = oldProp.key;
      // 1. Exact match
      let match = newSchema.find(n => n.key === oldKey);
      
      // 2. Case insensitive match
      if (!match) {
        match = newSchema.find(n => n.key.toLowerCase() === oldKey.toLowerCase());
      }
      
      // 3. Substring match (e.g. NU_PROTOCOLO and PROTOCOLO)
      if (!match) {
        // Only use substring match if the string length is reasonable to avoid false positives (e.g., matching 'id' with 'cidade')
        match = newSchema.find(n => {
            const nLower = n.key.toLowerCase();
            const oldLower = oldKey.toLowerCase();
            
            // Clean strings (remove base_)
            const cleanN = nLower.replace(/^base_/, '');
            const cleanOld = oldLower.replace(/^base_/, '');
            
            if (cleanN === cleanOld) return true;
            
            if (cleanN.length > 3 && cleanOld.length > 3) {
                return cleanN.includes(cleanOld) || cleanOld.includes(cleanN);
            }
            return false;
        });
      }

      initialMapping[oldKey] = match ? match.key : '';
    });
    
    setMapping(initialMapping);
  }, [layer, newSchema]);

  const handleSelectChange = (oldKey: string, newKey: string) => {
    setMapping(prev => ({ ...prev, [oldKey]: newKey }));
  };

  const oldSchema = layer.propertiesSchema || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Compatibilidade de Colunas (De-Para)</h2>
              <p className="text-xs text-slate-500">
                Camada: <span className="font-semibold text-slate-700">{layer.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex gap-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            O novo arquivo possui colunas diferentes do arquivo original. 
            Para garantir que os pop-ups, filtros e cores continuem funcionando perfeitamente, 
            indique qual coluna do <strong>novo arquivo</strong> corresponde a cada coluna do <strong>padrão original</strong>.
          </p>
        </div>

        {/* Table Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div>Coluna Original (Esperada pelo GeoPortal)</div>
              <div>Coluna do Novo Arquivo (Upload)</div>
            </div>
            <div className="divide-y divide-slate-100">
              {oldSchema.map(oldProp => {
                const mappedTo = mapping[oldProp.key];
                const isMapped = Boolean(mappedTo);
                
                return (
                  <div key={oldProp.key} className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 pr-4">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isMapped ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                      <span className="text-sm font-medium text-slate-700 truncate" title={oldProp.key}>
                        {oldProp.key}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 ml-auto" />
                    </div>
                    <div>
                      <select
                        value={mappedTo || ''}
                        onChange={(e) => handleSelectChange(oldProp.key, e.target.value)}
                        className={`w-full text-sm rounded-lg border px-3 py-2 outline-none transition-shadow ${
                          isMapped 
                            ? 'border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100' 
                            : 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                        }`}
                      >
                        <option value="">-- Ignorar (Dados desta coluna ficarão vazios) --</option>
                        {newSchema.map(newProp => (
                          <option key={newProp.key} value={newProp.key}>
                            {newProp.key}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(mapping)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Confirmar e Atualizar Camada
          </button>
        </div>

      </div>
    </div>
  );
};
