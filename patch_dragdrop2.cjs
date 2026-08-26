const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const overlayRegex = /\{\/\* Drag & Drop Visual Overlay with Password Protection Hint \*\/\}\s*\{isDraggingFile && \([\s\S]*?\}\s*\)/m;
content = content.replace(overlayRegex, "");

fs.writeFileSync('src/App.tsx', content);
console.log('patched app overlay');
