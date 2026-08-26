const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const mapboxSectionRegex = /\{\/\* Mapbox Integration \*\/\}[\s\S]*?\{\/\* Custom XYZ Tile URL \*\/}/;
content = content.replace(mapboxSectionRegex, '{/* Custom XYZ Tile URL */}');

const xyzSectionRegex = /\{\/\* Custom XYZ Tile URL \*\/\}[\s\S]*?<\/div>\s*\{\/\* Footer \*\/\}/;
content = content.replace(xyzSectionRegex, '</div>\n        {/* Footer */}');

fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched to remove mapbox and xyz inputs');
