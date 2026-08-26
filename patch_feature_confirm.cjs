const fs = require('fs');
let content = fs.readFileSync('src/components/FeatureInspectorModal.tsx', 'utf8');

const oldState = `  const [isEditMode, setIsEditMode] = useState<boolean>(false);`;
const newState = `  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [confirmPrompt, setConfirmPrompt] = useState<{msg: string, action: () => void} | null>(null);`;
content = content.replace(oldState, newState);

const oldDelField = `  const handleDeleteFieldLocal = (key: string) => {
    if (!layer) return;
    if (window.confirm(\`Deseja realmente excluir o campo "\${key}" desta camada e de todas as suas feições?\`)) {
      if (onDeleteField) {
        onDeleteField(layer.id, key);
      }
      setEditedProperties(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };`;
const newDelField = `  const handleDeleteFieldLocal = (key: string) => {
    if (!layer) return;
    setConfirmPrompt({
      msg: \`Deseja realmente excluir o campo "\${key}" desta camada e de todas as suas feições?\`,
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
  };`;
content = content.replace(oldDelField, newDelField);

const oldDelFeat = `  const handleDeleteThisFeature = () => {
    if (!layer || featureIndex === undefined || featureIndex < 0) return;
    if (window.confirm(\`Tem certeza que deseja excluir esta feição (\${featureTitle}) permanentemente?\`)) {
      if (onDeleteFeature) {
        onDeleteFeature(layer.id, featureIndex);
      }
      onClose();
    }
  };`;
const newDelFeat = `  const handleDeleteThisFeature = () => {
    if (!layer || featureIndex === undefined || featureIndex < 0) return;
    setConfirmPrompt({
      msg: \`Tem certeza que deseja excluir esta feição (\${featureTitle}) permanentemente?\`,
      action: () => {
        if (onDeleteFeature) {
          onDeleteFeature(layer.id, featureIndex);
        }
        onClose();
      }
    });
  };`;
content = content.replace(oldDelFeat, newDelFeat);

const confirmModalHtml = `      {confirmPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl">
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

fs.writeFileSync('src/components/FeatureInspectorModal.tsx', content);
console.log('patched feature modal');
