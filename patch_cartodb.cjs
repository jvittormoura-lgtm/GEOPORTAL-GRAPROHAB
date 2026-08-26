const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const oldBasemaps = `export const BASEMAPS: BasemapOption[] = [
  {
    id: 'esri_dark',`;

const newBasemaps = `export const BASEMAPS: BasemapOption[] = [
  {
    id: 'carto_positron',
    name: 'CartoDB Positron (Claro)',
    category: 'light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'esri_dark',`;

content = content.replace(oldBasemaps, newBasemaps);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched basemaps with carto');
