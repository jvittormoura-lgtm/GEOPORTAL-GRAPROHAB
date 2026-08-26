const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const oldOpacity = `  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };`;

const newOpacity = `  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const handleChangeSmoothFactor = (id: string, smoothFactor: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, style: { ...l.style, smoothFactor } } : l));
  };`;
appContent = appContent.replace(oldOpacity, newOpacity);

const oldProps = `              onToggleVisibility={handleToggleVisibility}
              onChangeOpacity={handleChangeOpacity}
              onRenameLayer={handleRenameLayer}`;
const newProps = `              onToggleVisibility={handleToggleVisibility}
              onChangeOpacity={handleChangeOpacity}
              onChangeSmoothFactor={handleChangeSmoothFactor}
              onRenameLayer={handleRenameLayer}`;
appContent = appContent.replace(oldProps, newProps);

fs.writeFileSync('src/App.tsx', appContent);

// Patch LayerManager.tsx
let lmContent = fs.readFileSync('src/components/LayerManager.tsx', 'utf8');

const oldInterface = `  onToggleVisibility: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onZoomToLayer: (id: string) => void;`;
const newInterface = `  onToggleVisibility: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onChangeSmoothFactor?: (id: string, smoothFactor: number) => void;
  onZoomToLayer: (id: string) => void;`;
lmContent = lmContent.replace(oldInterface, newInterface);

const oldDestruct = `  onToggleVisibility,
  onChangeOpacity,
  onZoomToLayer,`;
const newDestruct = `  onToggleVisibility,
  onChangeOpacity,
  onChangeSmoothFactor,
  onZoomToLayer,`;
lmContent = lmContent.replace(oldDestruct, newDestruct);

const oldSlider = `                  {/* Opacity Slider */}
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400 w-12">Opacidade:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>`;
const newSlider = `                  {/* Opacity Slider */}
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400 w-12">Opacidade:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {/* Smooth Factor Slider (Gestor Only) */}
                  {appMode === 'gestor' && onChangeSmoothFactor && 
                   (layer.geometryType !== 'Point' && layer.geometryType !== 'MultiPoint') && (
                    <div className="mt-2 flex items-center gap-2 px-1" title="Simplificação do polígono/linha (quanto maior, mais leve e menos preciso)">
                      <span className="text-[10px] text-slate-400 w-12">Simplificar:</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                        onChange={(e) => onChangeSmoothFactor(layer.id, parseFloat(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                        {layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                      </span>
                    </div>
                  )}`;
lmContent = lmContent.replace(oldSlider, newSlider);

fs.writeFileSync('src/components/LayerManager.tsx', lmContent);
console.log('patched smooth factor manager');
