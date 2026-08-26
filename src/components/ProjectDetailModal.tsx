import React from 'react';
import { Layers, MapPin, X } from 'lucide-react';

interface ProjectDetailModalProps {
  feature: GeoJSON.Feature | null;
  isOpen: boolean;
  onClose: () => void;
  onCenterOnMap?: (feature: GeoJSON.Feature) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  feature,
  isOpen,
  onClose,
  onCenterOnMap
}) => {
  if (!isOpen || !feature) return null;

  const p = feature.properties || {};
  
  let title = 'Atributos da Feição';
  const rawProt = p.PROTOCOLO ?? p.protocolo ?? p.Protocolo;
  const rawDisp = p.expediente_dispensa ?? p.dispensa ?? p.DISPENSA ?? p['Expediente Dispensa'] ?? p['EXPEDIENTE DISPENSA'];

  if (rawProt !== null && rawProt !== undefined && String(rawProt).trim() !== '') {
    title = `Protocolo: ${String(rawProt).trim()}`;
  } else if (rawDisp !== null && rawDisp !== undefined && String(rawDisp).trim() !== '') {
    title = `Dispensa: ${String(rawDisp).trim()}`;
  } else if (p.nome_empreendimento || p.name || p.nome) {
    title = p.nome_empreendimento || p.name || p.nome;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{title}</h2>
              <p className="text-[11px] text-slate-400 font-medium">Visualização de Propriedades</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Attributes Table */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-300 w-1/3">Propriedade (Chave)</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(p).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                      Nenhum atributo encontrado para esta feição.
                    </td>
                  </tr>
                ) : (
                  Object.entries(p).map(([key, val]) => (
                    <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px] break-all border-r border-slate-800/40">
                        {key}
                      </td>
                      <td className="px-4 py-2.5 text-slate-200 break-words whitespace-pre-wrap">
                        {val === null || val === undefined ? (
                          <span className="text-slate-600 italic">nulo</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          {onCenterOnMap && (
            <button
              onClick={() => {
                onCenterOnMap(feature);
                onClose();
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-950 transition-all flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span>Centralizar no Mapa</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
