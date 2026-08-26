const fs = require('fs');
let content = fs.readFileSync('src/components/LayerManager.tsx', 'utf8');

// Add imports
const oldImports = `import { GisLayer, AppMode } from '../types/gis';
import { 
  Layers, Eye, EyeOff, Sliders, Filter, Table,`;
const newImports = `import { GisLayer, AppMode } from '../types/gis';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Layers, GripVertical, Eye, EyeOff, Sliders, Filter, Table,`;

content = content.replace(oldImports, newImports);

// Add onReorderLayers to props
const oldPropsInterface = `  onRenameLayer?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
}`;
const newPropsInterface = `  onRenameLayer?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
  onReorderLayers?: (activeId: string, overId: string) => void;
}`;
content = content.replace(oldPropsInterface, newPropsInterface);

// Add onReorderLayers to destructuring
const oldDestruct = `  onRenameLayer,
  onUpdateDescription
}) => {`;
const newDestruct = `  onRenameLayer,
  onUpdateDescription,
  onReorderLayers
}) => {`;
content = content.replace(oldDestruct, newDestruct);

// Add sensors and drag end handler
const oldState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);

  const toggleLegend = (id: string) => {`;
const newState = `  const [viewingDescId, setViewingDescId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (onReorderLayers) {
        onReorderLayers(active.id.toString(), over.id.toString());
      }
    }
  };

  const toggleLegend = (id: string) => {`;
content = content.replace(oldState, newState);

// Extract the layer card mapping to a sub-component string block?
// Since it's big, let's wrap `layers.map` inside `<DndContext> <SortableContext>` first,
// but we need a SortableItem component.

// Actually, I can just replace `layers.map((layer) => { ... })` by generating the whole component string or writing a script that replaces the render tree.
// Let's create `SortableLayerCard` component at the top of the file, above `export const LayerManager`.
// Wait, `SortableLayerCard` needs a ton of props because it references `onSelectActiveLayer`, `onToggleVisibility`, `expandedLegends`, `toggleLegend`, `editingLayerId`, etc.
// Instead of creating a new component outside, I can create it inside `LayerManager`! But hooks (useSortable) must be inside a functional component.
// I'll create `SortableLayerItem` as a component inside the same file (outside `LayerManager`), and pass down the needed props, or just create it outside and pass all needed handlers.
// Or I can use a simpler native HTML5 approach if this is too complex. 
