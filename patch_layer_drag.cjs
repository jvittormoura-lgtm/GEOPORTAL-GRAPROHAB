const fs = require('fs');
let content = fs.readFileSync('src/components/LayerManager.tsx', 'utf8');

const oldImports = `import { 
  Layers, Eye, EyeOff, Sliders, Filter, Table, 
  Trash2, ZoomIn, Palette, Activity, Copy, Flame, MapPin, 
  Shapes, MoveRight, ChevronDown, ChevronRight, Lock, Unlock, ShieldAlert,
  Columns, Pencil, Check, X, Info
} from 'lucide-react';`;

const newImports = `import { 
  Layers, Eye, EyeOff, Sliders, Filter, Table, 
  Trash2, ZoomIn, Palette, Activity, Copy, Flame, MapPin, 
  Shapes, MoveRight, ChevronDown, ChevronRight, Lock, Unlock, ShieldAlert,
  Columns, Pencil, Check, X, Info, GripVertical
} from 'lucide-react';`;
content = content.replace(oldImports, newImports);

const oldProps = `  onRenameLayer?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
}`;
const newProps = `  onRenameLayer?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
  onReorderLayers?: (activeId: string, overId: string) => void;
}`;
content = content.replace(oldProps, newProps);

const oldDestruct = `  onRenameLayer,
  onUpdateDescription
}) => {`;
const newDestruct = `  onRenameLayer,
  onUpdateDescription,
  onReorderLayers
}) => {`;
content = content.replace(oldDestruct, newDestruct);

const oldState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);

  const toggleLegend = (id: string) => {`;
const newState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = React.useState<string | null>(null);

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

  const toggleLegend = (id: string) => {`;
content = content.replace(oldState, newState);

const oldCard = `            return (
              <div
                key={layer.id}
                id={\`layer-card-\${layer.id}\`}
                onClick={() => onSelectActiveLayer(layer.id)}
                className={\`group relative hover:z-[100] rounded-xl border transition-all cursor-pointer \${
                  isActive
                    ? 'bg-slate-800/90 border-sky-500/70 shadow-lg shadow-sky-950/30 z-10'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                }\`}
              >
                {/* Main Card Header */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">`;
const newCard = `            return (
              <div
                key={layer.id}
                id={\`layer-card-\${layer.id}\`}
                draggable
                onDragStart={(e) => handleDragStart(e, layer.id)}
                onDragOver={(e) => handleDragOver(e, layer.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, layer.id)}
                onDragEnd={() => { setDraggedLayerId(null); setDragOverLayerId(null); }}
                onClick={() => onSelectActiveLayer(layer.id)}
                className={\`group relative hover:z-[100] rounded-xl border transition-all cursor-pointer \${
                  dragOverLayerId === layer.id ? 'border-t-4 border-t-sky-500 bg-sky-900/20' : ''
                } \${
                  isActive
                    ? 'bg-slate-800/90 border-sky-500/70 shadow-lg shadow-sky-950/30 z-10'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                } \${draggedLayerId === layer.id ? 'opacity-50 scale-[0.98]' : 'opacity-100'}\`}
              >
                {/* Main Card Header */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors" title="Clicar e arrastar para reordenar">
                        <GripVertical className="w-4 h-4" />
                      </div>`;
content = content.replace(oldCard, newCard);

fs.writeFileSync('src/components/LayerManager.tsx', content);
console.log('patched native dnd');
