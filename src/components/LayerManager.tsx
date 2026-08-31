import React from 'react';
import { GisLayer, AppMode } from '../types/gis';
import { 
  Layers, Eye, EyeOff, Sliders, Filter, Table, 
  Trash2, ZoomIn, Palette, Activity, Copy, Flame, MapPin, 
  Shapes, MoveRight, ChevronDown, ChevronRight, Lock, Unlock, ShieldAlert,
  Columns, Pencil, Check, X, Info, GripVertical
} from 'lucide-react';

interface LayerManagerProps {
  layers: GisLayer[];
  activeLayerId: string | null;
  appMode: AppMode;
  onSelectActiveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onChangeSmoothFactor?: (id: string, smoothFactor: number) => void;
  onZoomToLayer: (id: string) => void;
  onOpenStyleModal: (layer: GisLayer) => void;
  onOpenFilterPanel: (layer: GisLayer) => void;
  onOpenAttributeTable: (layer: GisLayer) => void;
  onOpenFieldManager?: (layer: GisLayer) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onRequireAuth: (callback: () => void) => void;
  onRenameLayer?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
  onReorderLayers?: (activeId: string, overId: string) => void;
}


const DebouncedSlider = ({
  label, value, min, max, step, onChange, formatValue, rulerMarks, title
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (val: number) => void;
  formatValue: (val: number) => string;
  rulerMarks?: { value: number; label: string }[];
  title?: string;
}) => {
  const [localVal, setLocalVal] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (newVal: number) => {
    setLocalVal(newVal);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newVal);
    }, 250);
  };

  const handlePointerUp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onChange(localVal);
  };

  return (
    <div className="mt-3 flex items-start gap-2 px-1" title={title} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
      <span className="text-[10px] text-slate-500 w-14 mt-0.5">{label}:</span>
      <div className="flex-1 flex flex-col">
        <input
          type="range"
          min={min} max={max} step={step}
          value={localVal}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onPointerUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          className="w-full accent-red-600 h-1.5 bg-slate-200/80 rounded-lg cursor-pointer"
        />
        {rulerMarks && (
          <div className="flex justify-between w-full mt-1.5 pointer-events-none relative px-0.5">
            {rulerMarks.map((mark, i) => (
              <div key={i} className="flex flex-col items-center absolute" style={{ left: `${((mark.value - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">{mark.label}</span>
              </div>
            ))}
            <div className="h-3 w-full" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-mono text-slate-700 w-8 text-right mt-0.5">
        {formatValue(localVal)}
      </span>
    </div>
  );
};

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  appMode,
  onSelectActiveLayer,
  onToggleVisibility,
  onChangeOpacity,
  onChangeSmoothFactor,
  onZoomToLayer,
  onOpenStyleModal,
  onOpenFilterPanel,
  onOpenAttributeTable,
  onOpenFieldManager,
  onDuplicateLayer,
  onDeleteLayer,
  onRequireAuth,
  onRenameLayer,
  onUpdateDescription,
  onReorderLayers
}) => {
  const [expandedLegends, setExpandedLegends] = React.useState<Record<string, boolean>>({});
  const [editingLayerId, setEditingLayerId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = React.useState<string | null>(null);
  const [activeDragHandleId, setActiveDragHandleId] = React.useState<string | null>(null);
  const [showTipologiaInfo, setShowTipologiaInfo] = React.useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== id) {
      setDragOverLayerId(id);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };
  
  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== id && onReorderLayers) {
      onReorderLayers(draggedLayerId, id);
    }
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const toggleLegend = (id: string) => {
    setExpandedLegends(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getGeometryIcon = (type: string) => {
    switch (type) {
      case 'Point':
      case 'MultiPoint':
        return <MapPin className="w-3.5 h-3.5" />;
      case 'LineString':
      case 'MultiLineString':
        return <MoveRight className="w-3.5 h-3.5" />;
      case 'Polygon':
      case 'MultiPolygon':
        return <Shapes className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const handleProtectedAction = (action: () => void) => {
    if (appMode === 'gestor') {
      action();
    } else {
      onRequireAuth(action);
    }
  };

  return (
    <div 
      id="layer-manager-container"
      className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-900 select-none overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-600" />
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-800">
            Tipologia de empreendimentos ({layers.length})
          </span>
          <button 
            type="button" 
            onClick={() => setShowTipologiaInfo(true)}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
            title="Informações sobre Tipologia de Empreendimentos"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        {appMode === 'gestor' ? (
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 border border-emerald-500/30 text-emerald-700 font-semibold rounded-full flex items-center gap-1">
            <Unlock className="w-3 h-3 text-emerald-400" />
            Edição
          </span>
        ) : (
          <button
            onClick={() => onRequireAuth(() => {})}
            className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium rounded-full flex items-center gap-1 transition-colors"
            title="Clique para desbloquear modo de edição com senha"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            Consulta
          </button>
        )}
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {layers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs space-y-2">
            <Layers className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
            <p className="font-medium text-slate-500">Nenhuma camada carregada</p>
            <p className="text-[11px] text-slate-500">
              Faça upload de arquivos GeoJSON ou selecione uma das camadas oficiais do Estado de SP.
            </p>
          </div>
        ) : (
          layers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            const hasThematic = layer.thematic && layer.thematic.enabled && layer.thematic.classes.length > 0;
            const isLegendOpen = expandedLegends[layer.id] ?? true;

            return (
              <div
                key={layer.id}
                id={`layer-card-${layer.id}`}
                draggable={activeDragHandleId === layer.id}
                onDragStart={(e) => handleDragStart(e, layer.id)}
                onDragOver={(e) => handleDragOver(e, layer.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, layer.id)}
                onDragEnd={() => { setDraggedLayerId(null); setDragOverLayerId(null); }}
                onClick={() => onSelectActiveLayer(layer.id)}
                className={`group relative hover:z-[100] rounded-xl border transition-all cursor-pointer ${
                  dragOverLayerId === layer.id ? 'border-t-4 border-t-red-600 bg-red-100/20' : ''
                } ${
                  isActive
                    ? 'bg-slate-100/90 border-red-600/70 shadow-lg shadow-red-200/30 z-10'
                    : 'bg-white/60 border-slate-200 hover:bg-slate-100/40 hover:border-slate-300'
                } ${draggedLayerId === layer.id ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
              >
                {/* Main Card Header */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Drag Handle */}
                      <div 
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-900 transition-colors" 
                        title="Clicar e arrastar para reordenar"
                        onMouseEnter={() => setActiveDragHandleId(layer.id)}
                        onMouseLeave={() => setActiveDragHandleId(null)}
                        onPointerDown={() => setActiveDragHandleId(layer.id)}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      {/* Visibility checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(layer.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          layer.visible
                            ? 'text-red-600 hover:bg-red-600/10'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                        title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Color marker dot */}
                      <div
                        className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-xs"
                        style={{ backgroundColor: layer.style.fillColor }}
                      />

                      {/* Name & Type */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {editingLayerId === layer.id ? (
                            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editName.trim() && onRenameLayer) {
                                      onRenameLayer(layer.id, editName.trim());
                                    }
                                    setEditingLayerId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingLayerId(null);
                                  }
                                }}
                                className="w-[100px] bg-white border border-red-600 rounded px-1 text-xs text-slate-900 focus:outline-none"
                              />
                              <button onClick={() => {
                                if (editName.trim() && onRenameLayer) onRenameLayer(layer.id, editName.trim());
                                setEditingLayerId(null);
                              }} className="text-emerald-400 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingLayerId(null)} className="text-slate-500 hover:text-slate-800"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-xs text-slate-900 truncate max-w-[130px]" title={layer.name}>
                                {layer.name}
                              </h4>
                              {onRenameLayer && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLayerId(layer.id);
                                    setEditName(layer.name);
                                  }}
                                  className="text-slate-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Renomear Camada"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                              
                            </>
                          )}
                          {layer.isRealtime && (
                            <span className="flex items-center gap-1 px-1.5 py-0.2 bg-rose-500/20 text-rose-700 border border-rose-200 rounded-full text-[9px] font-semibold animate-pulse">
                              <Activity className="w-2.5 h-2.5" />
                              LIVE
                            </span>
                          )}
                          {layer.isHeatmap && (
                            <span className="p-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px]" title="Heatmap">
                              <Flame className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            {getGeometryIcon(layer.geometryType)}
                            {layer.geometryType}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400">
                            {layer.filteredCount}{' '}
                            {layer.filteredCount !== layer.featureCount && (
                              <span className="text-slate-500">/ {layer.featureCount}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <DebouncedSlider
                    label="Opacidade"
                    value={layer.opacity}
                    min={0} max={1} step={0.05}
                    onChange={(v) => onChangeOpacity(layer.id, v)}
                    formatValue={(v) => Math.round(v * 100) + '%'}
                    rulerMarks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' }
                    ]}
                  />

                  {/* Smooth Factor Slider (Gestor Only) */}
                  {appMode === 'gestor' && onChangeSmoothFactor && 
                   (layer.geometryType !== 'Point' && layer.geometryType !== 'MultiPoint') && (
                    <DebouncedSlider
                      label="Simplificar"
                      title="Simplificação do polígono/linha (quanto maior, mais leve e menos preciso)"
                      value={layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                      min={0} max={10} step={0.5}
                      onChange={(v) => onChangeSmoothFactor(layer.id, v)}
                      formatValue={(v) => v.toFixed(1)}
                      rulerMarks={[
                        { value: 0, label: 'Preciso' },
                        { value: 5, label: '5.0' },
                        { value: 10, label: 'Leve' }
                      ]}
                    />
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {appMode === 'gestor' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProtectedAction(() => onOpenStyleModal(layer));
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="Estilizar Camada / Cores"
                        >
                          <Palette className="w-3 h-3 text-red-600" />
                          <span className="text-[10px] hidden sm:inline">Estilo</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAttributeTable(layer);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs flex items-center gap-1 transition-colors"
                        title="Ver Tabela de Atributos"
                      >
                        <Table className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] hidden sm:inline">Tabela</span>
                      </button>

                      {appMode === 'gestor' && onOpenFieldManager && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFieldManager(layer);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="Gerenciar ordem dos campos no pop-up e tabela, visibilidade e renomeação"
                        >
                          <Columns className="w-3 h-3 text-red-600" />
                          <span className="text-[10px] hidden sm:inline">Campos</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProtectedAction(() => onDuplicateLayer(layer.id));
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                        title={appMode === 'gestor' ? "Duplicar camada" : "Requer senha de gestor"}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProtectedAction(() => onDeleteLayer(layer.id));
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                        title={appMode === 'gestor' ? "Excluir camada" : "Requer senha de gestor"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thematic Legend Dropdown Preview */}
                {hasThematic && layer.thematic && (
                  <div className="border-t border-slate-200/80 bg-slate-50/40 p-2.5 rounded-b-xl">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLegend(layer.id);
                      }}
                      className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 mb-1"
                    >
                      <span className="font-semibold text-slate-700">
                        Legenda: {layer.thematic.property}
                      </span>
                      {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>

                    {isLegendOpen && (
                      <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                        {layer.thematic.classes.map((cls, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-xs border border-white/20 shrink-0"
                                style={{ backgroundColor: cls.color }}
                              />
                              <span className="text-slate-700 truncate max-w-[150px]">{cls.label}</span>
                            </div>
                            {cls.count !== undefined && (
                              <span className="text-slate-500 font-mono">{cls.count}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tipologia Info Modal */}
      {showTipologiaInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowTipologiaInfo(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-slate-900 font-semibold text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-red-600" />
                Características dos Empreendimentos
              </h3>
              <button 
                onClick={() => setShowTipologiaInfo(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors p-1"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm text-slate-700 space-y-4 overflow-y-auto pr-2 pb-2">
              <p><strong>1. Condomínio (Protocolo):</strong> Projetos que exigem <strong className="text-red-600 font-semibold">análise obrigatória</strong> do colegiado devido ao porte (mais de 800 unidades verticais, 200 horizontais, 350 mistos ou área superior a 50.000 m²) ou por <strong className="text-red-600 font-semibold">restrição ambiental</strong> (área protegida &ge;10.000 m²).</p>
              
              <p><strong>2. Loteamento:</strong> Subdivisão de gleba em lotes com abertura de novas vias ou prolongamento das existentes. <strong className="text-red-600 font-semibold">Análise obrigatória</strong> do colegiado.</p>
              
              <p><strong>3. Conjunto Habitacional:</strong> Loteamento destinado à construção de unidades habitacionais e equipamentos comunitários. <strong className="text-red-600 font-semibold">Análise obrigatória</strong> do colegiado.</p>
              
              <p><strong>4. Condomínio (Dispensa):</strong> Projetos de até 800 unidades (verticais), 200 (horizontais) ou 350 (mistos) em áreas com infraestrutura e saneamento já implantados. <strong className="text-red-600 font-semibold">Não há análise</strong> do colegiado devido ao Não Enquadramento.</p>
              
              <p><strong>5. Desmembramento (Dispensa):</strong> Subdivisão em até 10 lotes, ou áreas maiores que já possuam infraestrutura completa e redes de saneamento em toda a testada. <strong className="text-red-600 font-semibold">Não há análise</strong> do colegiado devido ao Não Enquadramento.</p>
              
              <p><strong>6. Desmembramento (Protocolo):</strong> Subdivisão em mais de 10 lotes em áreas não servidas por redes de infraestrutura e saneamento. <strong className="text-red-600 font-semibold">Análise obrigatória</strong> do colegiado.</p>
            </div>
            
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setShowTipologiaInfo(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
