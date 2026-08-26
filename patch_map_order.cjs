const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');

const oldCode = `    // Add or update layers
    layers.forEach((layer) => {`;
    
const newCode = `    // Add or update layers (reverse to match Photoshop/QGIS top-to-bottom visual order)
    [...layers].reverse().forEach((layer) => {`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/MapComponent.tsx', content);
console.log('patched map render order');
