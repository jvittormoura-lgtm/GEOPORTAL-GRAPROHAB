const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const basemapRegex = /export const BASEMAPS: BasemapOption\[\] = \[[\s\S]*?\];/m;
const newBasemaps = `export const BASEMAPS: BasemapOption[] = [
  {
    id: 'esri_dark',
    name: 'Esri Dark Gray Canvas',
    category: 'dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  },
  {
    id: 'esri_light',
    name: 'Esri Light Gray Canvas',
    category: 'light',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  },
  {
    id: 'jawg_street',
    name: 'JAWG Street',
    category: 'osm',
    url: 'https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=community',
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
    maxZoom: 22
  },
  {
    id: 'google_hybrid',
    name: 'Google Satélite Híbrido',
    category: 'satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  }
];`;

content = content.replace(basemapRegex, newBasemaps);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched basemaps');
