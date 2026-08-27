import React, { useState } from 'react';
import { GisLayer, LayerStyle, ThematicConfig, ThematicClass } from '../types/gis';
import { Palette, Flame, Sliders, Check, RefreshCw } from 'lucide-react';

interface StyleModalProps {
  layer: GisLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStyle: (layerId: string, style: LayerStyle, thematic?: ThematicConfig, isHeatmap?: boolean) => void;
}

const PRESET_PALETTES: { id: string; name: string; colors: string[] }[] = [
  { id: 'viridis', name: 'Viridis (Científico)', colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'] },
  { id: 'plasma', name: 'Plasma (Alto Contraste)', colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'] },
  { id: 'blues', name: 'Gradiente Azul (Água/População)', colors: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'] },
  { id: 'warm', name: 'Vermelho / Quente (Alerta/Calor)', colors: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'] },
  { id: 'emerald', name: 'Verde Esmeralda (Vegetação)', colors: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'] },
  { id: 'spectral', name: 'Espectral Multicor', colors: ['#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5', '#3288bd'] },
  { id: 'magma', name: 'Magma (Noturno/Vulcânico)', colors: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'] }
];

const PRESET_COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#eab308',
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#64748b',
  '#ffffff', '#0f172a'
];

export const StyleModal: React.FC<StyleModalProps> = ({
  layer,
  isOpen,
  onClose,
  onSaveStyle
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'thematic' | 'heatmap'>('basic');
  const [style, setStyle] = useState<LayerStyle>({
    fillColor: '#38bdf8',
    strokeColor: '#0284c7',
    strokeWidth: 2,
    fillOpacity: 0.5,
    strokeOpacity: 0.9,
    pointRadius: 7,
    pointShape: 'circle',
    smoothFactor: 1.0
  });
  const [isHeatmap, setIsHeatmap] = useState<boolean>(false);

  // Thematic State
  const [thematicEnabled, setThematicEnabled] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedPalette, setSelectedPalette] = useState<string[]>(PRESET_PALETTES[0].colors);
  const [thematicClasses, setThematicClasses] = useState<ThematicClass[]>([]);

  // Sync state whenever layer or isOpen changes
  React.useEffect(() => {
    if (layer && isOpen) {
      setStyle({ ...layer.style });
      setIsHeatmap(!!layer.isHeatmap);
      setThematicEnabled(!!layer.thematic?.enabled);
      setSelectedProperty(layer.thematic?.property || layer.propertiesSchema[0]?.key || '');
      setSelectedPalette(layer.thematic?.palette || PRESET_PALETTES[0].colors);
      setThematicClasses(layer.thematic?.classes || []);
      setActiveTab('basic');
    }
  }, [layer, isOpen]);

  if (!isOpen || !layer) return null;

  const activePropSchema = layer.propertiesSchema.find(p => p.key === selectedProperty);

  const generateThematicClasses = (propertyKey: string, palette: string[]) => {
    const prop = layer.propertiesSchema.find(p => p.key === propertyKey);
    if (!prop) return;

    const values = layer.data.features
      .map(f => f.properties ? f.properties[propertyKey] : null)
      .filter(v => v !== null && v !== undefined);

    if (prop.type === 'number') {
      const numValues = (values as number[]).filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
      if (numValues.length === 0) return;

      const numClasses = palette.length;
      const min = numValues[0];
      const max = numValues[numValues.length - 1];
      const step = (max - min) / numClasses;

      const classes: ThematicClass[] = [];
      for (let i = 0; i < numClasses; i++) {
        const cMin = min + i * step;
        const cMax = i === numClasses - 1 ? max : min + (i + 1) * step;
        const count = numValues.filter(v => (i === 0 ? v >= cMin : v > cMin) && v <= cMax).length;

        classes.push({
          min: Math.round(cMin * 100) / 100,
          max: Math.round(cMax * 100) / 100,
          color: palette[i],
          label: `${Math.round(cMin * 10) / 10} até ${Math.round(cMax * 10) / 10}`,
          count
        });
      }
      setThematicClasses(classes);
    } else {
      // Categorical unique values
      const uniqueVals = Array.from<string>(new Set(values.map((v: any) => String(v)))).slice(0, palette.length);
      const classes: ThematicClass[] = uniqueVals.map((val: string, idx: number) => {
        const count = values.filter(v => String(v) === val).length;
        return {
          value: String(val),
          color: palette[idx % palette.length],
          label: String(val),
          count
        };
      });
      setThematicClasses(classes);
    }
  };

  const handleSave = () => {
    let thematicConfig: ThematicConfig | undefined = undefined;
    if (thematicEnabled && thematicClasses.length > 0) {
      thematicConfig = {
        enabled: true,
        property: selectedProperty,
        mode: activePropSchema?.type === 'number' ? 'graduated' : 'categorical',
        method: activePropSchema?.type === 'number' ? 'equalInterval' : 'uniqueValues',
        palette: selectedPalette,
        classes: thematicClasses
      };
    }
    onSaveStyle(layer.id, style, thematicConfig, isHeatmap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="style-modal"
        className="w-full max-w-2xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/10 text-red-600 rounded-lg">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Estilização da Camada: {layer.name}</h2>
              <p className="text-xs text-slate-500">Defina cores sólidas, gradientes temáticos ou mapas de calor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('basic')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Estilo Vetorial Padrão
          </button>
          <button
            onClick={() => {
              setActiveTab('thematic');
              if (thematicClasses.length === 0 && selectedProperty) {
                generateThematicClasses(selectedProperty, selectedPalette);
              }
            }}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'thematic'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            Mapa Temático (Coroplético)
          </button>
          {layer.geometryType === 'Point' && (
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'heatmap'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Flame className="w-4 h-4" />
              Mapa de Calor (Heatmap)
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              {/* Fill Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Cor de Preenchimento (Fill)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={style.fillColor}
                    onChange={(e) => setStyle({ ...style, fillColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setStyle({ ...style, fillColor: c })}
                        className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                          style.fillColor === c ? 'ring-2 ring-red-600 border-white' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stroke Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Cor da Borda / Linha (Stroke)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={style.strokeColor}
                    onChange={(e) => setStyle({ ...style, strokeColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setStyle({ ...style, strokeColor: c })}
                        className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                          style.strokeColor === c ? 'ring-2 ring-red-600 border-white' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Opacidade do Preenchimento</span>
                    <span className="font-mono text-red-600">{Math.round(style.fillOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={style.fillOpacity}
                    onChange={(e) => setStyle({ ...style, fillOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-red-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Espessura da Linha (Stroke Width)</span>
                    <span className="font-mono text-red-600">{style.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={style.strokeWidth}
                    onChange={(e) => setStyle({ ...style, strokeWidth: parseInt(e.target.value) })}
                    className="w-full accent-red-600"
                  />
                </div>

                {layer.geometryType === 'Point' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-700 mb-1">
                      <span>Raio do Marcador (Pontos)</span>
                      <span className="font-mono text-red-600">{style.pointRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="25"
                      step="1"
                      value={style.pointRadius}
                      onChange={(e) => setStyle({ ...style, pointRadius: parseInt(e.target.value) })}
                      className="w-full accent-red-600"
                    />
                  </div>
                )}

                {(layer.geometryType === 'Polygon' || layer.geometryType === 'MultiPolygon' || layer.geometryType === 'LineString' || layer.geometryType === 'MultiLineString' || layer.geometryType === 'Mixed' || layer.geometryType === 'GeometryCollection') && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-700 mb-1">
                      <span>Simplificação (Aproximação)</span>
                      <span className="font-mono text-red-600">{style.smoothFactor !== undefined ? style.smoothFactor : 1.0}</span>
                    </div>
                    <div className="flex flex-col gap-1 pb-4">
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={style.smoothFactor !== undefined ? style.smoothFactor : 1.0}
                          onChange={(e) => setStyle({ ...style, smoothFactor: parseFloat(e.target.value) })}
                          className="w-full accent-red-600 h-1.5 bg-slate-200/80 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between w-full mt-1.5 pointer-events-none relative px-0.5">
                          <div className="flex flex-col items-center absolute" style={{ left: '0%', transform: 'translateX(0%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">Preciso</span>
                          </div>
                          <div className="flex flex-col items-center absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">5.0</span>
                          </div>
                          <div className="flex flex-col items-center absolute" style={{ left: '100%', transform: 'translateX(-100%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">Leve</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Valores maiores aceleram a renderização suavizando as bordas apenas visualmente.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'thematic' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3.5 bg-slate-100/60 rounded-xl border border-slate-300">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Ativar Classificação Temática</h4>
                  <p className="text-xs text-slate-500">Colorir feições automaticamente com base em valores de atributos</p>
                </div>
                <input
                  type="checkbox"
                  checked={thematicEnabled}
                  onChange={(e) => {
                    setThematicEnabled(e.target.checked);
                    if (e.target.checked && thematicClasses.length === 0) {
                      generateThematicClasses(selectedProperty, selectedPalette);
                    }
                  }}
                  className="w-5 h-5 rounded text-red-700 focus:ring-red-600 bg-white border-slate-300"
                />
              </div>

              {thematicEnabled && (
                <>
                  {/* Select Property */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Campo / Atributo
                      </label>
                      <select
                        value={selectedProperty}
                        onChange={(e) => {
                          setSelectedProperty(e.target.value);
                          generateThematicClasses(e.target.value, selectedPalette);
                        }}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-red-600"
                      >
                        {layer.propertiesSchema.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.key} ({p.type === 'number' ? 'Numérico' : 'Texto/Categórico'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Paleta de Cores
                      </label>
                      <select
                        onChange={(e) => {
                          const pal = PRESET_PALETTES.find(p => p.id === e.target.value)?.colors || PRESET_PALETTES[0].colors;
                          setSelectedPalette(pal);
                          generateThematicClasses(selectedProperty, pal);
                        }}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-red-600"
                      >
                        {PRESET_PALETTES.map((pal) => (
                          <option key={pal.id} value={pal.id}>{pal.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Classes Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Classes / Intervalos Gerados ({thematicClasses.length})
                      </span>
                      <button
                        onClick={() => generateThematicClasses(selectedProperty, selectedPalette)}
                        className="text-xs text-red-600 hover:text-red-500 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Recalcular
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50/60 rounded-xl border border-slate-200">
                      {thematicClasses.map((cls, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white text-xs">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="color"
                              value={cls.color}
                              onChange={(e) => {
                                const newClasses = [...thematicClasses];
                                newClasses[idx].color = e.target.value;
                                setThematicClasses(newClasses);
                              }}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-slate-800 font-medium">{cls.label}</span>
                          </div>
                          {cls.count !== undefined && (
                            <span className="text-slate-500 text-[11px] font-mono">
                              {cls.count} feições
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-100/60 rounded-xl border border-slate-300">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Visualização em Mapa de Calor</h4>
                  <p className="text-xs text-slate-500">Interpola densidade e concentração espacial de pontos</p>
                </div>
                <input
                  type="checkbox"
                  checked={isHeatmap}
                  onChange={(e) => setIsHeatmap(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-white border-slate-300"
                />
              </div>

              {isHeatmap && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-1">
                  <p className="font-semibold">Modo Densidade Térmica Ativado</p>
                  <p className="text-amber-300/80">
                    Os pontos serão renderizados com base na proximidade e densidade acumulada, ideal para grandes conjuntos de coordenadas ou dados sísmicos/urbanos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white/90 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-100/40"
          >
            <Check className="w-4 h-4" />
            Aplicar Estilo
          </button>
        </div>
      </div>
    </div>
  );
};
