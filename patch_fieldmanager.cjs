const fs = require('fs');
let content = fs.readFileSync('src/components/FieldManagerModal.tsx', 'utf8');

// Replace the actions block to include a text label for Excluir
const oldActions = `                            <button
                              type="button"
                              onClick={() => setFieldToDelete(field.key)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir Campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;
const newActions = `                            <button
                              type="button"
                              onClick={() => setFieldToDelete(field.key)}
                              className="px-2 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                              title="Excluir Campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-xs">Excluir</span>
                            </button>`;

content = content.replace(oldActions, newActions);
fs.writeFileSync('src/components/FieldManagerModal.tsx', content);
console.log('patched');
