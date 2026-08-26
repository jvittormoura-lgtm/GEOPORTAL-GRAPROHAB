const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const cartoRegex = /\{\s*id:\s*'carto_positron'[\s\S]*?subdomains:\s*\['a',\s*'b',\s*'c',\s*'d'\]\s*\},/m;
content = content.replace(cartoRegex, '');

fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('removed cartodb');
