const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const oldGoogle = `{
    id: 'google_roadmap',
    name: 'Google Maps (Claro / Padrão)',
    category: 'light',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },`;

const newMaps = `{
    id: 'osm_hot',
    name: 'OSM Humanitário (Claro)',
    category: 'light',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  {
    id: 'esri_topo',
    name: 'Esri World Topo (Claro)',
    category: 'light',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18
  },`;

content = content.replace(oldGoogle, newMaps);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('replaced google with hot and esri topo');
