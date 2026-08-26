const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const basemapInsertion = `export const BASEMAPS: BasemapOption[] = [
  {
    id: 'google_roadmap',
    name: 'Google Maps (Claro / Padrão)',
    category: 'light',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },`;

content = content.replace("export const BASEMAPS: BasemapOption[] = [", basemapInsertion);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('added google roadmap');
