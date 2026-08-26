const fs = require('fs');
let content = fs.readFileSync('src/components/AttributeTable.tsx', 'utf8');

const oldState = `  // Editable cell state
  const [editingCell, setEditingCell] = useState<{ featureIdx: number; colKey: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');`;
const newState = `  // Editable cell state
  const [editingCell, setEditingCell] = useState<{ featureIdx: number; colKey: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  const [confirmPrompt, setConfirmPrompt] = useState<{msg: string, action: () => void} | null>(null);`;
content = content.replace(oldState, newState);

const oldDelCol = `  const handleDeleteColumnConfirm = (col: string) => {
    handleProtectedAction(() => {
      if (window.confirm(\`Tem certeza que deseja excluir a coluna "\${col}" de todas as feições desta camada GeoJSON?\`)) {
        onDeleteField(layer.id, col);
      }
      setActiveColumnMenu(null);
    });
  };`;
const newDelCol = `  const handleDeleteColumnConfirm = (col: string) => {
    handleProtectedAction(() => {
      setConfirmPrompt({
        msg: \`Tem certeza que deseja excluir a coluna "\${col}" de todas as feições desta camada GeoJSON?\`,
        action: () => {
          onDeleteField(layer.id, col);
        }
      });
      setActiveColumnMenu(null);
    });
  };`;
content = content.replace(oldDelCol, newDelCol);

const oldDelFeat = `                        {onDeleteFeature && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Excluir esta feição da camada?')) {
                                onDeleteFeature(layer.id, idx);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Excluir feição"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}`;
const newDelFeat = `                        {onDeleteFeature && (
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
                        )}`;
content = content.replace(oldDelFeat, newDelFeat);

const confirmModalHtml = `      {confirmPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-t-3xl">
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-300 mb-2">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-300 mb-6">{confirmPrompt.msg}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmPrompt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
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
};`;
content = content.replace(/    <\/div>\n  \);\n};\s*$/, confirmModalHtml);

fs.writeFileSync('src/components/AttributeTable.tsx', content);
console.log('patched attr table');
