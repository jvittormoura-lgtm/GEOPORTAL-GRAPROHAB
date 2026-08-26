const fs = require('fs');
let content = fs.readFileSync('src/components/LayerManager.tsx', 'utf8');

const oldState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {`;
const newState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = React.useState<string | null>(null);
  const [activeDragHandleId, setActiveDragHandleId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {`;
content = content.replace(oldState, newState);

const oldCard = `              <div
                key={layer.id}
                id={\`layer-card-\${layer.id}\`}
                draggable
                onDragStart={(e) => handleDragStart(e, layer.id)}`;
const newCard = `              <div
                key={layer.id}
                id={\`layer-card-\${layer.id}\`}
                draggable={activeDragHandleId === layer.id}
                onDragStart={(e) => handleDragStart(e, layer.id)}`;
content = content.replace(oldCard, newCard);

const oldHandle = `                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors" title="Clicar e arrastar para reordenar">
                        <GripVertical className="w-4 h-4" />
                      </div>`;
const newHandle = `                      {/* Drag Handle */}
                      <div 
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors" 
                        title="Clicar e arrastar para reordenar"
                        onMouseEnter={() => setActiveDragHandleId(layer.id)}
                        onMouseLeave={() => setActiveDragHandleId(null)}
                        onPointerDown={() => setActiveDragHandleId(layer.id)}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>`;
content = content.replace(oldHandle, newHandle);

fs.writeFileSync('src/components/LayerManager.tsx', content);
console.log('patched LayerManager');
