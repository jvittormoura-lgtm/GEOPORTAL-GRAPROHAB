const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace fieldManagerLayer state definition
content = content.replace(
  'const [fieldManagerLayer, setFieldManagerLayer] = useState<GisLayer | null>(null);',
  'const [fieldManagerLayerId, setFieldManagerLayerId] = useState<string | null>(null);\n  const fieldManagerLayer = layers.find(l => l.id === fieldManagerLayerId) || null;'
);

content = content.replace(
  'setFieldManagerLayer(target);',
  'setFieldManagerLayerId(target.id);'
);

content = content.replace(
  'setFieldManagerLayer(layer);',
  'setFieldManagerLayerId(layer.id);'
);

content = content.replace(
  'setFieldManagerLayer(activeLayer);',
  'setFieldManagerLayerId(activeLayer.id);'
);

content = content.replace(
  'setFieldManagerLayer(null);',
  'setFieldManagerLayerId(null);'
);

// Do the same for inspectorLayer
content = content.replace(
  'const [inspectorLayer, setInspectorLayer] = useState<GisLayer | null>(null);',
  'const [inspectorLayerId, setInspectorLayerId] = useState<string | null>(null);\n  const inspectorLayer = layers.find(l => l.id === inspectorLayerId) || null;'
);

content = content.replace(
  'setInspectorLayer(target);',
  'setInspectorLayerId(target.id);'
);

content = content.replace(
  'setInspectorLayer(layer);',
  'setInspectorLayerId(layer.id);'
);

content = content.replace(
  'setInspectorLayer(activeLayer);',
  'setInspectorLayerId(activeLayer.id);'
);

content = content.replace(
  'setInspectorLayer(null);',
  'setInspectorLayerId(null);'
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched to use IDs instead of objects');
